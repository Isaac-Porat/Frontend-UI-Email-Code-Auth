from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    verification_codes = relationship("VerificationCodeModel", back_populates="user")

class VerificationCodeModel(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    code = Column(String)
    expires_at = Column(DateTime)

    user = relationship("UserModel", back_populates="verification_codes")