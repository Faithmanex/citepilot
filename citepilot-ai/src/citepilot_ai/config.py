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
    # Jev (TypeSafe System One) decision layer — opt-in, disabled by default.
    # When typesafe_api_key is empty, the pipeline skips all Jev calls (fail-closed to Gemini-only).
    typesafe_api_key: str = ""
    typesafe_model: str = "jev-latest"
    typesafe_enabled: bool = True  # master switch; key must also be set
    typesafe_auto_accept: float = 0.8  # confidence >= threshold → auto verdict, else review

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
