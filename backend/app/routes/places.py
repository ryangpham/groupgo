from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.places import PlaceCreate, PlaceUpdate
from app.security import get_current_user

router = APIRouter(tags=["places"])


def raise_place_not_found():
    raise HTTPException(status_code=404, detail="Place not found")


def raise_trip_not_found():
    raise HTTPException(status_code=404, detail="Trip not found")


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

    if trip["owner_user_id"] == current_user["user_id"]:
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


def get_place_row(place_id: int):
    place = fetch_one(
        """
        SELECT place_id, trip_id, place_name, address, rating, place_type
        FROM places
        WHERE place_id = :place_id
        """,
        {"place_id": place_id},
    )
    if place is None:
        raise_place_not_found()
    return cast(dict[str, Any], place)


@router.get("/trips/{trip_id}/places")
def list_trip_places(trip_id: int, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(trip_id, current_user)
    return fetch_all(
        """
        SELECT place_id, trip_id, place_name, address, rating, place_type
        FROM places
        WHERE trip_id = :trip_id
        ORDER BY place_name, place_id
        """,
        {"trip_id": trip_id},
    )


@router.get("/places/{place_id}")
def get_place(place_id: int, current_user: dict = Depends(get_current_user)):
    place = get_place_row(place_id)
    ensure_trip_access(place["trip_id"], current_user)
    return place


@router.post("/places", status_code=201)
def create_place(place: PlaceCreate, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(place.trip_id, current_user)

    try:
        return execute_returning(
            """
            INSERT INTO places (trip_id, place_name, address, rating, place_type)
            VALUES (:trip_id, :place_name, :address, :rating, :place_type)
            RETURNING place_id, trip_id, place_name, address, rating, place_type
            """,
            place.model_dump(),
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.put("/places/{place_id}")
def update_place(place_id: int, place: PlaceUpdate, current_user: dict = Depends(get_current_user)):
    existing_place = get_place_row(place_id)
    ensure_trip_access(existing_place["trip_id"], current_user)

    updates = place.model_dump(exclude_unset=True)
    updated_values = {**existing_place, **updates, "place_id": place_id}

    ensure_trip_access(updated_values["trip_id"], current_user)

    try:
        return execute_returning(
            """
            UPDATE places
            SET trip_id = :trip_id,
                place_name = :place_name,
                address = :address,
                rating = :rating,
                place_type = :place_type
            WHERE place_id = :place_id
            RETURNING place_id, trip_id, place_name, address, rating, place_type
            """,
            updated_values,
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.delete("/places/{place_id}")
def delete_place(place_id: int, current_user: dict = Depends(get_current_user)):
    existing_place = get_place_row(place_id)
    ensure_trip_access(existing_place["trip_id"], current_user)

    execute_returning(
        """
        UPDATE reservations
        SET place_id = NULL
        WHERE place_id = :place_id
        RETURNING reservation_id
        """,
        {"place_id": place_id},
    )

    deleted_place = execute_returning(
        """
        DELETE FROM places
        WHERE place_id = :place_id
        RETURNING place_id, trip_id, place_name, address, rating, place_type
        """,
        {"place_id": place_id},
    )
    if deleted_place is None:
        raise_place_not_found()
    return deleted_place
