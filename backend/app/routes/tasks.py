from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.tasks import TaskCreate, TaskUpdate
from app.security import get_current_user

router = APIRouter(tags=["tasks"])


def raise_not_found():
    raise HTTPException(status_code=404, detail="Task not found")


def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(status_code=400, detail="Request violates database constraints") from exc


@router.get("/tasks")
def list_tasks(_current_user: dict = Depends(get_current_user)):
    return fetch_all(
        """
        SELECT t.task_id, t.trip_id, t.title, t.due_date, t.completed,
               t.assigned_user_id, u.display_name AS assigned_user_name
        FROM tasks t
        LEFT JOIN users u ON u.user_id = t.assigned_user_id
        ORDER BY due_date NULLS LAST, task_id
        """
    )


@router.get("/tasks/{task_id}")
def get_task(task_id: int, _current_user: dict = Depends(get_current_user)):
    task = fetch_one(
        """
        SELECT t.task_id, t.trip_id, t.title, t.due_date, t.completed,
               t.assigned_user_id, u.display_name AS assigned_user_name
        FROM tasks t
        LEFT JOIN users u ON u.user_id = t.assigned_user_id
        WHERE t.task_id = :task_id
        """,
        {"task_id": task_id},
    )
    if not task:
        raise_not_found()
    return task


@router.get("/trips/{trip_id}/tasks")
def list_trip_tasks(trip_id: int, _current_user: dict = Depends(get_current_user)):
    return fetch_all(
        """
        SELECT t.task_id, t.trip_id, t.title, t.due_date, t.completed,
               t.assigned_user_id, u.display_name AS assigned_user_name
        FROM tasks t
        LEFT JOIN users u ON u.user_id = t.assigned_user_id
        WHERE t.trip_id = :trip_id
        ORDER BY t.due_date NULLS LAST, t.task_id
        """,
        {"trip_id": trip_id},
    )


@router.post("/tasks", status_code=201)
def create_task(task: TaskCreate, _current_user: dict = Depends(get_current_user)):
    try:
        return execute_returning(
            """
            INSERT INTO tasks (trip_id, title, due_date, completed, assigned_user_id)
            VALUES (:trip_id, :title, :due_date, :completed, :assigned_user_id)
            RETURNING task_id, trip_id, title, due_date, completed, assigned_user_id
            """,
            task.model_dump(),
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate, _current_user: dict = Depends(get_current_user)):
    existing_task = fetch_one(
        """
        SELECT task_id, trip_id, title, due_date, completed, assigned_user_id
        FROM tasks
        WHERE task_id = :task_id
        """,
        {"task_id": task_id},
    )
    if existing_task is None:
        raise_not_found()

    task_row = cast(dict[str, Any], existing_task)

    updated_values = {
        "task_id": task_id,
        "trip_id": task.trip_id if task.trip_id is not None else task_row["trip_id"],
        "title": task.title if task.title is not None else task_row["title"],
        "due_date": task.due_date if task.due_date is not None else task_row["due_date"],
        "completed": task.completed if task.completed is not None else task_row["completed"],
        "assigned_user_id": (
            task.assigned_user_id if task.assigned_user_id is not None else task_row["assigned_user_id"]
        ),
    }

    try:
        return execute_returning(
            """
            UPDATE tasks
            SET trip_id = :trip_id,
                title = :title,
                due_date = :due_date,
                completed = :completed,
                assigned_user_id = :assigned_user_id
            WHERE task_id = :task_id
            RETURNING task_id, trip_id, title, due_date, completed, assigned_user_id
            """,
            updated_values,
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, _current_user: dict = Depends(get_current_user)):
    deleted_task = execute_returning(
        """
        DELETE FROM tasks
        WHERE task_id = :task_id
        RETURNING task_id, trip_id, title, due_date, completed, assigned_user_id
        """,
        {"task_id": task_id},
    )
    if not deleted_task:
        raise_not_found()
    return deleted_task
