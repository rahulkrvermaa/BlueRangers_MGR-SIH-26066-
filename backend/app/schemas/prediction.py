from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class Location(BaseModel):
    latitude: float
    longitude: float

class SurfaceData(BaseModel):
    sst: float
    sss: float
    ssh: float
    current_u: float
    current_v: float
    wind_u: float
    wind_v: float

class PredictionMetrics(BaseModel):
    rmse: Optional[float] = None
    mae: Optional[float] = None
    bias: Optional[float] = None
    correlation: Optional[float] = None

class PredictionRequest(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    latitude: float = Field(..., description="Target latitude")
    longitude: float = Field(..., description="Target longitude")

class PredictionResponse(BaseModel):
    requested_location: Location
    selected_grid_location: Location
    date: str
    surface: SurfaceData
    depths: List[float]
    predicted_temperature: List[float]
    reference_temperature: Optional[List[float]] = None
    error: Optional[List[float]] = None
    absolute_error: Optional[List[float]] = None
    metrics: Optional[PredictionMetrics] = None
