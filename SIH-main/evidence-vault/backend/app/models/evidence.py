"""Evidence, Version, Custody, and Relationship models"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from app.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(50), unique=True, index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    original_filename = Column(String(500), nullable=False)
    stored_filename = Column(String(500), default="")
    evidence_type = Column(String(100), default="DOCUMENT")
    file_type = Column(String(50), default="DOCUMENT")
    mime_type = Column(String(100), default="")
    file_size = Column(Integer, default=0)
    sha256_hash = Column(String(64), nullable=False)
    encrypted_path = Column(String(1000), nullable=False)
    current_version = Column(Integer, default=1)
    status = Column(String(50), default="REGISTERED")
    current_custodian = Column(String(255), default="")
    custodian_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    classification = Column(String(100), default="UNCLASSIFIED")
    ai_confidence = Column(Float, default=0.0)
    integrity_status = Column(String(50), default="VERIFIED")
    blockchain_status = Column(String(50), default="REGISTERED")
    custody_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    description = Column(Text, default="")
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EvidenceVersion(Base):
    __tablename__ = "evidence_versions"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    filename = Column(String(500), default="")
    sha256_hash = Column(String(64), nullable=False)
    encrypted_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, default=0)
    action = Column(String(100), default="UPLOADED")
    reason = Column(Text, default="")
    change_reason = Column(Text, default="")
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), default="")
    uploaded_by = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class CustodyEvent(Base):
    __tablename__ = "custody_events"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    location = Column(String(255), default="Digital Evidence Lab")
    evidence_condition = Column(String(100), default="INTACT")
    notes = Column(Text, default="")
    sha256_hash = Column(String(64), default="")
    timestamp = Column(DateTime, default=datetime.utcnow)


class EvidenceRelationship(Base):
    __tablename__ = "evidence_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=False)
    target_evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=True)
    target_case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    relationship_type = Column(String(50), nullable=False)  # BELONGS_TO, REFERENCES, etc.
    label = Column(String(255), default="")
    node_type = Column(String(50), default="EVIDENCE")  # CASE, EVIDENCE, PERSON, LOCATION, etc.
    node_label = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
