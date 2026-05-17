from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker, create_async_engine)
from app.core.config import settings 

# Create the async engine using the DATABASE_URL from settings
engine = create_async_engine(settings.DATABASE_URL, echo=True, pool_size=5, max_overflow=10)

# Create the async sessionmaker
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession,expire_on_commit=False)

# Dependency function to get an async database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try: 
            yield session
            await session.commit()  # Commit the transaction after yielding the session
        except Exception:
            await session.rollback() # Undo the transaction if an error occurs
            raise
        finally:
            await session.close()