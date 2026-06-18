from datetime import datetime, timedelta, date
from typing import Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.ecom import Order
from app.core.security import get_current_user
from app.models.user import User
from app.core.analytics_utils import get_latest_data_date

router = APIRouter()

@router.get("/revenue") 
async def get_revenue(
    granularity: Literal["day", "week", "month"] = Query(default="day", description="Group revenue by day, week, or month"),
    days: int = Query(default=90, ge=7, le=730, description="Number of past days to include in the revenue calculation"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    latest = await get_latest_data_date(db)
    start_date = latest - timedelta(days=days)

    trunc = func.date_trunc(granularity, Order.created_at).label("period")

    result = await db.execute(
        select(
            trunc,
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("order_count"),
            func.avg(Order.total_amount).label("avg_order_value"),
        ).where(
            and_(
                Order.status != "cancelled",    
                Order.created_at >= start_date,
            )
        ).group_by(trunc).order_by(trunc)
    )

    rows = result.fetchall()

    return {
        "granularity": granularity,
        "days": days,
        "data": [
            {
                "date": row.period.strftime("%Y-%m-%d"),
                "revenue": round(float(row.revenue), 2),
                "order_count": row.order_count,
                "avg_order_value": round(float(row.avg_order_value), 2),
            }
            for row in rows
        ],
    }

@router.get("/summary")
async def get_summary(
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = await get_latest_data_date(db)
    start_date = today - timedelta(days=days)
    prev_start = start_date - timedelta(days=days)

    async def fetch_period(from_date, to_date):
        result = await db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
                func.count(Order.id).label("order_count"),
                func.coalesce(func.avg(Order.total_amount), 0).label("avg_order_value"),
            ).where(
                and_(
                    Order.status != "cancelled",
                    Order.created_at >= from_date,
                    Order.created_at < to_date,
                )
            )
        )
        return result.one()

    current = await fetch_period(start_date, today)
    previous = await fetch_period(prev_start, start_date)

    def pct_change(current, previous):
        if previous == 0:
            return None
        return round(((current - previous) / previous) * 100, 1)

    return {
        "period_days": days,
        "current": {
            "revenue": round(float(current.revenue), 2),
            "order_count": current.order_count,
            "avg_order_value": round(float(current.avg_order_value), 2),
        },
        "previous": {
            "revenue": round(float(previous.revenue), 2),
            "order_count": previous.order_count,
            "avg_order_value": round(float(previous.avg_order_value), 2),
        },
        "changes": {
            "revenue_pct": pct_change(current.revenue, previous.revenue),
            "order_count_pct": pct_change(current.order_count, previous.order_count),
            "avg_order_value_pct": pct_change(current.avg_order_value, previous.avg_order_value),
        }
    }