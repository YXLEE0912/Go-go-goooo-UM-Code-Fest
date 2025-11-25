import os
from pymongo import MongoClient
from fastapi import Depends
from pymongo.database import Database
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB connection string
MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set")

client = MongoClient(MONGODB_URL)
db = client["auth_db"]  # Replace with your database name

try:
    # Verify connection
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print(f"❌ Error connecting to MongoDB: {e}")

def get_database() -> Database:
    return db