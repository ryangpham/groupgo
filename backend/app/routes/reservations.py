from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.reservations import ReservationCreate, ReservationUpdate
from app.security import get_current_user

router = APIRouter(tags=["reservations"])


def raise_not_found():
    raise HTTPException(status_code=404, detail="Reservation not found")


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


def validate_place_link(trip_id: int, place_id: int | None):
    if place_id is None:
        return

    place = fetch_one(
        """
        SELECT place_id, trip_id
        FROM places
        WHERE place_id = :place_id
        """,
        {"place_id": place_id},
    )
    if place is None:
        raise HTTPException(status_code=400, detail="Referenced place does not exist")

    if place["trip_id"] != trip_id:
        raise HTTPException(status_code=400, detail="Referenced place must belong to the same trip")


@router.get("/reservations")
def list_reservations(current_user: dict = Depends(get_current_user)):
    return fetch_all(
        """
        SELECT r.reservation_id, r.trip_id, r.provider, r.place_name, r.reservation_type,
               r.reservation_date, r.confirmation_no, r.place_id,
               p.place_name AS linked_place_name, p.address AS linked_place_address,
               p.rating AS linked_place_rating, p.place_type AS linked_place_type
        FROM reservations r
        JOIN trips t ON t.trip_id = r.trip_id
        LEFT JOIN memberships m ON m.trip_id = t.trip_id AND m.user_id = :user_id
        LEFT JOIN places p ON p.place_id = r.place_id
        WHERE t.owner_user_id = :user_id OR m.user_id IS NOT NULL
        ORDER BY r.provider NULLS LAST, r.reservation_id
        """
        ,
        {"user_id": current_user["user_id"]},
    )


@router.get("/reservations/{reservation_id}")
def get_reservation(reservation_id: int, current_user: dict = Depends(get_current_user)):
    reservation = fetch_one(
        """
        SELECT r.reservation_id, r.trip_id, r.provider, r.place_name, r.reservation_type,
               r.reservation_date, r.confirmation_no, r.place_id,
               p.place_name AS linked_place_name, p.address AS linked_place_address,
               p.rating AS linked_place_rating, p.place_type AS linked_place_type
        FROM reservations r
        LEFT JOIN places p ON p.place_id = r.place_id
        WHERE r.reservation_id = :reservation_id
        """,
        {"reservation_id": reservation_id},
    )
    if not reservation:
        raise_not_found()
    reservation_row = cast(dict[str, Any], reservation)
    ensure_trip_access(reservation_row["trip_id"], current_user)
    return reservation_row


@router.get("/trips/{trip_id}/reservations")
def list_trip_reservations(trip_id: int, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(trip_id, current_user)
    return fetch_all(
        """
        SELECT r.reservation_id, r.trip_id, r.provider, r.place_name, r.reservation_type,
               r.reservation_date, r.confirmation_no, r.place_id,
               p.place_name AS linked_place_name, p.address AS linked_place_address,
               p.rating AS linked_place_rating, p.place_type AS linked_place_type
        FROM reservations r
        LEFT JOIN places p ON p.place_id = r.place_id
        WHERE r.trip_id = :trip_id
        ORDER BY r.reservation_date NULLS LAST, r.provider NULLS LAST, r.reservation_id
        """,
        {"trip_id": trip_id},
    )


@router.post("/reservations", status_code=201)
def create_reservation(reservation: ReservationCreate, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(reservation.trip_id, current_user)
    validate_place_link(reservation.trip_id, reservation.place_id)

    try:
        return execute_returning(
            """
            INSERT INTO reservations (
                trip_id, provider, place_name, reservation_type, reservation_date, confirmation_no, place_id
            )
            VALUES (
                :trip_id, :provider, :place_name, :reservation_type, :reservation_date, :confirmation_no, :place_id
            )
            RETURNING reservation_id, trip_id, provider, place_name, reservation_type,
                      reservation_date, confirmation_no, place_id,
                      NULL::TEXT AS linked_place_name,
                      NULL::TEXT AS linked_place_address,
                      NULL::NUMERIC AS linked_place_rating,
                      NULL::TEXT AS linked_place_type
            """,
            reservation.model_dump(),
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.put("/reservations/{reservation_id}")
def update_reservation(reservation_id: int, reservation: ReservationUpdate, current_user: dict = Depends(get_current_user)):
    existing_reservation = fetch_one(
        """
        SELECT reservation_id, trip_id, provider, place_name, reservation_type,
               reservation_date, confirmation_no, place_id
        FROM reservations
        WHERE reservation_id = :reservation_id
        """,
        {"reservation_id": reservation_id},
    )
    if existing_reservation is None:
        raise_not_found()

    reservation_row = cast(dict[str, Any], existing_reservation)
    ensure_trip_access(reservation_row["trip_id"], current_user)

    updates = reservation.model_dump(exclude_unset=True)
    updated_values = {**reservation_row, **updates, "reservation_id": reservation_id}

    ensure_trip_access(updated_values["trip_id"], current_user)
    validate_place_link(updated_values["trip_id"], updated_values.get("place_id"))

    try:
        return execute_returning(
            """
            UPDATE reservations
            SET trip_id = :trip_id,
                provider = :provider,
                place_name = :place_name,
                reservation_type = :reservation_type,
                reservation_date = :reservation_date,
                confirmation_no = :confirmation_no,
                place_id = :place_id
            WHERE reservation_id = :reservation_id
            RETURNING reservation_id, trip_id, provider, place_name, reservation_type,
                      reservation_date, confirmation_no, place_id,
                      NULL::TEXT AS linked_place_name,
                      NULL::TEXT AS linked_place_address,
                      NULL::NUMERIC AS linked_place_rating,
                      NULL::TEXT AS linked_place_type
            """,
            updated_values,
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.delete("/reservations/{reservation_id}")
def delete_reservation(reservation_id: int, current_user: dict = Depends(get_current_user)):
    existing_reservation = fetch_one(
        """
        SELECT reservation_id, trip_id
        FROM reservations
        WHERE reservation_id = :reservation_id
        """,
        {"reservation_id": reservation_id},
    )
    if existing_reservation is None:
        raise_not_found()

    reservation_row = cast(dict[str, Any], existing_reservation)
    ensure_trip_access(reservation_row["trip_id"], current_user)

    deleted_reservation = execute_returning(
        """
        DELETE FROM reservations
        WHERE reservation_id = :reservation_id
        RETURNING reservation_id, trip_id, provider, place_name, reservation_type,
                  reservation_date, confirmation_no, place_id,
                  NULL::TEXT AS linked_place_name,
                  NULL::TEXT AS linked_place_address,
                  NULL::NUMERIC AS linked_place_rating,
                  NULL::TEXT AS linked_place_type
        """,
        {"reservation_id": reservation_id},
    )
    if not deleted_reservation:
        raise_not_found()
    return deleted_reservation
