from fastapi import FastAPI, HTTPException
from passlib.context import CryptContext
from sqlalchemy import or_

from db import database, metadata, engine
from schemas import UserCreate, UserLogin, ForgotPassword
from models import users

app = FastAPI()

metadata.create_all(engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.post("/SignUp")
async def user_signup(user: UserCreate):
    
    # Feature added: Expanded valid roles to include Safety and Financial analysts
    valid_roles = ["User", "Manager", "Dispatcher", "Safety Analyst", "Financial Analyst"]
    if user.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {', '.join(valid_roles)}.")

    query = users.select().where(
        or_(users.c.username == user.username, users.c.email == user.email)
    )
    user_exist = await database.fetch_one(query)

    if user_exist:
        raise HTTPException(status_code=400, detail="User with this email or username already exists!")
    
    hashed_pass = pwd_context.hash(user.password)
    
    insert_query = users.insert().values(
        username=user.username, 
        password=hashed_pass, 
        email=user.email,
        role=user.role
    )
    await database.execute(insert_query)
    
    return {"message": f"Successfully registered as a {user.role}!"}


@app.post("/SignIn")
async def user_signin(user: UserLogin):
    
    query = users.select().where(users.c.email == user.email)
    user_exist = await database.fetch_one(query)

    if not user_exist:
        raise HTTPException(status_code=404, detail="Invalid Email or Password")
    
    if not pwd_context.verify(user.password, user_exist["password"]):
        raise HTTPException(status_code=404, detail="Invalid Email or Password")
    
    user_role=user_exist["role"]

    dashboard_route = "/"
    if user_role in ["Manager", "Dispatcher"]:
        dashboard_route = "/SecuredDashboard"
    elif user_role == "Safety Analyst":
        dashboard_route = "/SafetyDashboard"
    elif user_role == "Financial Analyst":
        dashboard_route = "/FinancialDashboard"
    else:
        dashboard_route = "/Home" # Default fallback for normal 'User'
    
    return {
        "message": "User Successfully Logged In",
        "role": user_role,
        "redirect_url": dashboard_route
    }
   


@app.post("/ForgotPassword")
async def forgot_password(data: ForgotPassword):
    
    query = users.select().where(users.c.email == data.email)
    user_exist = await database.fetch_one(query)

    if not user_exist:
        raise HTTPException(status_code=404, detail="No account found with this email.")
        
    new_hashed_pass = pwd_context.hash(data.new_password)
    
    update_query = users.update().where(users.c.email == data.email).values(password=new_hashed_pass)
    await database.execute(update_query)
    
    return {"message": "Password updated successfully!"}


@app.get("/SecuredDashboard")
async def secured_dashboard(email: str):
    query = users.select().where(users.c.email == email)
    user_data = await database.fetch_one(query)
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_data["role"] not in ["Manager", "Dispatcher"]:
        raise HTTPException(status_code=403, detail="Access Denied: Requires Dispatcher or Manager privileges.")
        
    return {
        "message": f"Access granted. Welcome to the secured dashboard, {user_data['role']}.",
        "fleet_data": "..." 
    }

# ==========================================
# NEW FEATURES: Safety & Financial Dashboards
# ==========================================

@app.get("/SafetyDashboard")
async def safety_dashboard(email: str):
    """
    Purpose: Monitor driver compliance, license expirations, and safety scores.
    Access: Manager, Safety Analyst
    """
    query = users.select().where(users.c.email == email)
    user_data = await database.fetch_one(query)
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_data["role"] not in ["Manager", "Safety Analyst"]:
        raise HTTPException(status_code=403, detail="Access Denied: Requires Safety Analyst privileges.")
        
    # Simulated compliance payload (This will later connect to your Python Driver class)
    return {
        "message": f"Welcome to the Safety & Compliance Portal, {user_data['role']}.",
        # "data": {
        #     "active_drivers": 12,
        #     "expired_licenses_flagged": ["Driver-D2 (Sarah)"],
        #     "average_fleet_safety_score": 94.2,
        #     "compliance_status": "Warning: 1 License Expired"
        # }
    }


@app.get("/FinancialDashboard")
async def financial_dashboard(email: str):
    """
    Purpose: Audit fuel spend, maintenance ROI, and operational costs.
    Access: Manager, Financial Analyst
    """
    query = users.select().where(users.c.email == email)
    user_data = await database.fetch_one(query)
    
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_data["role"] not in ["Manager", "Financial Analyst"]:
        raise HTTPException(status_code=403, detail="Access Denied: Requires Financial Analyst privileges.")
        
    # Simulated financial payload (This will later connect to your Python Vehicle class)
    return {
        "message": f"Welcome to the Financial Auditing Portal, {user_data['role']}.",
        # "data": {
        #     "total_fuel_spend": 3450.75,
        #     "total_maintenance_costs": 1200.00,
        #     "overall_operational_costs": 4650.75,
        #     "fleet_average_roi": 0.18,
        #     "flagged_assets": ["Van-05 (High Maintenance)"]
        # }
    }