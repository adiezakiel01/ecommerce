from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    "All models will inherit from this class, which provides the base for SQLAlchemy's ORM mapping."
    pass