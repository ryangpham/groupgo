from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class ExpenseSplitCreate(BaseModel):
    user_id: int
    owed_amount: Decimal = Field(ge=0)
    paid_amount: Decimal = Field(default=Decimal("0.00"), ge=0)


class ExpenseCreate(BaseModel):
    trip_id: int
    description: str
    amount: Decimal = Field(ge=0)
    expense_date: date
    paid_by_user_id: int
    splits: list[ExpenseSplitCreate]

    @field_validator("splits")
    @classmethod
    def validate_splits_not_empty(cls, value: list[ExpenseSplitCreate]):
        if not value:
            raise ValueError("At least one split is required")
        return value


class ExpensePaymentUpdate(BaseModel):
    paid_amount: Decimal = Field(ge=0)
