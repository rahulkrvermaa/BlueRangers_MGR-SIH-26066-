import os
from pydantic_settings import BaseSettings

def resolve_path(filename: str, subdirs: tuple = ()) -> str:
    # 1. Check relative to repository root (4 levels up from this file)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    candidate1 = os.path.join(base_dir, *subdirs, filename)
    if os.path.exists(candidate1):
        return candidate1

    # 2. Check standard container root paths (/models, /oceanembed_*.nc, etc.)
    for prefix in ["/", "/app", os.getcwd()]:
        candidate = os.path.join(prefix, *subdirs, filename)
        if os.path.exists(candidate):
            return candidate

    return candidate1

class Settings(BaseSettings):
    PROJECT_NAME: str = "OceanEmbed API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Model and Data Paths with environment variable overrides and smart discovery
    MODEL_PATH: str = os.getenv("MODEL_PATH") or resolve_path("oceanembed_patch_cnn_final.pth", ("models",))
    SURFACE_DATA_PATH: str = os.getenv("SURFACE_DATA_PATH") or resolve_path("oceanembed_surface_025.nc")
    TARGET_DATA_PATH: str = os.getenv("TARGET_DATA_PATH") or resolve_path("oceanembed_glorys_target_025.nc")

    class Config:
        env_file = ".env"

settings = Settings()
