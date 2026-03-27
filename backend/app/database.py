import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DATABASE_URL)


def test_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar()


def fetch_one(query: str, params: dict | None = None):
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        return result.mappings().first()


def fetch_all(query: str, params: dict | None = None):
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        return list(result.mappings().all())


def execute_returning(query: str, params: dict | None = None):
    with engine.begin() as connection:
        result = connection.execute(text(query), params or {})
        return result.mappings().first()
