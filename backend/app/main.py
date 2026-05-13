from fastapi import FastAPI

app = FastAPI(
    title="E-Commerce Analytics API",
    description="AI-powered analytics for e-commerce businesses",
    version="1.0.0",
)

@app.get("/")
async def root():
    return {"message": "Welcome to the E-Commerce Analytics API!", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health(): ## Health check endpoint to verify that the API is running
    return {"status": "healthy", "version": "1.0.0"}
