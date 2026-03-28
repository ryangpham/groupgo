from datetime import date

from pydantic import BaseModel


class MembershipCreate(BaseModel):
    user_id: int
    trip_id: int

    role_id: int
    joined_at: date | None = None


class MembershipUpdate(BaseModel):
    role_id: int | None = None
    joined_at: date | None = None