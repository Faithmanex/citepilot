import logging
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.v1.router import router as v1_router
from .config import settings
from .services.crossref_service import close_http_client

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Cleanup shared HTTP client pool on shutdown
    await close_http_client()


app = FastAPI(
    title="CitePilot AI Service",
    version="0.1.0",
    description="AI-powered citation analysis service using Gemini API",
    lifespan=lifespan,
)

# Standard CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes FIRST before static file mounting
app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "citepilot-ai"}


# API Catch-all for unhandled /api/ routes to return 404 JSON for any HTTP method
@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def api_catchall(path: str):
    raise HTTPException(status_code=404, detail="API endpoint not found")


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        # Prevent static file catch-all from intercepting unhandled API 404 routes
        if response.status_code == 404 and not scope.get("path", "").startswith("/api/"):
            return await super().get_response("index.html", scope)
        return response


# Mount web application static directory if present
web_dir = Path(__file__).resolve().parents[3] / "citepilot-web"
if web_dir.exists():
    app.mount("/", SPAStaticFiles(directory=str(web_dir), html=True), name="web")


def main():
    uvicorn.run(
        "citepilot_ai.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.log_level == "debug",
    )


if __name__ == "__main__":
    main()
