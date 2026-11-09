# App principal
from fastapi import FastAPI

from app import models
from app.db import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI()