import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from schemas import Token, UserUpdate, UserSchema, VerifyCodeResponse
from admin import get_current_admin_user, create_admin
from crud import fetch_all_user, delete_all_users, create_new_user, fetch_user, delete_user
import models
from database import engine
import uvicorn
from auth import router as auth_router

logger = logging.getLogger("uvicorn")

app = FastAPI()

app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])

models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

environment = "dev"
if environment == "dev":
    logger.warning("Running in development mode - allowing CORS for all origins")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get('/')
def index():
    return {"message": "Hello world!"}

@app.get('/create-admin-user')
async def create_admin_user():
    admin = await create_admin()
    return admin

@app.get("/admin/me")
async def get_current_admin_user(token: str = Depends(get_current_admin_user)):
    return token

@app.get("/fetch/users")
async def fetch_users(token: str = Depends(get_current_admin_user)):
    users = await fetch_all_user()
    return users

@app.get("/delete/users")
async def delete_users(token: str = Depends(get_current_admin_user)):
    users = await delete_all_users()
    return users

@app.post("/create/user")
async def create_user(user: UserSchema, token: str = Depends(get_current_admin_user)):
    user = await create_new_user(user)
    return user

@app.get("/fetch/user/{email}")
async def fetch_single_user(email: str, token: str = Depends(get_current_admin_user)):
    user = await fetch_user(email)
    return user

@app.get("/delete/user/{email}")
async def delete_single_user(email: str, token: str = Depends(get_current_admin_user)):
    user = await delete_user(email)
    return user

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
