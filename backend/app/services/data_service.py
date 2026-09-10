import xarray as xr
import pandas as pd
import numpy as np
from typing import Tuple, Optional, Dict, Any

class DataService:
    def __init__(self, surface_path: str, target_path: str, features: list):
        self.surface_ds = xr.open_dataset(surface_path, engine="netcdf4")
        self.target_ds = xr.open_dataset(target_path, engine="netcdf4") if target_path else None
        
        self.available_dates = pd.to_datetime(self.surface_ds.time.values)
        self.target_lat = self.surface_ds.latitude.values
        self.target_lon = self.surface_ds.longitude.values
        self.features = features
        
        # Precompute the surface values as a numpy array for fast slicing
        self.surface_features = self.surface_ds[self.features].to_array(dim="feature").transpose("time", "feature", "latitude", "longitude")
        self.surface_values = self.surface_features.values.astype(np.float32)
        
    def get_indices(self, date: str, lat: float, lon: float, patch_size: int) -> Tuple[int, int, int]:
        time_idx = int(np.abs(self.available_dates - pd.Timestamp(date)).argmin())
        lat_idx = int(np.abs(self.target_lat - lat).argmin())
        lon_idx = int(np.abs(self.target_lon - lon).argmin())
        
        half = patch_size // 2
        lat_idx = np.clip(lat_idx, half, len(self.target_lat) - half - 1)
        lon_idx = np.clip(lon_idx, half, len(self.target_lon) - half - 1)
        
        return time_idx, lat_idx, lon_idx

    def get_patch(self, time_idx: int, lat_idx: int, lon_idx: int, patch_size: int) -> np.ndarray:
        half = patch_size // 2
        return self.surface_values[time_idx, :, lat_idx-half:lat_idx+half+1, lon_idx-half:lon_idx+half+1]

    def get_actual_profile(self, date: pd.Timestamp, lat: float, lon: float) -> Optional[np.ndarray]:
        if self.target_ds is None:
            return None
        try:
            actual = self.target_ds["thetao"].sel(
                time=date,
                latitude=lat,
                longitude=lon,
                method="nearest"
            )
            return actual.values
        except Exception:
            return None
            
    def get_surface_point(self, time_idx: int, lat_idx: int, lon_idx: int) -> Dict[str, float]:
        vals = self.surface_values[time_idx, :, lat_idx, lon_idx]
        return {feat: float(val) for feat, val in zip(self.features, vals)}
