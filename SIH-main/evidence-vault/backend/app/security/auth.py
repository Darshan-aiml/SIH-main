"""Security utilities: JWT, password hashing, encryption, RBAC"""
import hashlib
from datetime import datetime, timedelta
from typing import Optional

import bcrypt as _bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.database import get_db
from app.models.user import User
from sqlalchemy.orm import Session

# JWT
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# --- File Encryption (canonical implementation in encryption.py) ---
def encrypt_file(data: bytes) -> bytes:
    from app.security.encryption import encrypt_file as _encrypt
    return _encrypt(data)


def decrypt_file(data: bytes) -> bytes:
    from app.security.encryption import decrypt_file as _decrypt
    return _decrypt(data)


# --- SHA-256 Hashing ---
def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# --- Password ---
def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


# --- JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# --- Current User Dependency ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


# --- RBAC ---
ROLE_PERMISSIONS = {
    "ADMIN": {
        "users.read", "users.write",
        "cases.read", "cases.write",
        "evidence.read", "evidence.write", "evidence.delete",
        "evidence.upload", "evidence.transfer", "evidence.verify", "evidence.version",
        "blockchain.read", "blockchain.verify",
        "audit.read",
        "ai.analyze",
        "reports.generate",
        "demo.tamper",
    },
    "INVESTIGATOR": {
        "cases.read", "cases.write",
        "evidence.read", "evidence.write",
        "evidence.upload", "evidence.transfer",
        "blockchain.read",
        "audit.read",
        "ai.analyze",
        "reports.generate",
    },
    "FORENSIC_OFFICER": {
        "cases.read",
        "evidence.read",
        "evidence.verify", "evidence.version",
        "blockchain.read",
        "ai.analyze",
        "reports.generate",
    },
    "LEGAL_OFFICER": {
        "cases.read",
        "evidence.read",
        "blockchain.read",
        "audit.read",
        "reports.generate",
    },
    "AUDITOR": {
        "cases.read",
        "evidence.read",
        "blockchain.read", "blockchain.verify",
        "audit.read",
    },
}


def check_permission(user: User, permission: str):
    perms = ROLE_PERMISSIONS.get(user.role, set())
    if permission not in perms:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user.role}' lacks permission '{permission}'"
        )


def has_permission(user: User, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(user.role, set())


def require_permission(permission: str):
    """Dependency factory for RBAC."""
    def _checker(user: User = Depends(get_current_user)):
        check_permission(user, permission)
        return user
    return _checker


def require_any_permission(*permissions: str):
    def _checker(user: User = Depends(get_current_user)):
        if not any(has_permission(user, p) for p in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' lacks required permission",
            )
        return user
    return _checker


def visible_case_ids(user: User, db: Session):
    """INVESTIGATOR sees assigned cases; others with cases.read see all."""
    from app.models.case import Case
    if user.role == "ADMIN" or user.role in {"AUDITOR", "LEGAL_OFFICER", "FORENSIC_OFFICER"}:
        return None
    rows = db.query(Case.id).filter(
        (Case.assigned_user_id == user.id) | (Case.created_by == user.id)
    ).all()
    return [r[0] for r in rows]


def ensure_case_access(user: User, case, db: Session):
    ids = visible_case_ids(user, db)
    if ids is None:
        return
    if case.id not in ids:
        raise HTTPException(status_code=403, detail="Not authorized to access this case")


def ensure_evidence_access(user: User, evidence, db: Session):
    if user.role == "ADMIN" or user.role in {"AUDITOR"}:
        return
    if user.role == "FORENSIC_OFFICER":
        # Assigned evidence: currently in their custody, or any they may verify
        if evidence.custodian_id == user.id:
            return
        # Forensic officers may view evidence belonging to open lab workflow (all cases)
        return
    if user.role == "LEGAL_OFFICER":
        return
    ids = visible_case_ids(user, db)
    if ids is not None and evidence.case_id not in ids:
        raise HTTPException(status_code=403, detail="Not authorized to access this evidence")
