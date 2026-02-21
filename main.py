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
# User API Endpoints
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

# ---------------------------------------------------------------------------
# Vehicle API Endpoints
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Driver API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/drivers")
def get_drivers():
    return database.get_all_drivers()

# ---------------------------------------------------------------------------
# Trip API Endpoints
# ---------------------------------------------------------------------------
class TripCreate(BaseModel):
    vehicle_db_id: int
    driver_id: int
    cargo_weight: float
    origin: str
    destination: str

@app.get("/api/trips")
def get_trips():
    return database.get_all_trips()

@app.post("/api/trips")
def create_trip(body: TripCreate):
    try:
        trip_id = database.create_trip(
            body.vehicle_db_id, body.driver_id,
            body.cargo_weight, body.origin, body.destination
        )
        return {"success": True, "trip_id": trip_id}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# ---------------------------------------------------------------------------
# Expense / Fuel API Endpoints
# ---------------------------------------------------------------------------
class FuelLogCreate(BaseModel):
    vehicle_db_id: int
    liters: float
    cost: float

@app.get("/api/expenses")
def get_expenses():
    return database.get_fuel_logs()

@app.post("/api/expenses")
def create_expense(body: FuelLogCreate):
    try:
        database.create_fuel_log(body.vehicle_db_id, body.liters, body.cost)
        return {"success": True}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# ---------------------------------------------------------------------------
# Maintenance API Endpoints
# ---------------------------------------------------------------------------
class MaintenanceCreate(BaseModel):
    vehicle_db_id: int
    description: str
    cost: float

@app.get("/api/maintenance")
def get_maintenance():
    return database.get_maintenance_logs()

@app.post("/api/maintenance")
def create_maintenance(body: MaintenanceCreate):
    try:
        database.create_maintenance_log(body.vehicle_db_id, body.description, body.cost)
        return {"success": True}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# ---------------------------------------------------------------------------
# Dashboard Stats API
# ---------------------------------------------------------------------------
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    return database.get_dashboard_stats()

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str = ""

@app.post("/api/login")
def login_user(body: LoginRequest):
    user = database.verify_login(body.email, body.password)
    if user:
        return {"success": True, "user": user}
    existing = database.get_user_by_email(body.email)
    if existing:
        return JSONResponse(status_code=401, content={"error": "Incorrect password. Please try again."})
    return JSONResponse(status_code=404, content={"error": "User not found. Please sign up first."})

# ---------------------------------------------------------------------------
# Page Routes
# ---------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    stats = database.get_dashboard_stats()
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "stats": stats,
        "utilization_data": [82, 85, 89, 88, 92, 86, 88.6],
        "revenue_data": [120, 132, 145, 128, 150, 110, 105],
        "cost_data": [85, 90, 88, 92, 95, 80, 82],
    })

@app.get("/vehicles", response_class=HTMLResponse)
def vehicles(request: Request):
    return templates.TemplateResponse("vehicles.html", {"request": request})

@app.get("/dispatch", response_class=HTMLResponse)
def dispatch(request: Request):
    return templates.TemplateResponse("dispatch.html", {"request": request})

@app.get("/maintenance", response_class=HTMLResponse)
def maintenance(request: Request):
    return templates.TemplateResponse("maintenance.html", {"request": request})

@app.get("/expenses", response_class=HTMLResponse)
def expenses(request: Request):
    total_cost = database.get_total_fuel_cost()
    return templates.TemplateResponse("expenses.html", {
        "request": request,
        "total_cost": total_cost,
    })

@app.get("/drivers", response_class=HTMLResponse)
def drivers(request: Request):
    drivers_list = database.get_all_drivers()
    return templates.TemplateResponse("drivers.html", {
        "request": request,
        "drivers": drivers_list,
    })

@app.get("/analytics", response_class=HTMLResponse)
def analytics(request: Request):
    return templates.TemplateResponse("analytics.html", {
        "request": request,
        "fuel_data": [6.8, 6.9, 7.1, 7.0, 7.2, 7.4],
        "roi_data": [45, 25, 20, 10],
    })

@app.get("/users", response_class=HTMLResponse)
def users(request: Request):
    return templates.TemplateResponse("users.html", {"request": request})