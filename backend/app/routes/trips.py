from typing import Any, cast

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.trips import TripCreate, TripUpdate

router = APIRouter(tags=["trips"])

def raise_not_found():
    raise HTTPException(status_code = 404, detail = "Trip not found")

def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(status_code = 400, detail = "Request violates database constraints") from exc

@router.get("/trips")
def list_trips():
    return fetch_all(
        """
        SELECT trip_id, trip_name, start_date, end_date, owner_user_id
        FROM trips
        ORDER BY start_date NULLS LAST, trip_name
        """
    )

@router.get("/trips/{trip_id}")
def get_trip(trip_id: int):
    trip = fetch_one(
        """
        SELECT trip_id, trip_name, start_date, end_date, owner_user_id
        FROM trips
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id}
    )
    if not trip:
        raise_not_found()
    return trip

@router.get("/users/{user_id}/trips")
def get_user_trips(user_id: int):
    return fetch_all(
        """
        SELECT t.trip_id, t.trip_name, t.start_date, t.end_date, t.owner_user_id
        FROM memberships m
        JOIN trips t ON m.trip_id = t.trip_id
        WHERE m.user_id = :user_id
        """,
        {"user_id": user_id}
    )


@router.post("/trips", status_code = 201)
def create_trip(trip: TripCreate):
    try:
        new_trip = execute_returning(
            """
            INSERT INTO trips(trip_name, start_date, end_date, owner_user_id)
            VALUES (:trip_name, :start_date, :end_date, :owner_user_id)
            RETURNING trip_id, trip_name, start_date, end_date, owner_user_id
            """,
            trip.model_dump()
        )

        owner_role = fetch_one(
            """
            SELECT role_id
            FROM roles
            WHERE role_name = 'owner'
            """
        )

        if owner_role is None:
            raise HTTPException(status_code=500, detail="Owner role not found")

        execute_returning(
            """
            INSERT INTO memberships(user_id, trip_id, role_id)
            VALUES(:user_id, :trip_id, :role_id)
            RETURNING user_id, trip_id, role_id, joined_at
            """,
            {
                "user_id": new_trip["owner_user_id"],
                "trip_id": new_trip["trip_id"],
                "role_id": owner_role["role_id"]
            }
        )

        return new_trip

    except IntegrityError as exc:
        handle_integrity_error(exc)

@router.put("/trips/{trip_id}")
def update_trip(trip_id: int, trip: TripUpdate):
    existing_trip = fetch_one(
        """
        SELECT trip_id, trip_name, start_date, end_date, owner_user_id
        FROM trips
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id}
    )
    if existing_trip is None:
        raise_not_found()

    trip_row = cast(dict[str, Any], existing_trip)

    updated_values = {
        "trip_id": trip_id,
        "trip_name": trip.trip_name if trip.trip_name is not None else trip_row["trip_name"],
        "start_date": trip.start_date if trip.start_date is not None else trip_row["start_date"],
        "end_date": trip.end_date if trip.end_date is not None else trip_row["end_date"],
        "owner_user_id": trip.owner_user_id if trip.owner_user_id is not None else trip_row["owner_user_id"],
    }

    try:
        return execute_returning(
            """
            UPDATE trips 
            SET trip_name = :trip_name,
                start_date = :start_date,
                end_date = :end_date,
                owner_user_id = :owner_user_id
            WHERE trip_id = :trip_id
            RETURNING trip_id, trip_name, start_date, end_date, owner_user_id
            """,
            updated_values,
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.delete("/trips/{trip_id}")
def delete_trip(trip_id: int):
    deleted_trip = execute_returning(
        """
        DELETE FROM trips
        WHERE trip_id = :trip_id
        RETURNING trip_id, trip_name, start_date, end_date, owner_user_id
        """,
        {"trip_id": trip_id},
    )
    if not deleted_trip:
        raise_not_found()
    return deleted_trip