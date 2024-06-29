from pydantic import BaseModel
from datetime import datetime

class UserSchema(BaseModel):
    email: str
    password: str

class UserIdResponse(BaseModel):
    user_id: int

class Token(BaseModel):
    access_token: str
    token_type: str

class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None

class UserResponse(BaseModel):
    id: int
    email: str
    is_verified: bool

    class Config:
        from_attributes = True

class VerifyCodeResponse(BaseModel):
    email: str
    code: str