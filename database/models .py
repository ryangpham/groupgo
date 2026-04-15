from sqlalchemy import Column, Integer, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import date


class Expense(Base):
    __tablename__ = "expense"

    expense_id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trip.trip_id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    expense_date = Column(Date, nullable=False, default=date.today)

    splits = relationship("Split", back_populates="expense", cascade="all, delete-orphan")


class Split(Base):
    __tablename__ = "split"

    expense_id = Column(Integer, ForeignKey("expense.expense_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), primary_key=True)
    trip_id = Column(Integer, ForeignKey("trip.trip_id", ondelete="CASCADE"), primary_key=True)
    owed_amount = Column(Numeric(10, 2), nullable=False, default=0)
    paid_amount = Column(Numeric(10, 2), nullable=False, default=0)

    expense = relationship("Expense", back_populates="splits")