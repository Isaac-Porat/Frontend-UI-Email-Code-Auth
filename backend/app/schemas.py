from pydantic import BaseModel

class UserSchema(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None

class VerifyCodeResponse(BaseModel):
    email: str
    code: str

class ForgotPasswordRequest(BaseModel):
    email: str

class UpdatePasswordRequest(BaseModel):
    password: str