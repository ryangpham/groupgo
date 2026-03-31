from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.reservations import ReservationCreate, ReservationUpdate
from app.security import get_current_user

router = APIRouter(tags=["reservations"])


def raise_not_found():
    raise HTTPException(status_code=404, detail="Reservation not found")


def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(status_code=400, detail="Request violates database constraints") from exc


@router.get("/reservations")
def list_reservations(_current_user: dict = Depends(get_current_user)):
    return fetch_all(
        """
        SELECT reservation_id, trip_id, provider, confirmation_no, place_id
        FROM reservations
        ORDER BY provider NULLS LAST, reservation_id
        """
    )


@router.get("/reservations/{reservation_id}")
def get_reservation(reservation_id: int, _current_user: dict = Depends(get_current_user)):
    reservation = fetch_one(
        """
        SELECT reservation_id, trip_id, provider, confirmation_no, place_id
        FROM reservations
        WHERE reservation_id = :reservation_id
        """,
        {"reservation_id": reservation_id},
    )
    if not reservation:
        raise_not_found()
    return reservation


@router.get("/trips/{trip_id}/reservations")
def list_trip_reservations(trip_id: int, _current_user: dict = Depends(get_current_user)):
    return fetch_all(
        """
        SELECT reservation_id, trip_id, provider, confirmation_no, place_id
        FROM reservations
        WHERE trip_id = :trip_id
        ORDER BY provider NULLS LAST, reservation_id
        """,
        {"trip_id": trip_id},
    )


@router.post("/reservations", status_code=201)
def create_reservation(reservation: ReservationCreate, _current_user: dict = Depends(get_current_user)):
    try:
        return execute_returning(
            """
            INSERT INTO reservations (trip_id, provider, confirmation_no, place_id)
            VALUES (:trip_id, :provider, :confirmation_no, :place_id)
            RETURNING reservation_id, trip_id, provider, confirmation_no, place_id
            """,
            reservation.model_dump(),
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.put("/reservations/{reservation_id}")
def update_reservation(reservation_id: int, reservation: ReservationUpdate, _current_user: dict = Depends(get_current_user)):
    existing_reservation = fetch_one(
        """
        SELECT reservation_id, trip_id, provider, confirmation_no, place_id
        FROM reservations
        WHERE reservation_id = :reservation_id
        """,
        {"reservation_id": reservation_id},
    )
    if existing_reservation is None:
        raise_not_found()

    reservation_row = cast(dict[str, Any], existing_reservation)

    updated_values = {
        "reservation_id": reservation_id,
        "trip_id": reservation.trip_id if reservation.trip_id is not None else reservation_row["trip_id"],
        "provider": reservation.provider if reservation.provider is not None else reservation_row["provider"],
        "confirmation_no": reservation.confirmation_no if reservation.confirmation_no is not None else reservation_row["confirmation_no"],
        "place_id": reservation.place_id if reservation.place_id is not None else reservation_row["place_id"],
    }

    try:
        return execute_returning(
            """
            UPDATE reservations
            SET trip_id = :trip_id,
                provider = :provider,
                confirmation_no = :confirmation_no,
                place_id = :place_id
            WHERE reservation_id = :reservation_id
            RETURNING reservation_id, trip_id, provider, confirmation_no, place_id
            """,
            updated_values,
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.delete("/reservations/{reservation_id}")
def delete_reservation(reservation_id: int, _current_user: dict = Depends(get_current_user)):
    deleted_reservation = execute_returning(
        """
        DELETE FROM reservations
        WHERE reservation_id = :reservation_id
        RETURNING reservation_id, trip_id, provider, confirmation_no, place_id
        """,
        {"reservation_id": reservation_id},
    )
    if not deleted_reservation:
        raise_not_found()
    return deleted_reservation
