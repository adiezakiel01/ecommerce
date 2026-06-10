import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings
from app.core.database import get_db

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: Optional[list[dict]] = []

class ChatResponse(BaseModel):
    message: str
    sql_query: Optional[str] = None
    data: Optional[list] = None
    chart_type: Optional[str] = None
    error: Optional[str] = None

SYSTEM_PROMPT = """
You are an assistant for an e-commerce analytics dashboard. Your task is to help users by generating SQL queries based on their natural language questions. You have read-only access to a PostgreSQL database.

DATABASE SCHEMA:
TABLE products (
    id UUID PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    stock_qty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)

TABLE customers (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20)
)

TABLE orders (
    id UUID PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    total NUMERIC(10, 2) NOT NULL
)

TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL
)

RULES:
1. Only write SELECT statements — never INSERT, UPDATE, DELETE, DROP
2. Always exclude cancelled orders from revenue: WHERE status != 'cancelled'
3. Use date_trunc() for time grouping
4. Limit results to 20 rows unless asked for more
5. Always use clear column aliases

RESPONSE FORMAT — always respond with valid JSON only, no markdown:
{
    "sql": "SELECT ... (or null if no SQL needed)",
    "explanation": "Clear answer in 2-3 sentences",
    "chart_type": "bar or line or table or none"
}
"""
