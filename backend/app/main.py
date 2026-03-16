from fastapi import FastAPI
from app.database import test_connection

app = FastAPI()

@app.get("/")
def root():
    return {"message": "GroupGo backend running"}

@app.get("/db-test")
def db_test():
    return {"db_result": test_connection()}