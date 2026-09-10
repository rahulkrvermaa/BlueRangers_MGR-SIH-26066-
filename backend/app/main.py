from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api import health, metadata, prediction
from app.services.model_service import ModelService
from app.services.data_service import DataService
from app.services.inference_service import InferenceService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML model and Data at startup
    logger.info("Initializing Model Service...")
    model_service = ModelService(settings.MODEL_PATH)
    app.state.model_service = model_service
    
    logger.info("Initializing Data Service...")
    data_service = DataService(
        surface_path=settings.SURFACE_DATA_PATH,
        target_path=settings.TARGET_DATA_PATH,
        features=model_service.features
    )
    app.state.data_service = data_service
    
    logger.info("Initializing Inference Service...")
    app.state.inference_service = InferenceService(model_service, data_service)
    
    yield
    # Cleanup on shutdown
    logger.info("Shutting down resources...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

import os

origins_env = os.getenv("ALLOW_ORIGINS", "*")
origins = [origin.strip() for origin in origins_env.split(",")] if origins_env else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(metadata.router, tags=["metadata"])
app.include_router(prediction.router, tags=["prediction"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
