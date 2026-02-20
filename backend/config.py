from pydantic_settings import BaseSettings
import secrets

class Settings(BaseSettings):
    SECRET_KEY: str = secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = "sqlite:////opt/finance/backend/db.sqlite3"

    class Config:
        env_file = "/opt/finance/backend/.env"

settings = Settings()
