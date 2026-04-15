from fastapi import FastAPI
from app.database import Base, engine
from app.routers.expenses import router as expenses_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(expenses_router)