"""Case management routes"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.user import User
from app.schemas import CaseCreate, CaseUpdate, CaseOut
from app.security.auth import get_current_user, require_permission
from app.utils.helpers import generate_case_number, create_audit_log

router = APIRouter(prefix="/api/cases", tags=["Cases"])


@router.get("", response_model=list[CaseOut])
def list_cases(
    status: Optional[str] = None,
    case_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(require_permission("cases.read")),
    db: Session = Depends(get_db),
):
    q = db.query(Case)
    if status:
        q = q.filter(Case.status == status)
    if case_type:
        q = q.filter(Case.case_type == case_type)
    if search:
        q = q.filter(
            (Case.title.ilike(f"%{search}%")) |
            (Case.case_number.ilike(f"%{search}%")) |
            (Case.description.ilike(f"%{search}%"))
        )
    cases = q.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for c in cases:
        out = CaseOut.model_validate(c)
        out.evidence_count = db.query(Evidence).filter(Evidence.case_id == c.id).count()
        result.append(out)
    return result


@router.post("", response_model=CaseOut)
def create_case(
    req: CaseCreate,
    user: User = Depends(require_permission("cases.write")),
    db: Session = Depends(get_db),
):
    case = Case(
        case_number=generate_case_number(db),
        title=req.title,
        description=req.description,
        case_type=req.case_type,
        priority=req.priority,
        investigating_officer=req.investigating_officer or user.full_name,
        assigned_user_id=user.id,
        created_by=user.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    create_audit_log(db, user_id=user.id, user_email=user.email, role=user.role,
                    action="CASE_CREATED", resource_type="CASE",
                    resource_id=case.case_number)

    out = CaseOut.model_validate(case)
    out.evidence_count = 0
    return out


@router.get("/{case_id}", response_model=CaseOut)
def get_case(
    case_id: int,
    user: User = Depends(require_permission("cases.read")),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    out = CaseOut.model_validate(case)
    out.evidence_count = db.query(Evidence).filter(Evidence.case_id == case.id).count()
    return out


@router.put("/{case_id}", response_model=CaseOut)
def update_case(
    case_id: int,
    req: CaseUpdate,
    user: User = Depends(require_permission("cases.write")),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)

    create_audit_log(db, user_id=user.id, user_email=user.email, role=user.role,
                    action="CASE_UPDATED", resource_type="CASE",
                    resource_id=case.case_number)

    out = CaseOut.model_validate(case)
    out.evidence_count = db.query(Evidence).filter(Evidence.case_id == case.id).count()
    return out


@router.get("/{case_id}/evidence")
def list_case_evidence(
    case_id: int,
    user: User = Depends(require_permission("evidence.read")),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidences = db.query(Evidence).filter(Evidence.case_id == case_id).order_by(Evidence.created_at.desc()).all()
    from app.routes.evidence import _evidence_to_out
    return [_evidence_to_out(e, db) for e in evidences]

