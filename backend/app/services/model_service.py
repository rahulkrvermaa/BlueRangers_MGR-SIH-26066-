import torch
import torch.nn as nn
import numpy as np

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

class ModelService:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = OceanTemperatureCNN().to(self.device)
        
        # Load weights and metadata
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # weights_only=False needed to load xarray DataArrays in train_mean/train_std
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
            
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()
        
        self.features = checkpoint["features"]
        self.depths = np.array(checkpoint["depths"])
        self.patch_size = checkpoint["patch_size"]
        
        # Convert xarray DataArrays to torch tensors for fast normalization
        self.train_mean = torch.tensor(checkpoint["train_mean"].values, dtype=torch.float32).view(1, 7, 1, 1).to(self.device)
        self.train_std = torch.tensor(checkpoint["train_std"].values, dtype=torch.float32).view(1, 7, 1, 1).to(self.device)

    def predict(self, x_patch: np.ndarray) -> np.ndarray:
        x_tensor = torch.tensor(x_patch, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        # Normalize in tensor
        x_tensor = (x_tensor - self.train_mean) / self.train_std
        
        with torch.no_grad():
            prediction = self.model(x_tensor)
            
        prediction = prediction.cpu().numpy()[0]
        
        half = self.patch_size // 2
        depth_profile = prediction[:, half, half]
        
        return depth_profile
