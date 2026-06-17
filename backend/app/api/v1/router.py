from fastapi import APIRouter
from app.api.v1.endpoints.products import router as products_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.chat import router as chat_router
from app.api.v1.endpoints.forecasting import router as forecasting_router
from app.api.v1.endpoints import analytics, chat, forecasting, products, auth

api_router = APIRouter()

api_router.include_router(auth.router)

api_router.include_router(products_router, prefix="/products", tags=["products"])

api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])

api_router.include_router(
    chat_router,
    prefix="/chat",
    tags=["AI chat"],
)

api_router.include_router(forecasting_router, prefix="/forecasting", tags=["forecasting"])