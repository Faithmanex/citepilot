from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"
    log_level: str = "info"
    cors_origins: str = "*"
    crossref_mailto: str = "support@citepilot.ai"
    # Security / limits
    api_key: str = ""  # if set, clients must send X-API-Key or Authorization: Bearer <key>
    max_upload_mb: int = 10
    max_text_chars: int = 200_000  # ~30k words
    rate_limit_per_minute: int = 60

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
