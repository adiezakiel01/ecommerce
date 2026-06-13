from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import pandas as pd
from prophet import Prophet

from app.core.database import get_db
from app.models.ecom import Order