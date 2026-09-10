from fastapi import APIRouter, Request, HTTPException
from app.schemas.prediction import PredictionRequest, PredictionResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
def predict(request: Request, body: PredictionRequest):
    try:
        inference_service = request.app.state.inference_service
        
        response = inference_service.predict(
            date=body.date,
            latitude=body.latitude,
            longitude=body.longitude
        )
        return response
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction generation failed")
