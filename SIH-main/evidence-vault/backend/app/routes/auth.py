"""Authentication routes"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas import LoginRequest, TokenResponse, UserOut
from app.security.auth import (
    verify_password, create_access_token, get_current_user,
)
from app.utils.helpers import create_audit_log

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        create_audit_log(db, action="LOGIN", status="FAILED",
                        details=f"Failed login attempt for {req.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    user.last_login = datetime.utcnow()
    db.commit()

    create_audit_log(db, user_id=user.id, user_email=user.email,
                    role=user.role, action="LOGIN", status="SUCCESS")

    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
