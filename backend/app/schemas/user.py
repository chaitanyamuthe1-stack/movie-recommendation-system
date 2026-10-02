"""
Pydantic Schemas for Users and Auth
"""

from typing import List, Optional
from pydantic import BaseModel, EmailStr
import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

class UserPreferencesUpdate(BaseModel):
    favorite_genres: List[str] = []
    favorite_movie_ids: List[int] = []

class UserProfileResponse(BaseModel):
    user: UserResponse
    preferences: Optional[dict] = None
    rating_count: int = 0
    average_rating: float = 0.0
    top_genres: List[dict] = []
    watch_count: int = 0
