from datetime import date

from pydantic import BaseModel


class TripCreate(BaseModel):
    trip_name: str
    start_date: date | None = None
    end_date: date | None = None
    owner_user_id: int
    destination_text: str | None = None
    destination_lat: float | None = None
    destination_lng: float | None = None

class TripUpdate(BaseModel):
    trip_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    owner_user_id: int | None = None
    destination_text: str | None = None
    destination_lat: float | None = None
    destination_lng: float | None = None