from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    clerk_secret_key: str
    clerk_publishable_key: str
    clerk_jwks_url: str
    environment: str = "development"
    api_prefix: str = "/api"
    allowed_origins: list[str] = ["http://localhost:3000"]

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
