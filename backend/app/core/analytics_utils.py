from datetime import date
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ecom import Order


async def get_latest_data_date(db: AsyncSession) -> date:
    """
    Returns the date of the most recent order in the database.
    Used as the 'anchor point' for all analytics calculations instead of
    the real system clock — since this is a fixed historical seed dataset,
    not live production traffic, analytics should be relative to the data
    itself, not to whatever day it happens to be when someone views the demo.
    """
    result = await db.execute(select(func.max(Order.created_at)))
    latest = result.scalar_one_or_none()
    return latest.date() if latest else date.today()