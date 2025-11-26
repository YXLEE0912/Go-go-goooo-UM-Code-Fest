from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.notification import Notification, NotificationCreate
from ..models.user import User
from ..routes.auth import get_current_user
from ..database import get_database
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def get_notification_collection(db: Database):
    return db["notifications"]

@router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_notification_collection(db)
    notifications = list(collection.find({"user_id": current_user.id}).sort("timestamp", -1).limit(50))
    
    # Convert ObjectId to string and format timestamp
    for notif in notifications:
        notif["id"] = str(notif["_id"])
        # Ensure timestamp is datetime
        if isinstance(notif.get("timestamp"), str):
             try:
                 notif["timestamp"] = datetime.fromisoformat(notif["timestamp"])
             except:
                 notif["timestamp"] = datetime.now()
                 
    return notifications

@router.post("/notifications", response_model=Notification)
async def create_notification(
    notification: NotificationCreate,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_notification_collection(db)
    
    new_notification = notification.dict()
    new_notification["user_id"] = current_user.id
    new_notification["timestamp"] = datetime.now()
    
    result = collection.insert_one(new_notification)
    
    new_notification["id"] = str(result.inserted_id)
    return new_notification

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_notification_collection(db)
    result = collection.update_one(
        {"_id": ObjectId(notification_id), "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"message": "Notification marked as read"}

@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_database)
):
    collection = get_notification_collection(db)
    collection.update_many(
        {"user_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}
