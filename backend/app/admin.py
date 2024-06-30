import os
import logging
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, APIRouter
from auth import get_current_user, get_password_hash
from database import engine
from models import UserModel
from schemas import UserSchema

load_dotenv()

logger = logging.getLogger("uvicorn")

router = APIRouter()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

@router.get('/create-admin-user')
async def create_admin():
  try:
    with Session(engine) as session:
      if session.query(UserModel).filter(UserModel.email == ADMIN_EMAIL, UserModel.is_admin == True).first():
        return {"status": "success", "message": "Admin user already exists"}, 200

      admin_user = UserModel(email=ADMIN_EMAIL, password=get_password_hash(ADMIN_PASSWORD), is_admin=True)
      if admin_user:
        session.add(admin_user)
        session.commit()

        return {"status": "success", "message": "Admin user created successfully"}, 200
  except Exception as e:
    logger.error(f"Unexpected error while creating admin user: {e}", exc_info=True)
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail="Unexpected error while creating admin user.",
      headers={"WWW-Authenticate": "Bearer"}
    )

@router.get('/admin/me')
async def get_current_admin_user(token: str = Depends(get_current_user)):
  adminEmail = token

  if adminEmail != ADMIN_EMAIL:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Unauthorized access attempt by non-admin user",
      headers={"WWW-Authenticate": "Bearer"},
    )

  try:
    with Session(engine) as session:
      admin_user = session.query(UserModel).filter(UserModel.email == adminEmail, UserModel.is_admin == True).first()
      if not admin_user:
        raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail="Unauthorized access attempt by non-admin user",
          headers={"WWW-Authenticate": "Bearer"},
        )

      return adminEmail

  except Exception as e:
    logger.error(f"Unexpected error while creating admin user: {e}", exc_info=True)
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail="Unexpected error while creating admin user.",
      headers={"WWW-Authenticate": "Bearer"}
    )

@router.get('/fetch-users-data')
async def fetch_users_data(token: str = Depends(get_current_admin_user)):
    try:
        with Session(engine) as session:
            users = session.query(UserModel).all()
            return users

    except Exception as e:
        logger.error(f"Unexpected error while fetching all users: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while fetching all users.",
            headers={"WWW-Authenticate": "Bearer"}
        )

@router.get('/delete-all-users')
async def delete_all_users(token: str = Depends(get_current_admin_user)):
    try:
        with Session(engine) as session:
            deleted_count = session.query(UserModel).filter(UserModel.is_admin != True).delete()
            session.commit()

            if deleted_count == 0:
                return {"message": "No users to delete"}
    except Exception as e:
        logger.error(f"Unexpected error while deleting all users: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while deleting all users.",
            headers={"WWW-Authenticate": "Bearer"}
        )

@router.get('/fetch-user-data/{email}')
async def fetch_user_data(email: str, token: str = Depends(get_current_admin_user)):
    try:
        with Session(engine) as session:
            user = session.query(UserModel).filter(UserModel.email == email).first()
            if user:
                return user
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No user found."
                )

    except Exception as e:
        logger.error(f"Unexpected error while fetching user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while fetching user.",
            headers={"WWW-Authenticate": "Bearer"}
        )

@router.get('/delete-user/{email}')
async def delete_user(email: str, token: str = Depends(get_current_admin_user)):
    try:
        with Session(engine) as session:
            user = session.query(UserModel).filter(UserModel.email == email).first()
            if user:
                session.delete(user)
                session.commit()
                return {"message": "User deleted successfully"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found."
                )
    except Exception as e:
        logger.error(f"Unexpected error while deleting user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while deleting user.",
            headers={"WWW-Authenticate": "Bearer"}
        )

@router.get('/create-user')
async def create_new_user(data: UserSchema, token: str = Depends(get_current_admin_user)):
    try:
        with Session(engine) as session:

            if session.query(UserModel).filter(UserModel.email == data.email).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )

            hashed_password = get_password_hash(data.password)

            user = UserModel(email=data.email, password=hashed_password)
            session.add(user)
            session.commit()

            return {"status": "success", "message": "New user created successfully"}, 200

    except Exception as e:
        logger.error(f"Unexpected error while creating a new user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while creating a new user.",
            headers={"WWW-Authenticate": "Bearer"}
        )
