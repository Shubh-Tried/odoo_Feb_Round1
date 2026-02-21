import asyncio
from passlib.context import CryptContext
from db import database, metadata, engine
from models import users

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_users():
    # Ensure the table exists
    metadata.create_all(engine)
    await database.connect()

    # Define our test users
    test_users = [
        {"username": "normal_user", "email": "user@test.com", "password": "password123", "role": "User"},
        {"username": "dispatch_pro", "email": "dispatcher@test.com", "password": "password123", "role": "Dispatcher"},
        {"username": "fleet_manager", "email": "manager@test.com", "password": "password123", "role": "Manager"},
        {"username": "finance_guru", "email": "finance@test.com", "password": "password123", "role": "Financial Analyst"},
        {"username": "safety_first", "email": "safety@test.com", "password": "password123", "role": "Safety Analyst"}
    ]

    print("Seeding database...")
    for u in test_users:
        # Check if user already exists to prevent duplicate errors
        query = users.select().where(users.c.email == u["email"])
        exists = await database.fetch_one(query)
        
        if not exists:
            hashed_pass = pwd_context.hash(u["password"])
            insert_query = users.insert().values(
                username=u["username"], 
                email=u["email"], 
                password=hashed_pass, 
                role=u["role"]
            )
            await database.execute(insert_query)
            print(f"Created: {u['role']} ({u['email']})")
        else:
            print(f"Skipped: {u['email']} already exists.")

    await database.disconnect()
    print("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_users())