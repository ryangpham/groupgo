from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import date
from decimal import Decimal


class SplitCreate(BaseModel):
    user_id: int
    owed_amount: Decimal = Field(ge=0)
    paid_amount: Decimal = Field(default=Decimal("0.00"), ge=0)


class ExpenseCreate(BaseModel):
    trip_id: int
    amount: Decimal = Field(ge=0)
    expense_date: date
    splits: List[SplitCreate]

    @field_validator("splits")
    @classmethod
    def validate_splits_not_empty(cls, value):
        if not value:
            raise ValueError("At least one split is required.")
        return value


class PaymentUpdate(BaseModel):
    paid_amount: Decimal = Field(ge=0)


class ExpenseResponse(BaseModel):
    expense_id: int
    trip_id: int
    amount: Decimal
    expense_date: date

    class Config:
        from_attributes = True


class SplitResponse(BaseModel):
    expense_id: int
    user_id: int
    trip_id: int
    owed_amount: Decimal
    paid_amount: Decimal

    class Config:
        from_attributes = True


class ExpenseWithSplitsResponse(BaseModel):
    expense: ExpenseResponse
    splits: List[SplitResponse]


class UserBudgetSummary(BaseModel):
    user_id: int
    total_owed: Decimal
    total_paid: Decimal
    balance: Decimal


class TripBudgetSummary(BaseModel):
    trip_id: int
    total_expenses: Decimal
    total_owed: Decimal
    total_paid: Decimal
    members: List[UserBudgetSummary]