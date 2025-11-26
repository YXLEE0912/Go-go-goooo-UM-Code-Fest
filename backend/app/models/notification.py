from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    message: str
    type: str = "info" # info, warning, error, success
    read: bool = False

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: str
    user_id: str
    timestamp: datetime

    class Config:
        orm_mode = True
