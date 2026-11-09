# App principal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.db import Base, engine
from app.routers.chat import router as chat_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartInterview API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
