from typing import Any, cast

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.roles import RoleCreate, RoleUpdate

router = APIRouter(tags = ["roles"])

def raise_not_found():
    raise HTTPException(status_code=404, detail = "Role not found")

def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(status_code=400, detail = "Request violates database constraints") from exc

@router.get("/roles")
def list_roles():
    return fetch_all(
        """
        SELECT role_id, role_name
        FROM roles
        ORDER BY role_id NULLS LAST
        """
    )

@router.get("/roles/{role_id")
def get_role(role_id: int):
    role = fetch_one(
        """
        SELECT role_id, role_name
        FROM roles
        WHERE role_id = :role_id
        """,
        {"role_id": role_id}
    )
    if not role:
        raise_not_found()
    return role

@router.post("/roles", status_code=201)
def create_role(role: RoleCreate):
    try:
        new_role = execute_returning(
            """
            INSERT INTO roles(role_name)
            VALUES(:role_name)
            RETURNING role_id, role_name
            """,
            role.model_dump()
        )
        return new_role
    except IntegrityError as exc:
        handle_integrity_error(exc)

@router.put("/roles/{role_id}")
def update_role(role_id: int, role: RoleUpdate):
    existing_role = fetch_one(
        """
        SELECT role_id, role_name
        FROM roles
        WHERE role_id = :role_id
        """,
        {"role_id": role_id}
    )
    if existing_role is None:
        raise_not_found()

    role_row = cast(dict[str, Any], existing_role)

    updated_values = {
        "role_id": role_id,
        "role_name": role.role_name if role.role_name is not None else role_row["role_name"]
    }

    try:
        return execute_returning(
            """
            UPDATE roles
            SET role_name = :role_name
            WHERE role_id = :role_id
            RETURNING role_id, role_name
            """,
            updated_values
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)

@router.delete("/roles/{role_id")
def delete_role(role_id: int):
    deleted_role = execute_returning(
        """
        DELETE FROM roles 
        WHERE role_id = :role_id
        RETURNING role_id, role_name
        """,
        {"role_id": role_id}
    )

    if not deleted_role:
        raise_not_found()
    return deleted_role