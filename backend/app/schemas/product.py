import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field  

# Pydantic models for request/response validation
class ProductCreate(BaseModel):
    sku: str = Field(..., max_length=50, description="Unique SKU for the product")
    name: str = Field(..., max_length=255, description="Name of the product")
    description: str | None = Field(None, description="Detailed description of the product")
    price: Decimal = Field(..., gt=0, description="Selling price of the product")
    cost: Decimal = Field(..., ge=0, description="Cost price of the product")
    stock_qty: int = Field(default=0, ge=0, description="Quantity of the product in stock")

class ProductRead(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    description: str | None
    price: Decimal
    cost: Decimal
    is_active: bool
    stock_qty: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}  # Allow reading from SQLAlchemy model attributes

class ProductUpdate(BaseModel):
    name: str | None = Field(None, max_length=255, description="Name of the product")
    description: str | None = Field(None, description="Detailed description of the product")
    price: Decimal | None = Field(None, gt=0, description="Selling price of the product")
    cost: Decimal | None = Field(None, ge=0, description="Cost price of the product")
    stock_qty: int | None = Field(None, ge=0, description="Quantity of the product in stock")
    is_active: bool | None = Field(None, description="Whether the product is active")