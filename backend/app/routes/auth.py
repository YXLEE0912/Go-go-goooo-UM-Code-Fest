from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo.collection import Collection
from pymongo.database import Database
from ..models.user import UserCreate, User, Token
from ..utils.auth import get_password_hash, verify_password, create_access_token, verify_token
from ..database import get_database
from jose import JWTError

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
    user_dict = {"email": user.email, "hashed_password": hashed_password}
    result = collection.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return User(**user_dict)

@router.post("/login", response_model=Token)
async def login(credentials: UserCreate, db: Database = Depends(get_database)):
    user = get_user_collection(db).find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user