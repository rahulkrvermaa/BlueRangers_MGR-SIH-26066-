import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OceanEmbed API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Model and Data Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    MODEL_PATH: str = os.path.join(BASE_DIR, "models", "oceanembed_patch_cnn_final.pth")
    SURFACE_DATA_PATH: str = os.path.join(BASE_DIR, "oceanembed_surface_025.nc")
    TARGET_DATA_PATH: str = os.path.join(BASE_DIR, "oceanembed_glorys_target_025.nc")

    class Config:
        env_file = ".env"

settings = Settings()
