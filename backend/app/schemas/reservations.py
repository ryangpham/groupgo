from datetime import date

from pydantic import BaseModel


class ReservationCreate(BaseModel):
    trip_id: int
    provider: str | None = None
    place_name: str | None = None
    reservation_type: str | None = None
    reservation_date: date | None = None
    confirmation_no: str | None = None
    place_id: int | None = None


class ReservationUpdate(BaseModel):
    trip_id: int | None = None
    provider: str | None = None
    place_name: str | None = None
    reservation_type: str | None = None
    reservation_date: date | None = None
    confirmation_no: str | None = None
    place_id: int | None = None
