import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.models.ecom import Product
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

from app.core.security import get_current_user, require_role
from app.models.user import User

router = APIRouter()

# List products with pagination
@router.get("/", response_model=List[ProductRead])
async def list_products(
    skip: int = 0,
    limit: int = 20,
    search: str | None = Query(default=None, description="Search by product name or SKU"),
    is_active: bool | None = Query(default=None, description="Filter by active status. Omit to show all."),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Product)

    if is_active is not None:
        query = query.where(Product.is_active == is_active)

    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
            )
        )

    query = query.offset(skip).limit(min(limit, 100)).order_by(Product.created_at.desc())

    result = await db.execute(query)
    products = result.scalars().all()
    return products

# Get a single product by ID
@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {product_id} not found")
    return product

# Create a new product
@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(product_data: ProductCreate, current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
    existing_product = await db.execute(select(Product).where(Product.sku == product_data.sku))
    if existing_product.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product with SKU {product_data.sku} already exists")
    
    product = Product(**product_data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product

@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(product_id: uuid.UUID, product_data: ProductUpdate, current_user: User = Depends(require_role("admin")), db: AsyncSession = Depends(get_db)):
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