from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo.collection import Collection
from pymongo.database import Database
from ..models.user import UserCreate, UserLogin, User, Token, UserSettings, UserProfileUpdate, UserPasswordUpdate, TwoFactorSetup, TwoFactorVerify, TwoFactorRecoveryRequest, TwoFactorRecoveryConfirm
from ..utils.auth import get_password_hash, verify_password, create_access_token, verify_token
from ..database import get_database
from jose import JWTError
from typing import Optional
from pydantic import EmailStr
from bson import ObjectId
from ..utils.email import send_notification_email, send_price_alert_email, send_risk_alert_email, send_news_alert_email
import os
import pyotp
import random

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_user_collection(db: Database) -> Collection:
    return db["users"]

async def get_current_user(token: str = Depends(oauth2_scheme), db: Database = Depends(get_database)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token, credentials_exception)
        email: str = payload.email
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_collection(db).find_one({"email": email})
    if user is None:
        raise credentials_exception
    user["id"] = str(user["_id"])
    return User(**user)

@router.post("/signup", response_model=User)
async def signup(user: UserCreate, db: Database = Depends(get_database)):
    collection = get_user_collection(db)
    if collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "hashed_password": hashed_password,
        "settings": UserSettings().dict()
    }
    result = collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return User(**user_dict)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Database = Depends(get_database)):
    user = get_user_collection(db).find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Check 2FA
    if user.get("two_factor_enabled", False):
        if not credentials.two_factor_code:
            raise HTTPException(status_code=403, detail="Two-factor authentication code required")
        
        totp = pyotp.TOTP(user["two_factor_secret"])
        if not totp.verify(credentials.two_factor_code):
            raise HTTPException(status_code=400, detail="Invalid two-factor authentication code")

    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users/me/settings", response_model=UserSettings)
async def get_user_settings(current_user: User = Depends(get_current_user)):
    return current_user.settings

@router.put("/users/me/settings", response_model=UserSettings)
async def update_user_settings(
    settings: UserSettings,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_user_collection(db)
    # Update the settings in the database
    collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"settings": settings.dict()}}
    )
    return settings

@router.put("/users/me/profile")
@router.post("/users/me/profile")
async def update_user_profile(
    profile: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_user_collection(db)
    update_data = {}
    if profile.name is not None:
        update_data["name"] = profile.name
    if profile.email is not None:
        # Check if email is already taken
        if profile.email != current_user.email and collection.find_one({"email": profile.email}):
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = profile.email

    if update_data:
        collection.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_data}
        )
    return {"message": "Profile updated successfully"}

@router.put("/users/me/password")
async def update_password(
    password_update: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_user_collection(db)
    
    # Verify old password
    user_in_db = collection.find_one({"_id": ObjectId(current_user.id)})
    if not verify_password(password_update.old_password, user_in_db["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Hash new password and update
    new_hashed_password = get_password_hash(password_update.new_password)
    collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    return {"message": "Password updated successfully"}

@router.post("/auth/2fa/setup", response_model=TwoFactorSetup)
async def setup_2fa(current_user: User = Depends(get_current_user)):
    # Generate a random secret
    secret = pyotp.random_base32()
    
    # Generate the provisioning URI (for QR code)
    otpauth_url = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="GoSense"
    )
    
    return {"secret": secret, "otpauth_url": otpauth_url}

@router.post("/auth/2fa/enable")
async def enable_2fa(
    verify: TwoFactorVerify,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    if not verify.secret:
        raise HTTPException(status_code=400, detail="Secret is required")
        
    # Verify the code with the secret
    totp = pyotp.TOTP(verify.secret)
    if not totp.verify(verify.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Enable 2FA in database
    collection = get_user_collection(db)
    collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "two_factor_enabled": True,
            "two_factor_secret": verify.secret
        }}
    )
    
    return {"message": "Two-factor authentication enabled"}

@router.post("/auth/2fa/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_user_collection(db)
    collection.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "two_factor_enabled": False,
            "two_factor_secret": None
        }}
    )
    return {"message": "Two-factor authentication disabled"}

@router.post("/auth/2fa/recover/request")
async def request_2fa_recovery(request: TwoFactorRecoveryRequest, db: Database = Depends(get_database)):
    collection = get_user_collection(db)
    user = collection.find_one({"email": request.email})
    
    if not user:
        # Don't reveal if user exists
        return {"message": "If your account exists, a recovery code has been sent."}
    
    if not user.get("two_factor_enabled"):
        return {"message": "Two-factor authentication is not enabled for this account."}

    # Generate 6-digit code
    recovery_code = str(random.randint(100000, 999999))
    
    # Save to DB (simple implementation, no expiry for now)
    collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"two_factor_recovery_code": recovery_code}}
    )
    
    # Send email
    await send_notification_email(
        request.email,
        "2FA Recovery Code",
        "GoSense 2FA Recovery",
        f"Your 2FA recovery code is: {recovery_code}. Use this to disable 2FA on your account."
    )
    
    return {"message": "If your account exists, a recovery code has been sent."}

@router.post("/auth/2fa/recover/confirm")
async def confirm_2fa_recovery(confirm: TwoFactorRecoveryConfirm, db: Database = Depends(get_database)):
    collection = get_user_collection(db)
    user = collection.find_one({"email": confirm.email})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid request")
        
    stored_code = user.get("two_factor_recovery_code")
    if not stored_code or stored_code != confirm.code:
        raise HTTPException(status_code=400, detail="Invalid recovery code")
        
    # Disable 2FA and clear recovery code
    collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "two_factor_enabled": False,
            "two_factor_secret": None,
            "two_factor_recovery_code": None
        }}
    )
    
    return {"message": "Two-factor authentication has been disabled. You can now log in with just your password."}

@router.post("/test-email")
# async def test_email(current_user: User = Depends(get_current_user)):
async def test_email():
    """
    Send a test email to the current user (temporarily no auth for testing)
    """
    # For testing, use a hardcoded email or get from env
    test_email = os.getenv("FROM_EMAIL", "test@example.com")

    success = await send_notification_email(
        test_email,
        "Test Notification",
        "Test Email from GoSense",
        "This is a test email to verify your email notification settings are working."
    )

    if success:
        return {"message": "Test email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")

@router.post("/test-price-alert")
async def test_price_alert():
    """
    Send a test price alert email
    """
    test_email = os.getenv("FROM_EMAIL", "test@example.com")
    success = await send_price_alert_email(test_email, "BTC/USD", 45000.00, 46000.00)
    if success:
        return {"message": "Price alert email sent"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send price alert")

@router.post("/test-risk-alert")
async def test_risk_alert():
    """
    Send a test risk alert email
    """
    test_email = os.getenv("FROM_EMAIL", "test@example.com")
    success = await send_risk_alert_email(test_email, "ETH/USD", "High Risk")
    if success:
        return {"message": "Risk alert email sent"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send risk alert")

@router.post("/test-news-alert")
async def test_news_alert():
    """
    Send a test news alert email
    """
    test_email = os.getenv("FROM_EMAIL", "test@example.com")
    success = await send_news_alert_email(
        test_email, 
        "Market Crash Incoming?", 
        "Analysts predict a major correction in the crypto market due to regulatory concerns."
    )
    if success:
        return {"message": "News alert email sent"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send news alert")