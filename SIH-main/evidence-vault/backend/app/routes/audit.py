"""Audit log routes"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas import AuditLogOut
from app.security.auth import require_permission

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    action: Optional[str] = None,
    user_email: Optional[str] = None,
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(require_permission("audit.read")),
    db: Session = Depends(get_db),
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if user_email:
        q = q.filter(AuditLog.user_email.ilike(f"%{user_email}%"))
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if status:
        q = q.filter(AuditLog.status == status)

    logs = q.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return [AuditLogOut.model_validate(l) for l in logs]
