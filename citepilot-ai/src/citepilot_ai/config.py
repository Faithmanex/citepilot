import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        class BaseSettings:
            pass


class Settings(BaseSettings):
    host: str = os.environ.get("HOST", "0.0.0.0")
    port: int = int(os.environ.get("PORT", 8000))
    google_api_key: str = os.environ.get("GOOGLE_API_KEY", "")
    gemini_model: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    log_level: str = os.environ.get("LOG_LEVEL", "info")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not getattr(self, "google_api_key", None):
            self.google_api_key = os.environ.get("GOOGLE_API_KEY", "")


settings = Settings()
