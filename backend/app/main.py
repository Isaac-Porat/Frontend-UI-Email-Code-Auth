import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import models
from database import engine
from auth import router as auth_router
from admin import router as admin_router

logger = logging.getLogger("uvicorn")

app = FastAPI()

app.include_router(auth_router, prefix='/api/auth', tags=['authentication'])
app.include_router(admin_router, prefix='/api/admin', tags=['administrator'])

# resets database table data
models.Base.metadata.drop_all(bind=engine) # deletes all
models.Base.metadata.create_all(bind=engine) # creates all

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
