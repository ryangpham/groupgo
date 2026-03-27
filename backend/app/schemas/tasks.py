from datetime import date

from pydantic import BaseModel


class TaskCreate(BaseModel):
    trip_id: int
    title: str
    due_date: date | None = None


class TaskUpdate(BaseModel):
    trip_id: int | None = None
    title: str | None = None
    due_date: date | None = None
