import os
import logging
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
import jwt
from sqlalchemy.orm import Session
from schemas import Token, UserSchema
from models import UserModel, VerificationCodeModel
from database import engine
from dotenv import load_dotenv
from schemas import UserUpdate

from datetime import datetime, timedelta
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

logger = logging.getLogger("uvicorn")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
HASHING_ALGORITHM = os.getenv("HASHING_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

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
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
            user = session.query(UserModel).filter(UserModel.email == email).first()
            if user is None:
                raise credentials_exception
        except jwt.PyJWTError:
            raise credentials_exception

        return email

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

async def get_user_data(token: str) -> UserSchema:
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

async def update_user_data(email: str, user_update: UserUpdate) -> UserSchema:
    try:
        with Session(engine) as session:
            user = session.query(UserModel).filter(UserModel.email == email).first()
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

def send_verification_email(email: str, code: str):
    smtp_server = "smtp.gmail.com"
    port = 587  # For starttls
    sender_email = EMAIL_USER
    password = EMAIL_PASSWORD

    message = MIMEMultipart("alternative")
    message["Subject"] = "Your Verification Code"
    message["From"] = sender_email
    message["To"] = email

    text = f"Your verification code is: {code}"
    html = f"""\
    <html>
      <body>
        <p>Your verification code is: <strong>{code}</strong></p>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    message.attach(part1)
    message.attach(part2)

    try:
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, email, message.as_string())
        logger.warning(f"Verification email sent to {email}")
    except Exception as e:
        logger.warning(f"Error sending email: {str(e)}")
        raise

async def verify(email: str, code: str):
    try:
        with Session(engine) as session:
            user = session.query(UserModel).filter(UserModel.email == email).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            verification = session.query(VerificationCodeModel).filter(
                VerificationCodeModel.user_id == user.id,
                VerificationCodeModel.code == code,
                VerificationCodeModel.expires_at > datetime.utcnow()
            ).first()

            if not verification:
                raise HTTPException(status_code=400, detail="Invalid or expired verification code")

            user.is_verified = True
            session.delete(verification)
            session.commit()

            access_token = create_access_token(data={"sub": user.email})
            return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException as e:
        raise e

    except Exception as e:
        logger.error(f"Unexpected error during user update: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")