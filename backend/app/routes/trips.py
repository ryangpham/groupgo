from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.trips import TripCreate, TripUpdate
from app.security import get_current_user

router = APIRouter(tags=["trips"])


def raise_not_found():
    raise HTTPException(status_code=404, detail="Trip not found")


def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(
        status_code=400,
        detail="Request violates database constraints"
    ) from exc


@router.get("/trips")
def list_trips(_current_user: dict = Depends(get_current_user)):
    return fetch_all(
        """
        SELECT t.trip_id,
               t.trip_name,
               t.start_date,
               t.end_date,
               t.owner_user_id,
               t.destination_text,
               t.destination_lat,
               t.destination_lng,
               COUNT(m.user_id) AS member_count
        FROM trips t
        LEFT JOIN memberships m ON m.trip_id = t.trip_id
        GROUP BY t.trip_id,
                 t.trip_name,
                 t.start_date,
                 t.end_date,
                 t.owner_user_id,
                 t.destination_text,
                 t.destination_lat,
                 t.destination_lng
        ORDER BY t.start_date NULLS LAST, t.trip_name
        """
    )


@router.get("/trips/{trip_id}")
def get_trip(trip_id: int, _current_user: dict = Depends(get_current_user)):
    trip = fetch_one(
        """
        SELECT t.trip_id,
               t.trip_name,
               t.start_date,
               t.end_date,
               t.owner_user_id,
               t.destination_text,
               t.destination_lat,
               t.destination_lng,
               COUNT(m.user_id) AS member_count
        FROM trips t
        LEFT JOIN memberships m ON m.trip_id = t.trip_id
        WHERE t.trip_id = :trip_id
        GROUP BY t.trip_id,
                 t.trip_name,
                 t.start_date,
                 t.end_date,
                 t.owner_user_id,
                 t.destination_text,
                 t.destination_lat,
                 t.destination_lng
        """,
        {"trip_id": trip_id}
    )
    if not trip:
        raise_not_found()
    return trip


@router.get("/users/{user_id}/trips")
def get_user_trips(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="You do not have access to these trips")

    return fetch_all(
        """
        SELECT t.trip_id,
               t.trip_name,
               t.start_date,
               t.end_date,
               t.owner_user_id,
               t.destination_text,
               t.destination_lat,
               t.destination_lng,
               COUNT(all_members.user_id) AS member_count
        FROM memberships m
        JOIN trips t ON m.trip_id = t.trip_id
        LEFT JOIN memberships all_members ON all_members.trip_id = t.trip_id
        WHERE m.user_id = :user_id
        GROUP BY t.trip_id,
                 t.trip_name,
                 t.start_date,
                 t.end_date,
                 t.owner_user_id,
                 t.destination_text,
                 t.destination_lat,
                 t.destination_lng
        ORDER BY t.start_date NULLS LAST, t.trip_name
        """,
        {"user_id": user_id}
    )


@router.post("/trips", status_code=201)
def create_trip(trip: TripCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_id"] != trip.owner_user_id:
        raise HTTPException(status_code=403, detail="You cannot create trips for another user")

    try:
        created_trip = execute_returning(
            """
            INSERT INTO trips(
                trip_name,
                start_date,
                end_date,
                owner_user_id,
                destination_text,
                destination_lat,
                destination_lng
            )
            VALUES (
                :trip_name,
                :start_date,
                :end_date,
                :owner_user_id,
                :destination_text,
                :destination_lat,
                :destination_lng
            )
            RETURNING trip_id,
                      trip_name,
                      start_date,
                      end_date,
                      owner_user_id,
                      destination_text,
                      destination_lat,
                      destination_lng,
                      1 AS member_count
            """,
            trip.model_dump()
        )

        if created_trip is None:
            raise HTTPException(status_code=500, detail="Trip could not be created")

        new_trip = cast(dict[str, Any], created_trip)

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
            VALUES (:user_id, :trip_id, :role_id)
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
def update_trip(trip_id: int, trip: TripUpdate, current_user: dict = Depends(get_current_user)):
    existing_trip = fetch_one(
        """
        SELECT trip_id,
               trip_name,
               start_date,
               end_date,
               owner_user_id,
               destination_text,
               destination_lat,
               destination_lng
        FROM trips
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id}
    )

    if existing_trip is None:
        raise_not_found()

    trip_row = cast(dict[str, Any], existing_trip)

    if trip_row["owner_user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You do not have access to update this trip")

    updated_values = {
        "trip_id": trip_id,
        "trip_name": trip.trip_name if trip.trip_name is not None else trip_row["trip_name"],
        "start_date": trip.start_date if trip.start_date is not None else trip_row["start_date"],
        "end_date": trip.end_date if trip.end_date is not None else trip_row["end_date"],
        "owner_user_id": trip.owner_user_id if trip.owner_user_id is not None else trip_row["owner_user_id"],
        "destination_text": (
            trip.destination_text if trip.destination_text is not None else trip_row["destination_text"]
        ),
        "destination_lat": (
            trip.destination_lat if trip.destination_lat is not None else trip_row["destination_lat"]
        ),
        "destination_lng": (
            trip.destination_lng if trip.destination_lng is not None else trip_row["destination_lng"]
        ),
    }

    try:
        return execute_returning(
            """
            UPDATE trips
            SET trip_name = :trip_name,
                start_date = :start_date,
                end_date = :end_date,
                owner_user_id = :owner_user_id,
                destination_text = :destination_text,
                destination_lat = :destination_lat,
                destination_lng = :destination_lng
            WHERE trip_id = :trip_id
            RETURNING trip_id,
                      trip_name,
                      start_date,
                      end_date,
                      owner_user_id,
                      destination_text,
                      destination_lat,
                      destination_lng
            """,
            updated_values,
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.delete("/trips/{trip_id}")
def delete_trip(trip_id: int, current_user: dict = Depends(get_current_user)):
    existing_trip = fetch_one(
        """
        SELECT trip_id, owner_user_id
        FROM trips
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id},
    )

    if not existing_trip:
        raise_not_found()

    trip_row = cast(dict[str, Any], existing_trip)

    if trip_row["owner_user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You do not have access to delete this trip")

    deleted_trip = execute_returning(
        """
        DELETE FROM trips
        WHERE trip_id = :trip_id
        RETURNING trip_id,
                  trip_name,
                  start_date,
                  end_date,
                  owner_user_id,
                  destination_text,
                  destination_lat,
                  destination_lng
        """,
        {"trip_id": trip_id},
    )

    if not deleted_trip:
        raise_not_found()

    return deleted_trip