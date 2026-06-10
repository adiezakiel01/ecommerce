import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
#from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
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

IMPORTANT COLUMN RULES:
- For product revenue: use SUM(oi.total_price) — never oi.price or oi.quantity * oi.price
- For order revenue: use orders.total_amount — never orders.total
- Always join order_items → orders → products for product revenue queries

RESPONSE FORMAT — always respond with valid JSON only, no markdown, no ```json blocks, no explanation outside the JSON.
Just the raw JSON object:
{
    "sql": "SELECT ... (or null if no SQL needed)",
    "explanation": "Clear answer in 2-3 sentences",
    "chart_type": "bar or line or table or none"
}
"""
@router.post("/message", response_model=ChatResponse)
async def chat_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts a natural language question and returns an AI-generated insight, optionally with a SQL query and data for charting.
    """

    #if not settings.OPENAI_API_KEY:
      #  raise HTTPException(status_code=503, detail="OpenAI API key not configured")
    
    #llm = ChatOpenAI(model="gpt-4o", temperature=0, openai_api_key=settings.OPENAI_API_KEY, max_tokens=1000)
    llm = ChatOllama(model="qwen3.5:9b", temperature=0, base_url=settings.OLLAMA_BASE_URL)
    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    for turn in (request.history or [])[-6:]:
        if turn.get("role") == "user":
            messages.append(HumanMessage(content=turn["content"]))
        else:
            messages.append(SystemMessage(content=turn["content"]))
    messages.append(HumanMessage(content=request.message))

    try:
        response = await llm.ainvoke(messages)
        raw = response.content
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"OpenAI error: {str(e)}")
    
    import re
    raw_clean = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()

    clean = raw.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1])
    
    try:
        parsed = json.loads(clean)
    except json.JSONDecodeError:

        return ChatResponse(message=raw)
    sql = parsed.get("sql")
    explanation = parsed.get("explanation", "")
    chart_type = parsed.get("chart_type", "none")

    query_data = None

    if sql and sql.lower().startswith("select"):
        try:
            result = await db.execute(text(sql))
            columns = list(result.keys())
            rows = result.fetchmany(20)
            #query_data = [dict(zip(columns, rows)) for row in rows]
            query_data = [
                {k: float(v) if hasattr(v, '__float__') and not isinstance(v, (int, str, bool, type(None))) else v
                for k, v in row._mapping.items()}
                for row in rows
            ]
        except Exception as e:
            explanation += f" \n\n(Query error: {str(e)[:150]})"

    return ChatResponse(
        message=explanation,
        sql_query=sql,
        data=query_data,
        chart_type=chart_type if chart_type != "none" else None,
    )

@router.get("/suggestions")
async def get_suggestions():
    """Returns example questions shown in the chat UI."""
    return {
        "suggestions": [
            "What were my top 5 products by revenue last month?",
            "How many new customers did I get this week?",
            "What is my average order value by month?",
            "Which day of the week has the highest revenue?",
            "What products are low on stock?",
            "Compare revenue this month vs last month",
        ]
    }