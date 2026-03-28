from datetime import date

from pydantic import BaseModel


class TripCreate(BaseModel):
    trip_name: str
    start_date: date | None = None
    end_date: date | None = None
    owner_user_id: int

class TripUpdate(BaseModel):
    trip_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    owner_user_id: int | None = None