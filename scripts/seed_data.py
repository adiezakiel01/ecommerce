import asyncio
import random
import sys
from datetime import datetime, timedelta, date
from decimal import Decimal

import numpy as np
from faker import Faker

import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models.base import Base
from app.models.ecom import Product, Customer, Order, OrderItem


fake = Faker() 
random.seed(42)
np.random.seed(42)

DATABASE_URL = "postgresql+asyncpg://analytics:analytics_dev@localhost:5433/ecommerce_analytics"
N_PRODUCTS   = 1_000
N_CUSTOMERS  = 5_000
N_ORDERS     = 20_000
DAYS_HISTORY = 730

CATALOGUE = [
    ("Electronics", 300, 1400),
    ("Clothing", 15, 150),
    ("Home & Kitchen", 20, 200),
    ("Sports", 30, 500),
    ("Beauty", 10, 80),
]

def get_day_weight(d: date) -> float:
    weight = 1.0
    month, day = d.month, d.day

    monthly = {
        1: 0.8,   
        2: 0.9,  
        3: 0.95,   
        4: 1.0,  
        5: 1.0,   
        6: 1.0,   
        7: 0.85,  
        8: 0.85,   
        9: 1.0,   
        10:1.1,  
        11:1.1,  
        12:1.8,   
    }

    weight *= monthly[month]

    # Add spikes for holidays
    if month == 11 and 25 <= day <= 30:  # Black Friday/Cyber Monday
        weight *= 3.5
    if month == 12 and 18 <= day <= 24:  # Christmas Eve/Day
        weight *= 2.2
    if month == 2 and 10 <= day <= 14: # Valentine's Day
        weight *= 1.5

    dow_weights = {0: 0.95, 1: 0.9, 2: 0.9, 3: 0.95, 4: 1.1, 5: 1.3, 6: 1.2}
    weight *= dow_weights[d.weekday()]

    return weight

async def seed(db: AsyncSession):
    print("🌱 Starting seed...")

    print(f"📦 Seeding {N_PRODUCTS} products...")
    products = []

    for i in range(N_PRODUCTS):
        category, price_min, price_max = random.choice(CATALOGUE)
        price = round(random.uniform(price_min, price_max), 2)
        cost = round(price * random.uniform(0.35, 0.65), 2)

        product = Product(
            sku=f"SKU-{i+1:05d}",
            name=f"{fake.word().title()} {category} {fake.color_name().title()}",
            price=Decimal(str(price)),
            cost=Decimal(str(cost)),
            stock_qty=random.randint(0, 500),
            is_active=random.random() > 0.05,
        )
        db.add(product)
        products.append(product)

    await db.flush()  # Flush to get product IDs
    print(f"  ✓ {N_PRODUCTS} products")

    print(f"👥 Seeding {N_CUSTOMERS} customers...")
    customers = []

    for i in range(N_CUSTOMERS):
        customer = Customer(
            email=fake.unique.email(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            phone=fake.phone_number()[:20],
        )
        db.add(customer)
        customers.append(customer)

    await db.flush()  # Flush to get customer IDs
    print(f"  ✓ {N_CUSTOMERS} customers")

    print(f"🛒 Seeding {N_ORDERS} orders...")

    start_date = date.today() - timedelta(days=DAYS_HISTORY)
    all_dates = [start_date + timedelta(days=i) for i in range(DAYS_HISTORY)]

    weights = [get_day_weight(d) for d in all_dates]
    total = sum(weights)
    probs = [w / total for w in weights]

    chosen_indexes = np.random.choice(len(all_dates), size=N_ORDERS, p=probs)

    order_number = 10000

    for batch_start in range(0, N_ORDERS, 500):

        batch_end = min(batch_start + 500, N_ORDERS)

        for i in range(batch_start, batch_end):
            order_date = all_dates[chosen_indexes[i]]
            customer = random.choice(customers)

            num_items = random.choices([1, 2, 3, 4], weights=[50, 30, 15, 5])[0]

            subtotal = Decimal("0")
            order_items_data = []

            for _ in range(num_items):
                product = random.choice(products)
                qty = random.randint(1, 5)
                item_total = product.price * qty
                subtotal += item_total

                order_items_data.append((product, qty, item_total))

            discount = Decimal("0")
            if random.random() < 0.2:
                discount = round(subtotal * Decimal(str(random.uniform(0.05, 0.25))), 2)
                
            tax = round((subtotal - discount) * Decimal("0.08"), 2)
            shipping = Decimal("5.99") if subtotal < 50 else Decimal("0")
            total_amount = subtotal - discount + tax + shipping

            status = random.choices(
                ["delivered", "shipped", "confirmed", "pending", "cancelled"],
                weights=[60, 15, 10, 5, 10],
            )[0]

            order = Order(
                order_number=f"ORD-{order_number:07d}",
                customer_id=customer.id,
                status=status,
                subtotal=subtotal,
                discount_amount=discount,
                tax_amount=tax,
                shipping_amount=shipping,
                total_amount=total,
                created_at=datetime.combine(order_date, fake.time_object()
                ),
            )

            db.add(order)
            await db.flush() # Flush to get order ID

            for product, qty, item_total in order_items_data:
                db.add(OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=product.price,
                    unit_cost=product.cost,
                    total_price=item_total,
                ))

            order_number += 1

        await db.commit()
        print(f" {batch_end} / {N_ORDERS} orders")

    print(f"\n✅ Seeding completed!")
    print(f"  - {N_PRODUCTS} products")
    print(f"  - {N_CUSTOMERS} customers")
    print(f"  - {N_ORDERS} orders")
    print(f"  - Date range: {start_date} to {date.today()}")

async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:

        await seed(session)
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
