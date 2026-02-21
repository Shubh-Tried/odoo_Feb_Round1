<<<<<<< HEAD
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
=======
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
>>>>>>> 77970be2dc6760e5e0d90184cfbb7c737b07cfae
    new_password: str