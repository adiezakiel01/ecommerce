from fastapi import APIRouter
from app.api.v1.endpoints.products import router as products_router
from app.api.v1.endpoints.analytics import router as analytics_router

api_router = APIRouter()

api_router.include_router(products_router, prefix="/products", tags=["products"])

api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])