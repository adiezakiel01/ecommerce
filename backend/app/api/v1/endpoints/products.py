import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.models.ecom import Product
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter()

# List products with pagination
@router.get("/", response_model=List[ProductRead])
async def list_products(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.is_active).offset(skip).limit(min(limit,100)).order_by(Product.created_at.desc()))
    products = result.scalars().all()
    return products

# Get a single product by ID
@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {product_id} not found")
    return product

# Create a new product
@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(product_data: ProductCreate, db: AsyncSession = Depends(get_db)):
    existing_product = await db.execute(select(Product).where(Product.sku == product_data.sku))
    if existing_product.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product with SKU {product_data.sku} already exists")
    
    product = Product(**product_data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product

@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(product_id: uuid.UUID, product_data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {product_id} not found")
    
    update_product = product_data.model_dump(exclude_unset=True)
    for field, value in update_product.items():
        setattr(product, field, value)
    
    await db.flush()
    await db.refresh(product)
    return product