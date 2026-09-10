from fastapi import APIRouter
from typing import Dict

router = APIRouter()

@router.get("/health", response_model=Dict[str, str])
def health_check():
    return {
        "status": "ok",
        "model": "OceanEmbed CNN"
    }
