from pydantic import BaseModel, ConfigDict, Field


class SignUpRequest(BaseModel):
    email: str
    display_name: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8, max_length=72)

    model_config = ConfigDict(str_strip_whitespace=True)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=72)

    model_config = ConfigDict(str_strip_whitespace=True)


class UserResponse(BaseModel):
    user_id: int
    email: str
    display_name: str
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
