from fastapi import APIRouter, Request
from typing import Dict, Any

router = APIRouter()

@router.get("/metadata", response_model=Dict[str, Any])
def get_metadata(request: Request):
    data_service = request.app.state.data_service
    model_service = request.app.state.model_service
    
    return {
        "study_region": {
            "latitude": [float(data_service.target_lat.min()), float(data_service.target_lat.max())],
            "longitude": [float(data_service.target_lon.min()), float(data_service.target_lon.max())]
        },
        "grid_resolution": "0.25 deg",
        "dates": {
            "start": data_service.available_dates[0].strftime("%Y-%m-%d"),
            "end": data_service.available_dates[-1].strftime("%Y-%m-%d"),
            "available": [d.strftime("%Y-%m-%d") for d in data_service.available_dates]
        },
        "depth_levels": [float(d) for d in model_service.depths],
        "variables": model_service.features,
        "patch_size": model_service.patch_size,
        "model_name": "OceanEmbed Patch-CNN",
        "supported_demonstration_period": "15-day demonstration dataset"
    }
