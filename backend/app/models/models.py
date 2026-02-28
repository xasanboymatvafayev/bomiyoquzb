from sqlalchemy import Column, Integer, BigInteger, String, Numeric, DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.orm import relationship
import enum
import uuid

from app.core.database import Base


class TransactionType(str, enum.Enum):
    deposit = "deposit"
    stars = "stars"
    premium = "premium"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(64), nullable=True)
    balance = Column(Numeric(12, 2), default=0)
    stars = Column(Integer, default=0)
    premium_expire = Column(DateTime, nullable=True)
    referral_code = Column(String(16), unique=True, default=lambda: uuid.uuid4().hex[:8])
    referred_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    transactions = relationship("Transaction", back_populates="user")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    external_id = Column(String(128), nullable=True, index=True)
    type = Column(SAEnum(TransactionType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    stars_amount = Column(Integer, nullable=True)
    period = Column(String(16), nullable=True)
    status = Column(SAEnum(TransactionStatus), default=TransactionStatus.pending)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="transactions")
