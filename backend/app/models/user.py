from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    two_factor_code: Optional[str] = None

class UserSettings(BaseModel):
    darkMode: bool = True
    language: str = "English"
    currency: str = "USD"
    chartType: str = "Line"
    dataPoints: str = "All"
    pushNotifications: bool = True
    emailNotifications: bool = True
    soundEnabled: bool = True
    autoRefresh: bool = True
    riskAlerts: bool = True
    priceAlerts: bool = False
    newsAlerts: bool = True

class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    name: Optional[str] = None
    hashed_password: str
    settings: UserSettings = UserSettings()
    two_factor_enabled: bool = False
    two_factor_secret: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str

class TwoFactorSetup(BaseModel):
    secret: str
    otpauth_url: str

class TwoFactorVerify(BaseModel):
    code: str
    secret: Optional[str] = None

class TwoFactorRecoveryRequest(BaseModel):
    email: EmailStr

class TwoFactorRecoveryConfirm(BaseModel):
    email: EmailStr
    code: str

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str
    sources: Optional[list] = None

class ChatSession(BaseModel):
    user_id: str
    session_id: str
    messages: list[ChatMessage] = []