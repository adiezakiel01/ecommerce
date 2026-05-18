from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import engine # Import the database engine to ensure models are registered
from app.models.base import Base # Import the Base class to create tables
from app.models import ecom # Import the ecom models to ensure they are registered with SQLAlchemy
from app.api.v1.router import api_router # Import the API router to include in the app

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

app.include_router(api_router, prefix="/api/v1")  # Include the API router with a versioned prefix

@app.get("/")
async def root():
    return {"message": "Welcome to the E-Commerce Analytics API!", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health(): ## Health check endpoint to verify that the API is running
    return {"status": "healthy", "version": "1.0.0"}
