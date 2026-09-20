"""Audit log model"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(255), default="")
    role = Column(String(50), default="")
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), default="")
    resource_id = Column(String(100), default="")
    ip_address = Column(String(50), default="127.0.0.1")
    status = Column(String(50), default="SUCCESS")
    details = Column(Text, default="")
