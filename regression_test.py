import os
import sys
import numpy as np
import pandas as pd
import xarray as xr
import torch
import torch.nn as nn

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Original Notebook Implementation
class OceanTemperatureCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.network = nn.Sequential(
            nn.Conv2d(7, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 15, kernel_size=1)
        )
    def forward(self, x):
        return self.network(x)

def run_regression_test():
    device = torch.device("cpu")
    print("Loading data for Notebook reference...")
    final_complete = xr.open_dataset("oceanembed_surface_025.nc", engine="netcdf4")
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        checkpoint = torch.load("models/oceanembed_patch_cnn_final.pth", map_location=device, weights_only=False)

    model_argo = OceanTemperatureCNN().to(device)
    model_argo.load_state_dict(checkpoint["model_state_dict"])
    model_argo.eval()

    features = checkpoint["features"]
    required_depths = np.array(checkpoint["depths"])
    patch_size = checkpoint["patch_size"]
    train_mean = checkpoint["train_mean"]
    train_std = checkpoint["train_std"]

    surface_features = final_complete[features].to_array(dim="feature").transpose("time", "feature", "latitude", "longitude")
    surface_scaled = (surface_features - train_mean) / train_std
    surface_scaled_values = surface_scaled.values.astype(np.float32)

    available_dates = pd.to_datetime(final_complete.time.values)
    target_lat = final_complete.latitude.values
    target_lon = final_complete.longitude.values

    # Test parameters
    date = "2025-06-10"
    latitude = 15.5
    longitude = 65.5

    # Notebook Prediction
    time_idx = int(np.abs(available_dates - pd.Timestamp(date)).argmin())
    lat_idx = int(np.abs(target_lat - latitude).argmin())
    lon_idx = int(np.abs(target_lon - longitude).argmin())

    half = patch_size // 2
    lat_idx = np.clip(lat_idx, half, len(target_lat) - half - 1)
    lon_idx = np.clip(lon_idx, half, len(target_lon) - half - 1)

    # Notebook Patch Extraction (already scaled)
    nb_patch_scaled = surface_scaled_values[time_idx, :, lat_idx-half:lat_idx+half+1, lon_idx-half:lon_idx+half+1]
    nb_tensor = torch.tensor(nb_patch_scaled, dtype=torch.float32).unsqueeze(0).to(device)
    
    with torch.no_grad():
        nb_prediction = model_argo(nb_tensor)
    nb_prediction = nb_prediction.cpu().numpy()[0]
    nb_depth_profile = nb_prediction[:, half, half]

    # API Backend Prediction
    print("Loading data for API backend...")
    from app.services.model_service import ModelService
    from app.services.data_service import DataService
    from app.services.inference_service import InferenceService

    model_service = ModelService("models/oceanembed_patch_cnn_final.pth")
    data_service = DataService("oceanembed_surface_025.nc", "oceanembed_glorys_target_025.nc", features)
    inference_service = InferenceService(model_service, data_service)

    # Manual extraction to compare intermediate steps
    api_time_idx, api_lat_idx, api_lon_idx = data_service.get_indices(date, latitude, longitude, patch_size)
    
    # API raw patch extraction
    api_patch_raw = data_service.get_patch(api_time_idx, api_lat_idx, api_lon_idx, patch_size)
    
    # Simulate API normalization
    api_tensor_raw = torch.tensor(api_patch_raw, dtype=torch.float32).unsqueeze(0).to(device)
    api_tensor_scaled = (api_tensor_raw - model_service.train_mean) / model_service.train_std
    api_patch_scaled = api_tensor_scaled.squeeze(0).numpy()

    api_response = inference_service.predict(date, latitude, longitude)
    api_depth_profile = np.array(api_response.predicted_temperature)

    # Comparison
    print("\n================== REGRESSION TEST ==================")
    print(f"Date: {date} | Lat: {latitude} | Lon: {longitude}")
    print("Indices Match:", time_idx == api_time_idx, lat_idx == api_lat_idx, lon_idx == api_lon_idx)
    
    patch_diff = np.max(np.abs(nb_patch_scaled - api_patch_scaled))
    print(f"Max Scaled Patch Difference: {patch_diff:.10f}")

    print("\nDepth (m) | Notebook (°C) | API (°C)      | Difference")
    print("-" * 55)
    for i, d in enumerate(required_depths):
        diff = nb_depth_profile[i] - api_depth_profile[i]
        print(f"{d:9.1f} | {nb_depth_profile[i]:13.8f} | {api_depth_profile[i]:13.8f} | {diff:10.8e}")

    max_diff = np.max(np.abs(nb_depth_profile - api_depth_profile))
    mean_diff = np.mean(np.abs(nb_depth_profile - api_depth_profile))
    rmse = np.sqrt(np.mean((nb_depth_profile - api_depth_profile)**2))

    print("\nMetrics:")
    print(f"Maximum absolute difference: {max_diff:10.8e}")
    print(f"Mean absolute difference: {mean_diff:10.8e}")
    print(f"RMSE between Notebook & API: {rmse:10.8e}")
    
    if patch_diff > 1e-5 or max_diff > 1e-5:
        print("\nWARNING: Discrepancy found! The API prediction does not exactly match the Notebook.")
    else:
        print("\nSUCCESS: The API exactly reproduces the Notebook logic.")

if __name__ == "__main__":
    run_regression_test()
