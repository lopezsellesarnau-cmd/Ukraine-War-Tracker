from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from db import get_latest, get_history, get_compare

app = FastAPI()


@app.get("/latest")
def latest():
    return get_latest()


@app.get("/history/{category}")
def history(category):
    return get_history(category)


@app.get("/compare")
def compare():
    return get_compare()


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def home():
    return FileResponse("static/index.html")
