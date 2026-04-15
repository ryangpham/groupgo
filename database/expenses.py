from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal, ROUND_HALF_UP

from app.database import get_db
from app.models import Expense, Split
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseWithSplitsResponse,
    ExpenseResponse,
    SplitResponse,
    PaymentUpdate,
    TripBudgetSummary,
    UserBudgetSummary,
)

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def _to_two_decimals(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@router.post("/", response_model=ExpenseWithSplitsResponse)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    split_total = sum((Decimal(s.owed_amount) for s in payload.splits), Decimal("0.00"))
    amount = _to_two_decimals(Decimal(payload.amount))
    split_total = _to_two_decimals(split_total)

    if split_total != amount:
        raise HTTPException(
            status_code=400,
            detail=f"Split total ({split_total}) must equal expense amount ({amount})."
        )

    new_expense = Expense(
        trip_id=payload.trip_id,
        amount=amount,
        expense_date=payload.expense_date,
    )
    db.add(new_expense)
    db.flush()

    split_rows = []
    for s in payload.splits:
        split = Split(
            expense_id=new_expense.expense_id,
            user_id=s.user_id,
            trip_id=payload.trip_id,
            owed_amount=_to_two_decimals(Decimal(s.owed_amount)),
            paid_amount=_to_two_decimals(Decimal(s.paid_amount)),
        )
        db.add(split)
        split_rows.append(split)

    db.commit()
    db.refresh(new_expense)

    return ExpenseWithSplitsResponse(
        expense=ExpenseResponse.model_validate(new_expense),
        splits=[SplitResponse.model_validate(s) for s in split_rows]
    )


@router.get("/trip/{trip_id}", response_model=list[ExpenseWithSplitsResponse])
def get_trip_expenses(trip_id: int, db: Session = Depends(get_db)):
    expenses = (
        db.query(Expense)
        .filter(Expense.trip_id == trip_id)
        .order_by(Expense.expense_date.desc(), Expense.expense_id.desc())
        .all()
    )

    result = []
    for expense in expenses:
        splits = (
            db.query(Split)
            .filter(Split.expense_id == expense.expense_id, Split.trip_id == trip_id)
            .all()
        )

        result.append(
            ExpenseWithSplitsResponse(
                expense=ExpenseResponse.model_validate(expense),
                splits=[SplitResponse.model_validate(s) for s in splits]
            )
        )

    return result


@router.patch("/{expense_id}/users/{user_id}/payment", response_model=SplitResponse)
def update_payment(expense_id: int, user_id: int, payload: PaymentUpdate, db: Session = Depends(get_db)):
    split = (
        db.query(Split)
        .filter(Split.expense_id == expense_id, Split.user_id == user_id)
        .first()
    )

    if not split:
        raise HTTPException(status_code=404, detail="Split record not found.")

    split.paid_amount = _to_two_decimals(Decimal(payload.paid_amount))
    db.commit()
    db.refresh(split)

    return SplitResponse.model_validate(split)


@router.get("/summary/{trip_id}", response_model=TripBudgetSummary)
def get_trip_budget_summary(trip_id: int, db: Session = Depends(get_db)):
    total_expenses = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.trip_id == trip_id)
        .scalar()
    )

    total_owed = (
        db.query(func.coalesce(func.sum(Split.owed_amount), 0))
        .filter(Split.trip_id == trip_id)
        .scalar()
    )

    total_paid = (
        db.query(func.coalesce(func.sum(Split.paid_amount), 0))
        .filter(Split.trip_id == trip_id)
        .scalar()
    )

    member_rows = (
        db.query(
            Split.user_id,
            func.coalesce(func.sum(Split.owed_amount), 0).label("total_owed"),
            func.coalesce(func.sum(Split.paid_amount), 0).label("total_paid"),
        )
        .filter(Split.trip_id == trip_id)
        .group_by(Split.user_id)
        .order_by(Split.user_id)
        .all()
    )

    members = []
    for row in member_rows:
        owed = _to_two_decimals(Decimal(row.total_owed))
        paid = _to_two_decimals(Decimal(row.total_paid))
        balance = _to_two_decimals(paid - owed)

        members.append(
            UserBudgetSummary(
                user_id=row.user_id,
                total_owed=owed,
                total_paid=paid,
                balance=balance,
            )
        )

    return TripBudgetSummary(
        trip_id=trip_id,
        total_expenses=_to_two_decimals(Decimal(total_expenses)),
        total_owed=_to_two_decimals(Decimal(total_owed)),
        total_paid=_to_two_decimals(Decimal(total_paid)),
        members=members,
    )