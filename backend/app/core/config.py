from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────
    APP_NAME: str = "E-Commerce Analytics"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-this-in-production"

    # ── Database ──────────────────────────────────────────────────────
    # This reads DATABASE_URL from your .env file automatically.
    # The type hint `str` tells pydantic it must be a string.
    DATABASE_URL: str

    # ── Redis ─────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── OpenAI (Week 4) ───────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # This tells pydantic-settings to look for a .env file
    # SettingsConfigDict replaces the old class Config approach
    model_config = SettingsConfigDict(
    env_file="../.env",
    env_file_encoding="utf-8",
    extra="ignore",    # ignore .env values not defined in this class
)


# lru_cache means this function only runs once — the Settings object is created once and reused everywhere in the app.
@lru_cache()
def get_settings() -> Settings:
    return Settings()


# This is what other files import
settings = get_settings()