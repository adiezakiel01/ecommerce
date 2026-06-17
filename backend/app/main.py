from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import engine 
from app.models.base import Base 
from app.models import ecom 
from app.models import user
from app.api.v1.router import api_router 
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP — runs before the server accepts requests, creates all tables that don't exist yet
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database connected — tables ready")
    yield
    # SHUTDOWN — runs when server stops
    await engine.dispose()
    print("🔌 Database connection closed")

app = FastAPI(
    title="E-Commerce Analytics API",
    description="AI-powered analytics for e-commerce businesses",
    version="1.0.0",
    lifespan=lifespan,  # Use the lifespan function to manage startup/shutdown events
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")  # Include the API router with a versioned prefix

@app.get("/")
async def root():
    return {"message": "Welcome to the E-Commerce Analytics API!", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health(): ## Health check endpoint to verify that the API is running
    return {"status": "healthy", "version": "1.0.0"}
