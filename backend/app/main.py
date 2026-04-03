from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.database import test_connection
from app.routes.auth import router as auth_router
from app.routes.places import router as places_router
from app.routes.reservations import router as reservations_router
from app.routes.tasks import router as tasks_router
from app.routes.trips import router as trip_router
from app.routes.roles import router as role_router
from app.routes.membership import router as membership_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(OperationalError)
async def handle_operational_error(_request: Request, _exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database connection failed. Check backend DATABASE_URL, network access, and whether the database host is reachable.",
        },
    )


@app.exception_handler(ProgrammingError)
async def handle_programming_error(_request: Request, exc: ProgrammingError):
    message = str(exc.orig)

    if "password_hash" in message:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Database schema is out of date. Add the users.password_hash column and backfill existing users before using auth.",
            },
        )

    return JSONResponse(
        status_code=500,
        content={"detail": "Database query failed."},
    )

@app.get("/")
def root():
    return {"message": "GroupGo backend running"}


@app.get("/db-test")
def db_test():
    return {"db_result": test_connection()}


app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(places_router)
app.include_router(reservations_router)
app.include_router(trip_router)
app.include_router(role_router)
app.include_router(membership_router)
