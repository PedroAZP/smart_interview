from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra="ignore", env_file_encoding="utf-8")

    gemini_api_key: str
    gemini_model: str
    jwt_secret: str = "smart-interview-super-secret-key-change-in-production"
    google_client_id: Optional[str] = None

settings = Settings()
