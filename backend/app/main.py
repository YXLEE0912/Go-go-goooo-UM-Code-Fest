from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.auth import router as auth_router
from .routes.chat import router as chat_router
from .routes.predict import router as predict_router
from .routes.news import router as news_router

app = FastAPI(title="GoSense API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development/hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(predict_router, prefix="/api", tags=["predict"])
app.include_router(news_router, prefix="/api", tags=["news"])

@app.get("/")
async def root():
    return {"message": "Welcome to the GoSense API"}