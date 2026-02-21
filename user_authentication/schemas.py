from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    # Feature: Default role set to 'User'
    role: str = "User" 

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPassword(BaseModel):
    email: str
    new_password: str