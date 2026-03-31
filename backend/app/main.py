from fastapi import FastAPI

from app.database import test_connection
from app.routes.reservations import router as reservations_router
from app.routes.tasks import router as tasks_router
from app.routes.trips import router as trip_router
from app.routes.roles import router as role_router
from app.routes.membership import router as membership_router

app = FastAPI()

@app.get("/")
def root():
    return {"message": "GroupGo backend running"}


@app.get("/db-test")
def db_test():
    return {"db_result": test_connection()}


app.include_router(tasks_router)
app.include_router(reservations_router)
app.include_router(trip_router)
app.include_router(role_router)
app.include_router(membership_router)