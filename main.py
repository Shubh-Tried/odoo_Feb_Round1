from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Optional
import database

app = FastAPI()

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# ---------------------------------------------------------------------------
# Initialize SQLite database on startup
# ---------------------------------------------------------------------------
database.init_db()

class RoleUpdate(BaseModel):
    role: str

class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    password: str = ""

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/users")
def get_users():
    return database.get_all_users()

@app.put("/api/users/{user_id}/role")
def update_user_role(user_id: int, body: RoleUpdate):
    user = database.update_user_role(user_id, body.role)
    if user:
        return {"success": True, "user": user}
    return JSONResponse(status_code=404, content={"error": "User not found"})

import psycopg2

@app.post("/api/users")
def create_user(body: UserCreate):
    if body.role.lower() == "admin":
        return JSONResponse(status_code=403, content={"detail": "Cannot register as admin. Only one admin is allowed."})
    try:
        user = database.create_user(body.name, body.email, body.role, body.password)
        return {"success": True, "user": user}
    except psycopg2.IntegrityError:
        return JSONResponse(status_code=400, content={"detail": "Registration failed. Email may already exist."})

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    deleted = database.delete_user(user_id)
    if deleted:
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "User not found"})

class VehicleCreate(BaseModel):
    vehicle_id: str
    make: str
    model: str
    year: int
    vehicle_type: str
    vehicle_class: str
    mileage: int
    vin: str
    license_plate: str

@app.get("/api/vehicles")
def get_vehicles():
    return database.get_all_vehicles()

@app.post("/api/vehicles")
def create_vehicle(body: VehicleCreate):
    vehicle = database.create_vehicle(
        body.vehicle_id, body.make, body.model, body.year,
        body.vehicle_type, body.vehicle_class, body.mileage,
        body.vin, body.license_plate,
    )
    return {"success": True, "vehicle": vehicle}

@app.delete("/api/vehicles/{vehicle_db_id}")
def delete_vehicle(vehicle_db_id: int):
    deleted = database.delete_vehicle(vehicle_db_id)
    if deleted:
        return {"success": True}
    return JSONResponse(status_code=404, content={"error": "Vehicle not found"})

class LoginRequest(BaseModel):
    email: str
    password: str = ""

@app.post("/api/login")
def login_user(body: LoginRequest):
    user = database.verify_login(body.email, body.password)
    if user:
        return {"success": True, "user": user}
    # Check if user exists but password is wrong
    existing = database.get_user_by_email(body.email)
    if existing:
        return JSONResponse(status_code=401, content={"error": "Incorrect password. Please try again."})
    return JSONResponse(status_code=404, content={"error": "User not found. Please sign up first."})

# ---------------------------------------------------------------------------
# Page Route
# ---------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "utilization_data": [82, 85, 89, 88, 92, 86, 88.6],
        "revenue_data": [120, 132, 145, 128, 150, 110, 105],
        "cost_data": [85, 90, 88, 92, 95, 80, 82],
        "fuel_data": [6.8, 6.9, 7.1, 7.0, 7.2, 7.4],
        "roi_data": [45, 25, 20, 10],
    })