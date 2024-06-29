import os
import logging
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
import jwt
from sqlalchemy.orm import Session
from schemas import Token, UserSchema
from models import UserModel
from database import engine
from dotenv import load_dotenv
from schemas import UserUpdate

load_dotenv()

logger = logging.getLogger("uvicorn")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
HASHING_ALGORITHM = os.getenv("HASHING_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=HASHING_ALGORITHM)

    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    with Session(engine) as session:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[HASHING_ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
            user = session.query(UserModel).filter(UserModel.username == username).first()
            if user is None:
                raise credentials_exception
        except jwt.PyJWTError:
            raise credentials_exception

        return username

async def register_user(user: OAuth2PasswordRequestForm) -> Token:
    with Session(engine) as session:
        try:

            if session.query(UserModel).filter(UserModel.username == user.username).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )

            hashed_password = get_password_hash(user.password)

            user = UserModel(username=user.username, password=hashed_password)
            session.add(user)
            session.commit()

            access_token = create_access_token(data={"sub": str(user.username)})

            return Token(access_token=access_token, token_type="bearer")

        except HTTPException as e:
            raise HTTPException(
                status_code=e.status_code,
                detail=str(e.detail)
            )

        except Exception as e:
            logger.error(f"Unexpected error during registration: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )

async def login_user(user: OAuth2PasswordRequestForm = Depends()) -> Token:
    with Session(engine) as session:
        try:
            queryUser = session.query(UserModel).filter(UserModel.username == user.username).first()

            if queryUser is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            if not pwd_context.verify(user.password, queryUser.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            access_token = create_access_token(data={"sub": str(user.username)})

            return Token(access_token=access_token, token_type="bearer")

        except HTTPException as e:
            raise e

        except Exception as e:
            logger.error(f"Unexpected error during login: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )

async def get_user_data(token: str) -> UserSchema:
    with Session(engine) as session:
        try:
            user = session.query(UserModel).filter(UserModel.username == token).first()

            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found",
                )

            return UserSchema(
                username=user.username,
                password=user.password
            )

        except HTTPException as e:
            raise e

        except Exception as e:
            logger.error(f"Unexpected error while fetching user data: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred while fetching user data"
            )

async def update_user_data(username: str, user_update: UserUpdate) -> UserSchema:
    try:
        with Session(engine) as session:
            user = session.query(UserModel).filter(UserModel.username == username).first()
            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )

            if user_update.username:
                existing_user = session.query(UserModel).filter(UserModel.username == user_update.username).first()
                if existing_user and existing_user.id != user.id:
                    raise HTTPException(
                        status_code=400,
                        detail="Username already taken"
                    )
                user.username = user_update.username

            if user_update.password:
                user.password = get_password_hash(user_update.password)

            session.commit()
            session.refresh(user)

            updated_user = UserSchema(
                username=user.username,
                password="**********"
            )

            return {"message": "User updated successfully", "user": updated_user}

    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Unexpected error during user update: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


