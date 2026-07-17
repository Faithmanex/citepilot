import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.router import router as v1_router
from .config import settings

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="CitePilot AI Service",
    version="0.1.0",
    description="AI-powered citation analysis service using Gemini API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "citepilot-ai"}


def main():
    uvicorn.run(
        "citepilot_ai.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.log_level == "debug",
    )


if __name__ == "__main__":
    main()
