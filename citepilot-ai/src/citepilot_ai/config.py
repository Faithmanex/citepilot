import os

try:
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

except ImportError:
    class Settings:
        def __init__(self):
            self.host = os.environ.get("HOST", "0.0.0.0")
            self.port = int(os.environ.get("PORT", 8000))
            self.google_api_key = os.environ.get("GOOGLE_API_KEY", "")
            self.gemini_model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
            self.log_level = os.environ.get("LOG_LEVEL", "info")
            self.cors_origins = os.environ.get("CORS_ORIGINS", "*")
            self.crossref_mailto = os.environ.get("CROSSREF_MAILTO", "support@citepilot.ai")

    settings = Settings()
