import logging
from datetime import datetime, timedelta
import secrets
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, APIRouter
from passlib.context import CryptContext
from models import UserModel, VerificationCodeModel
from database import engine
from schemas import UserUpdate, UserSchema, VerifyCodeResponse, Token
from auth_utils import get_password_hash, create_access_token, send_verification_email, get_current_user

load_dotenv()

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

logger = logging.getLogger("uvicorn")

router = APIRouter()

@router.post('/register')
async def register_user(user: UserSchema):

    with Session(engine) as session:
        try:

            if session.query(UserModel).filter(UserModel.email == user.email).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )

            hashed_password = get_password_hash(user.password)

            user = UserModel(email=user.email, password=hashed_password)
            session.add(user)
            session.commit()
            session.refresh(user)

            verification_code = secrets.token_hex(3)
            expiration_time = datetime.utcnow() + timedelta(minutes=15)

            new_code = VerificationCodeModel(user_id=user.id, code=verification_code, expires_at=expiration_time)
            session.add(new_code)
            session.commit()

            send_verification_email(user.email, verification_code)

            return {"message": "User registered. Please check your email for the verification code."}

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

@router.post('/verify-verification-code', response_model=Token)
async def verify_verification_code(data: VerifyCodeResponse) -> Token:
    try:
        with Session(engine) as session:
            user = session.query(UserModel).filter(UserModel.email == data.email).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            verification = session.query(VerificationCodeModel).filter(
                VerificationCodeModel.user_id == user.id,
                VerificationCodeModel.code == data.code,
                VerificationCodeModel.expires_at > datetime.utcnow()
            ).first()

            if not verification:
                raise HTTPException(status_code=400, detail="Invalid or expired verification code")

            user.is_verified = True
            session.delete(verification)
            session.commit()

            access_token = create_access_token(data={"sub": user.email})
            return Token(access_token=access_token, token_type="bearer")

    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Unexpected error during user update: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.post('/login', response_model=Token)
async def login_user(user: UserSchema = Depends()) -> Token:
    with Session(engine) as session:
        try:
            queryUser = session.query(UserModel).filter(UserModel.email == user.email).first()

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

            access_token = create_access_token(data={"sub": str(user.email)})

            return Token(access_token=access_token, token_type="bearer")

        except HTTPException as e:
            raise e

        except Exception as e:
            logger.error(f"Unexpected error during login: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )

@router.post('/token', response_model=Token) # route for FastAPI docs
async def token(user: UserSchema = Depends()) -> Token:
    with Session(engine) as session:
        try:
            queryUser = session.query(UserModel).filter(UserModel.email == user.email).first()

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

            access_token = create_access_token(data={"sub": str(user.email)})

            return Token(access_token=access_token, token_type="bearer")

        except HTTPException as e:
            raise e

        except Exception as e:
            logger.error(f"Unexpected error during login: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )

@router.get('/users/me')
async def get_current_active_user(token: str = Depends(get_current_user)):
    return token # returns user's email

@router.get('/get-user-data', response_model=UserSchema)
async def get_user_data(token: str = Depends(get_current_user)) -> UserSchema:
    with Session(engine) as session:
        try:
            user = session.query(UserModel).filter(UserModel.email == token).first()

            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found",
                )

            return UserSchema(
                email=user.email,
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

@router.put('/update-user', response_model=UserSchema)
async def update_user_data(user_update: UserUpdate, token: str = Depends(get_current_user)) -> UserSchema:
    try:
        with Session(engine) as session:
            user = session.query(UserModel).filter(UserModel.email == token).first()
            if not user:
                raise HTTPException(
                    status_code=404,
                    detail="User not found"
                )

            if user_update.email:
                existing_user = session.query(UserModel).filter(UserModel.email == user_update.email).first()
                if existing_user and existing_user.id != user.id:
                    raise HTTPException(
                        status_code=400,
                        detail="Email already taken"
                    )
                user.email = user_update.email

            if user_update.password:
                user.password = get_password_hash(user_update.password)

            session.commit()
            session.refresh(user)

            updated_user = UserSchema(
                email=user.email,
                password="**********"
            )

            return {"message": "User updated successfully", "user": updated_user}

    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Unexpected error during user update: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
