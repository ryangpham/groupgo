from pydantic import BaseModel


class PlaceCreate(BaseModel):
    trip_id: int
    place_name: str
    address: str | None = None
    rating: float | None = None
    place_type: str | None = None


class PlaceUpdate(BaseModel):
    trip_id: int | None = None
    place_name: str | None = None
    address: str | None = None
    rating: float | None = None
    place_type: str | None = None
