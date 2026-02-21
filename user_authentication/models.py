from sqlalchemy import Table, Column, Integer, String
from db import metadata

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(50), nullable=False, index=True),
    Column("email", String, nullable=False, unique=True),
    Column("password", String),
    # Feature: Default role is now 'User'
    Column("role", String, nullable=False, default="User") 
)