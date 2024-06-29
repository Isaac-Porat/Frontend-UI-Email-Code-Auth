import logging
from fastapi import FastAPI, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from schemas import Token, UserUpdate
from auth import login_user, register_user, get_current_user, get_user_data, update_user_data
from admin import get_current_admin_user, create_admin
from crud import fetch_all_user, delete_all_users, create_new_user, fetch_user, delete_user
import models
from database import engine
import uvicorn

logger = logging.getLogger("uvicorn")

app = FastAPI()

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

@app.post("/login", response_model=Token)
async def login(user: OAuth2PasswordRequestForm = Depends()) -> Token:
    access_token = await login_user(user)
    return access_token

@app.post("/register", response_model=Token)
async def register(user: OAuth2PasswordRequestForm = Depends()) -> Token:
    access_token = await register_user(user)
    return access_token

@app.post("/token", response_model=Token)
async def token(user: OAuth2PasswordRequestForm = Depends()) -> Token:
    access_token = await login_user(user)
    return access_token

@app.get('/users/me')
async def get_current_active_user(token: str = Depends(get_current_user)):
    return token

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
async def create_user(user: OAuth2PasswordRequestForm = Depends(), token: str = Depends(get_current_admin_user)):
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

@app.get("/get-user-data")
async def get_data(token: str = Depends(get_current_user)):
    user = await get_user_data(token)
    return user

@app.put("/update-user")
async def update_user(user_update: UserUpdate, token: str = Depends(get_current_user)):
    updated_user = await update_user_data(token, user_update)
    return updated_user

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
