from pydantic import BaseModel

class UserSchema(BaseModel):
    username: str
    password: str

class UserIdResponse(BaseModel):
    user_id: int

class Token(BaseModel):
    access_token: str
    token_type: str

class UserUpdate(BaseModel):
    username: str | None = None
    password: str | None = None

# class VerificationCode(BaseModel):
#     code: int