import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.core.security import hash_password

DATABASE_URL = "postgresql+asyncpg://analytics:analytics_dev@localhost:5433/ecommerce_analytics"


async def seed_demo_users(session):
    """Creates fixed demo accounts for portfolio reviewers to log in with."""
    demo_users = [
        {"username": "admin", "password": "admin123", "role": "admin"},
        {"username": "analyst", "password": "analyst123", "role": "analyst"},
        {"username": "viewer", "password": "viewer123", "role": "viewer"},
    ]

    for u in demo_users:
        result = await session.execute(select(User).where(User.username == u["username"]))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  User '{u['username']}' already exists, skipping.")
            continue

        user = User(
            username=u["username"],
            hashed_password=hash_password(u["password"]),
            role=u["role"]
        )
        session.add(user)
        print(f"  Created demo user: {u['username']} ({u['role']})")

    await session.commit()


async def main():
    engine = create_async_engine(DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        print("Seeding demo users...")
        await seed_demo_users(session)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())