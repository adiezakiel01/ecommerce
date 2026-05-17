import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, String, DateTime, Numeric, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,  # auto-generate a UUID when creating a product
    )

    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Mapped[str | None] means this column can be NULL in the database
    description: Mapped[str | None] = mapped_column(Text)

    # Decimal for money — never use float for currency (rounding errors)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Boolean with default
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Inventory
    stock_qty: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps — server_default=func.now() means PostgreSQL sets this
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),  # auto-updates when the row changes
    )

    def __repr__(self) -> str:
        return f"<Product {self.sku}: {self.name}>"