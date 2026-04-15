from decimal import Decimal, ROUND_HALF_UP
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.database import engine, execute_returning, fetch_all, fetch_one
from app.schemas.expenses import ExpenseCreate, ExpensePaymentUpdate
from app.security import get_current_user

router = APIRouter(tags=["expenses"])


def to_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def raise_trip_not_found():
    raise HTTPException(status_code=404, detail="Trip not found")


def raise_expense_not_found():
    raise HTTPException(status_code=404, detail="Expense not found")


def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(status_code=400, detail="Request violates database constraints") from exc


def ensure_trip_access(trip_id: int, current_user: dict[str, Any]):
    trip = fetch_one(
        """
        SELECT trip_id, owner_user_id
        FROM trips
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id},
    )
    if trip is None:
        raise_trip_not_found()

    trip_row = cast(dict[str, Any], trip)
    if trip_row["owner_user_id"] == current_user["user_id"]:
        return

    membership = fetch_one(
        """
        SELECT user_id
        FROM memberships
        WHERE trip_id = :trip_id AND user_id = :user_id
        """,
        {"trip_id": trip_id, "user_id": current_user["user_id"]},
    )
    if membership is None:
        raise HTTPException(status_code=403, detail="You do not have access to this trip")


def ensure_trip_member(trip_id: int, user_id: int):
    membership = fetch_one(
        """
        SELECT user_id
        FROM memberships
        WHERE trip_id = :trip_id AND user_id = :user_id
        """,
        {"trip_id": trip_id, "user_id": user_id},
    )
    if membership is None:
        raise HTTPException(status_code=400, detail="Expense users must belong to the trip")


def get_expense_row(expense_id: int):
    expense = fetch_one(
        """
        SELECT expense_id, trip_id, description, amount, expense_date, paid_by_user_id
        FROM expenses
        WHERE expense_id = :expense_id
        """,
        {"expense_id": expense_id},
    )
    if expense is None:
        raise_expense_not_found()
    return cast(dict[str, Any], expense)


def build_trip_expenses(trip_id: int):
    expense_rows = fetch_all(
        """
        SELECT e.expense_id,
               e.trip_id,
               e.description,
               e.amount,
               e.expense_date,
               e.paid_by_user_id,
               u.display_name AS paid_by_name
        FROM expenses e
        JOIN users u ON u.user_id = e.paid_by_user_id
        WHERE e.trip_id = :trip_id
        ORDER BY e.expense_date DESC, e.expense_id DESC
        """,
        {"trip_id": trip_id},
    )

    if not expense_rows:
        return []

    split_rows = fetch_all(
        """
        SELECT s.expense_id,
               s.user_id,
               s.owed_amount,
               s.paid_amount,
               u.display_name AS user_name
        FROM expense_splits s
        JOIN users u ON u.user_id = s.user_id
        WHERE s.expense_id IN (
            SELECT expense_id
            FROM expenses
            WHERE trip_id = :trip_id
        )
        ORDER BY s.expense_id, u.display_name
        """,
        {"trip_id": trip_id},
    )

    splits_by_expense: dict[int, list[dict[str, Any]]] = {}
    for split in split_rows:
        expense_id = int(split["expense_id"])
        splits_by_expense.setdefault(expense_id, []).append(dict(split))

    return [
        {
            "expense": dict(expense_row),
            "splits": splits_by_expense.get(int(expense_row["expense_id"]), []),
        }
        for expense_row in expense_rows
    ]


@router.get("/trips/{trip_id}/expenses")
def list_trip_expenses(trip_id: int, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(trip_id, current_user)
    return build_trip_expenses(trip_id)


@router.get("/trips/{trip_id}/expenses/summary")
def get_trip_expense_summary(trip_id: int, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(trip_id, current_user)

    summary = fetch_one(
        """
        SELECT
            COALESCE((SELECT SUM(amount) FROM expenses WHERE trip_id = :trip_id), 0) AS total_expenses,
            COALESCE((SELECT SUM(owed_amount) FROM expense_splits es JOIN expenses e ON e.expense_id = es.expense_id WHERE e.trip_id = :trip_id), 0) AS total_owed,
            COALESCE((SELECT SUM(paid_amount) FROM expense_splits es JOIN expenses e ON e.expense_id = es.expense_id WHERE e.trip_id = :trip_id), 0) AS total_paid
        """,
        {"trip_id": trip_id},
    )

    members = fetch_all(
        """
        SELECT es.user_id,
               u.display_name AS user_name,
               COALESCE(SUM(es.owed_amount), 0) AS total_owed,
               COALESCE(SUM(es.paid_amount), 0) AS total_paid,
               COALESCE(SUM(es.paid_amount - es.owed_amount), 0) AS balance
        FROM expense_splits es
        JOIN expenses e ON e.expense_id = es.expense_id
        JOIN users u ON u.user_id = es.user_id
        WHERE e.trip_id = :trip_id
        GROUP BY es.user_id, u.display_name
        ORDER BY u.display_name
        """,
        {"trip_id": trip_id},
    )

    return {
        "trip_id": trip_id,
        **dict(summary or {}),
        "members": members,
    }


@router.post("/expenses", status_code=201)
def create_expense(expense: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(expense.trip_id, current_user)
    ensure_trip_member(expense.trip_id, expense.paid_by_user_id)

    amount = to_money(expense.amount)
    split_total = to_money(sum((split.owed_amount for split in expense.splits), Decimal("0.00")))
    if split_total != amount:
        raise HTTPException(status_code=400, detail="Split total must equal expense amount")

    for split in expense.splits:
        ensure_trip_member(expense.trip_id, split.user_id)

    payload = expense.model_dump()
    payload["amount"] = amount

    try:
        with engine.begin() as connection:
            expense_row = connection.execute(
                text(
                    """
                    INSERT INTO expenses (trip_id, description, amount, expense_date, paid_by_user_id)
                    VALUES (:trip_id, :description, :amount, :expense_date, :paid_by_user_id)
                    RETURNING expense_id, trip_id, description, amount, expense_date, paid_by_user_id
                    """
                ),
                payload,
            ).mappings().first()

            if expense_row is None:
                raise HTTPException(status_code=500, detail="Expense could not be created")

            for split in expense.splits:
                connection.execute(
                    text(
                        """
                        INSERT INTO expense_splits (expense_id, user_id, owed_amount, paid_amount)
                        VALUES (:expense_id, :user_id, :owed_amount, :paid_amount)
                        """
                    ),
                    {
                        "expense_id": expense_row["expense_id"],
                        "user_id": split.user_id,
                        "owed_amount": to_money(split.owed_amount),
                        "paid_amount": to_money(split.paid_amount),
                    },
                )
    except IntegrityError as exc:
        handle_integrity_error(exc)

    created_expenses = build_trip_expenses(expense.trip_id)
    created_expense = next(
        (row for row in created_expenses if int(row["expense"]["expense_id"]) == int(expense_row["expense_id"])),
        None,
    )
    if created_expense is None:
        raise HTTPException(status_code=500, detail="Expense could not be loaded after creation")
    return created_expense


@router.patch("/expenses/{expense_id}/splits/{user_id}/payment")
def update_expense_payment(
    expense_id: int,
    user_id: int,
    payload: ExpensePaymentUpdate,
    current_user: dict = Depends(get_current_user),
):
    expense = get_expense_row(expense_id)
    ensure_trip_access(int(expense["trip_id"]), current_user)

    updated_split = execute_returning(
        """
        UPDATE expense_splits
        SET paid_amount = :paid_amount
        WHERE expense_id = :expense_id AND user_id = :user_id
        RETURNING expense_id, user_id, owed_amount, paid_amount
        """,
        {
            "expense_id": expense_id,
            "user_id": user_id,
            "paid_amount": to_money(payload.paid_amount),
        },
    )
    if updated_split is None:
        raise HTTPException(status_code=404, detail="Split record not found")
    return updated_split
