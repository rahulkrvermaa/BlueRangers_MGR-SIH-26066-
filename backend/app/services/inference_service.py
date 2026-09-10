from .model_service import ModelService
from .data_service import DataService
from app.schemas.prediction import PredictionResponse, Location, SurfaceData, PredictionMetrics
import numpy as np
import math

class InferenceService:
    def __init__(self, model_service: ModelService, data_service: DataService):
        self.model_service = model_service
        self.data_service = data_service
        
    def predict(self, date: str, latitude: float, longitude: float) -> PredictionResponse:
        # 1. Get indices
        time_idx, lat_idx, lon_idx = self.data_service.get_indices(
            date, latitude, longitude, self.model_service.patch_size
        )
        
        # 2. Extract patch
        patch = self.data_service.get_patch(time_idx, lat_idx, lon_idx, self.model_service.patch_size)
        
        # 3. Predict
        predicted_profile = self.model_service.predict(patch)
        
        # 4. Get Actual
        selected_date = self.data_service.available_dates[time_idx]
        selected_lat = self.data_service.target_lat[lat_idx]
        selected_lon = self.data_service.target_lon[lon_idx]
        actual_profile = self.data_service.get_actual_profile(selected_date, selected_lat, selected_lon)
        
        # 5. Get surface values
        surface_dict = self.data_service.get_surface_point(time_idx, lat_idx, lon_idx)
        
        # 6. Calculate Metrics if actual exists
        error_list, abs_error_list = None, None
        metrics = None
        actual_list = None
        
        if actual_profile is not None:
            valid = np.isfinite(predicted_profile) & np.isfinite(actual_profile)
            if np.any(valid):
                valid_pred = predicted_profile[valid]
                valid_act = actual_profile[valid]
                
                error = valid_pred - valid_act
                abs_error = np.abs(error)
                
                rmse = float(np.sqrt(np.mean(error**2)))
                mae = float(np.mean(abs_error))
                bias = float(np.mean(error))
                corr = float(np.corrcoef(valid_act, valid_pred)[0, 1]) if len(valid_pred) > 1 else None
                
                # We can replace NaNs with None for JSON serialization
                actual_list = [float(x) if np.isfinite(x) else None for x in actual_profile]
                error_list = [float(p - a) if (p is not None and a is not None) else None for p, a in zip(predicted_profile, actual_list)]
                abs_error_list = [abs(e) if e is not None else None for e in error_list]
                
                metrics = PredictionMetrics(
                    rmse=rmse if not math.isnan(rmse) else None,
                    mae=mae if not math.isnan(mae) else None,
                    bias=bias if not math.isnan(bias) else None,
                    correlation=corr if corr is not None and not math.isnan(corr) else None
                )

        return PredictionResponse(
            requested_location=Location(latitude=latitude, longitude=longitude),
            selected_grid_location=Location(latitude=float(selected_lat), longitude=float(selected_lon)),
            date=selected_date.strftime("%Y-%m-%d"),
            surface=SurfaceData(**surface_dict),
            depths=[float(d) for d in self.model_service.depths],
            predicted_temperature=[float(p) for p in predicted_profile],
            reference_temperature=actual_list,
            error=error_list,
            absolute_error=abs_error_list,
            metrics=metrics
        )
