from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd
from prophet import Prophet

from app.core.security import require_role
from app.models.user import User

from app.core.database import get_db
from app.models.ecom import Order

router = APIRouter()

@router.get("/revenue")
async def forecast_revenue(
    forecast_days: int = Query(default=30, ge=7, le=90, description="Number of days to forecast into the future"),
    history_days: int = Query(default=365, ge=90, le=730, description="Number of days of history to use for training the model"),
    current_user: User = Depends(require_role("admin", "analyst")),
    db: AsyncSession = Depends(get_db),
):
    """
    Forecast future revenue using Prophet based on historical order data.

    Returns:
    - historical revenue data for the specified history period
    - forecasted revenue for the specified forecast period
    - trend and seasonality components of the forecast

    The confidence bands (upper and lower) are included in the forecast to provide an estimate of the uncertainty in the predictions. The wider the bands, the less certain the forecast is.
    """

    start_date = date.today() - timedelta(days=history_days)

    result = await db.execute(
        select(
            func.date(Order.created_at).label("ds"),
            func.sum(Order.total_amount).label("y"),
        )
        .where(
            and_(
                Order.status != "cancelled",
                Order.created_at >= start_date,
            )
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )

    rows = result.fetchall()

    if len(rows) < 30:
        raise HTTPException(status_code=400, detail="Not enough historical data to train the model. At least 30 days of data is required.")
    
    df = pd.DataFrame(rows, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].astype(float)

    date_range = pd.date_range(start=df["ds"].min(), end=df["ds"].max())
    df = df.set_index("ds").reindex(date_range, fill_value=0).reset_index()
    df.columns = ["ds", "y"]

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        interval_width=0.80,
    )

    import logging
    logging.getLogger("prophet").setLevel(logging.WARNING)
    logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

    model.fit(df)

    future = model.make_future_dataframe(periods=forecast_days)
    forecast = model.predict(future)

    last_actual_date = df["ds"].max()

    historical_start = last_actual_date - timedelta(days=90)

    historical = []

    for _, row in df[df["ds"] >= historical_start].iterrows():
        historical.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "actual": round(float(row["y"]), 2),
        })

    future_forecast = []
    forecast_rows = forecast[forecast["ds"] > last_actual_date]
    for _, row in forecast_rows.iterrows():
        future_forecast.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "value": round(max(0, float(row["yhat"])), 2),
            "lower": round(max(0, float(row["yhat_lower"])), 2),
            "upper": round(max(0, float(row["yhat_upper"])), 2),
        })

    fitted = forecast[
        (forecast["ds"] >= historical_start) &
        (forecast["ds"] <= last_actual_date)
        ]
    
    fitted_data = [
        {
            "date": row["ds"].strftime("%Y-%m-%d"),
            "value": round(max(0, float(row["yhat"])), 2),
            "lower": round(max(0, float(row["yhat_lower"])), 2),
            "upper": round(max(0, float(row["yhat_upper"])), 2),
        }
        for _, row in fitted.iterrows()
    ]

    return {
        "forecast_days": forecast_days,
        "history_days": history_days,
        "historical": historical,
        "fitted": fitted_data,
        "forecast": future_forecast,
        "model_info": {
            "training_samples": len(df),
            "seasonalities": ["yearly", "weekly"],
        },
    }