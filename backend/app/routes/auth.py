from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_one
from app.schemas.auth import LoginRequest, SignUpRequest, TokenResponse, UserResponse
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    invalid_credentials_exception,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_email(email: str):
    normalized_email = normalize_email(email)
    if "@" not in normalized_email or normalized_email.startswith("@") or normalized_email.endswith("@"):
        raise HTTPException(status_code=400, detail="Email must be valid")


def build_token_response(user_row: dict[str, Any]) -> TokenResponse:
    user = UserResponse(**user_row)
    access_token = create_access_token(user.user_id, user.email)
    return TokenResponse(access_token=access_token, user=user)


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
def sign_up(payload: SignUpRequest):
    email = normalize_email(payload.email)
    validate_email(email)

    existing_user = fetch_one(
        """
        SELECT user_id
        FROM users
        WHERE email = :email
        """,
        {"email": email},
    )
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    try:
        user = execute_returning(
            """
            INSERT INTO users (email, display_name, password_hash)
            VALUES (:email, :display_name, :password_hash)
            RETURNING user_id, email, display_name, is_active
            """,
            {
                "email": email,
                "display_name": payload.display_name,
                "password_hash": hash_password(payload.password),
            },
        )
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail="Unable to create user") from exc

    return build_token_response(dict(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    email = normalize_email(payload.email)
    validate_email(email)

    user = fetch_one(
        """
        SELECT user_id, email, display_name, is_active, password_hash
        FROM users
        WHERE email = :email
        """,
        {"email": email},
    )
    if not user or not user["is_active"]:
        raise invalid_credentials_exception()

    if not verify_password(payload.password, user["password_hash"]):
        raise invalid_credentials_exception()

    return build_token_response(
        {
            "user_id": user["user_id"],
            "email": user["email"],
            "display_name": user["display_name"],
            "is_active": user["is_active"],
        }
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict[str, Any] = Depends(get_current_user)):
    return UserResponse(**current_user)
