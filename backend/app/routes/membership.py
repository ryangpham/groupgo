from typing import Any, cast

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.memberships import MembershipCreate, MembershipUpdate

router = APIRouter(tags = ["memberships"])

def raise_not_found():
    raise HTTPException(status_code=404, detail = "Membership not found")

def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(status_code=400, detail = "Request violates database constraints") from exc

@router.get("/memberships")
def list_roles():
    return fetch_all(
        """
        SELECT user_id, trip_id, role_id, joined_at
        FROM memberships
        ORDER BY user_id NULLS LAST, trip_id
        """
    )

@router.get("/users/{user_id}/memberships")
def get_user_memberships(user_id: int):
    return fetch_all(
        """
        SELECT user_id, trip_id, role_id, joined_at
        FROM memberships
        WHERE user_id = :user_id
        ORDER BY user_id NULLS LAST, trip_id
        """,
        {"user_id": user_id}
    )

@router.post("/memberships", status_code=201)
def create_membership(membership: MembershipCreate):
    try:
        return execute_returning(
            """
            INSERT INTO memberships (user_id, trip_id, role_id)
            VALUES(:user_id, :trip_id, :role_id)
            RETURNING user_id, trip_id, role_id, joined_at
            """,
            membership.model_dump()
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)

@router.patch("/memberships/{user_id}/{trip_id}")
def update_membership(user_id: int, trip_id: int, membership: MembershipUpdate):
    existing_membership = fetch_one(
        """
        SELECT user_id, trip_id, role_id, joined_at
        FROM memberships
        WHERE user_id = :user_id AND trip_id = :trip_id
        """,
        {
            "user_id": user_id,
            "trip_id": trip_id
         }
    )
    if existing_membership is None:
        raise_not_found()

    membership_row = cast(dict[str, Any], existing_membership)

    updated_values = {
        "user_id": user_id,
        "trip_id": trip_id,
        "role_id": membership.role_id if membership.role_id is not None else membership_row["role_id"],
        "joined_at": membership.joined_at if membership.joined_at is not None else membership_row["joined_at"]
    }

    try:
        return execute_returning(
            """
            UPDATE memberships
            SET role_id = :role_id,
                joined_at = :joined_at
            WHERE user_id = :user_id AND trip_id = :trip_id
            RETURNING user_id, trip_id, role_id, joined_at
            """,
            updated_values
        )

    except IntegrityError as exc:
        handle_integrity_error(exc)

@router.delete("/memberships/{user_id}/{trip_id}")
def delete_membership(user_id: int, trip_id: int):
    deleted_membership = execute_returning(
        """
        DELETE FROM memberships
        WHERE user_id = :user_id AND trip_id = :trip_id
        RETURNING user_id, trip_id, role_id, joined_at
        """,
        {
            "user_id": user_id,
            "trip_id": trip_id
        }
    )
    if not deleted_membership:
        raise_not_found()
    return deleted_membership
