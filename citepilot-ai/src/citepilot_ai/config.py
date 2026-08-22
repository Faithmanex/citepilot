from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = 8000
    google_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"
    log_level: str = "info"
    cors_origins: str = "*"
    crossref_mailto: str = "support@citepilot.ai"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
