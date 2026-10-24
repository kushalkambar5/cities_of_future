from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config import settings
from .dependencies import get_pipeline
from .routes.health import router as health_router
from .routes.detect import router as detect_router
from .routes.pipeline import router as pipeline_router

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cotf.ml")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Cities of the Future ML Services...")
    try:
        pipeline = get_pipeline()
        pipeline.preload_all()
        logger.info("All neural models loaded and ready.")
    except Exception as exc:
        logger.warning(f"Note: Some models may be lazily loaded upon first request: {exc}")
    yield
    logger.info("Shutting down ML Services...")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Scalable Computer Vision & Traffic Safety Inference Engine for Cities of the Future",
        lifespan=lifespan,
    )

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount Route Handlers
    app.include_router(health_router)
    app.include_router(detect_router)
    app.include_router(pipeline_router)

    @app.get("/", tags=["Root"])
    def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/health",
            "endpoints": [
                "/detect/speed",
                "/detect/helmet",
                "/detect/seatbelt",
                "/detect/plate",
                "/detect/accident",
                "/detect/wrong-side",
                "/pipeline/process",
            ],
        }

    return app


app = create_app()
