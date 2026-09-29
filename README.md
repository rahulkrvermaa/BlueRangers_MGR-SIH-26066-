# OceanEmbed: AI-Based Subsurface Ocean Temperature Reconstruction

OceanEmbed is an oceanographic machine-learning project that reconstructs 3D subsurface ocean temperature profiles from daily surface ocean satellite observations. This repository provides the complete Smart India Hackathon (SIH) demonstration, featuring a FastAPI backend and a React/TypeScript frontend visualization dashboard.

## Problem Statement
Subsurface ocean temperature is difficult to observe continuously because in-situ subsurface observations (like ARGO floats) are sparse and expensive. However, surface ocean variables such as sea surface temperature, salinity, sea surface height, currents, and wind contain useful information for estimating the vertical temperature structure. OceanEmbed learns the relationship between spatial patterns in these surface observations and the subsurface temperature profile.

## Scientific Demonstration Details
- **Study Region:** North Indian Ocean (5°N to 30°N, 45°E to 105°E)
- **Spatial Resolution:** 0.25° × 0.25°
- **Temporal Resolution:** Daily
- **Demonstration Period:** 15 Days (2025-06-01 to 2025-06-15)
- **Model Architecture:** CNN-based Proof of Concept (Patch-based, 15×15 local spatial neighborhood)
- **Output Depths:** 15 levels (0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000m)

## Input Variables
The model uses seven surface variables harmonized to a daily 0.25° grid:
1. SST (Sea Surface Temperature)
2. SSS (Sea Surface Salinity)
3. SSH (Sea Surface Height / SLA)
4. Current U
5. Current V
6. Wind U
7. Wind V

## Validation
Validation uses the GLORYS reanalysis dataset and independent ARGO observations. 
- **GLORYS (Current PoC):** RMSE: 0.6387 °C, MAE: 0.4441 °C, Bias: 0.0244 °C, Correlation: 0.9968
- **Independent ARGO:** RMSE: 1.3032 °C, MAE: 0.9407 °C, Bias: 0.6203 °C, Correlation: 0.9903

*Note: GLORYS comparison evaluates agreement with the reanalysis target. Independent ARGO validation provides an observational check on generalization.*

## Limitations and Roadmap
- **Current Limitation:** The demonstration covers a 15-day period and is a CNN-based Proof of Concept. Predictions are estimates and should not replace direct observations.
- **Roadmap:** Multi-season/multi-year training, architecture expansion (ViT, GNN, Attention-based models), and operational data ingestion.

## Repository Structure
```
OceanVision2/
├── backend/            # FastAPI python backend
│   ├── app/            # API, services, schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # React TypeScript Vite application
│   ├── src/
│   ├── vercel.json
│   └── package.json
├── Data/               # Raw datasets (Not committed)
├── models/             # PyTorch checkpoints (oceanembed_patch_cnn_final.pth)
├── notebooks/          # Research and exploratory Jupyter notebooks
├── oceanembed_surface_025.nc        # Processed surface dataset
├── oceanembed_glorys_target_025.nc  # Processed reference dataset
└── README.md
```

## Setup Instructions

### Backend (Local)
Requires Python 3.11+.
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Local)
Requires Node.js 18+.
```bash
cd frontend
npm install
npm run dev
```

### Deployment
- **Backend:** Designed for Render, AWS ECS, or Google Cloud Run via the provided `Dockerfile`. Requires at least 1GB RAM to hold the DataArrays and Model in memory. Set `PORT` environment variable.
- **Frontend:** Designed for Vercel. Connect the GitHub repository and specify `VITE_API_BASE_URL` in the environment settings to point to the backend URL.

## SIH Demo Instructions
1. Open the deployed Frontend URL.
2. The UI will present a Control Panel. Select the demonstration date from the dropdown.
3. Click "Demo Location" (Arabian Sea or Bay of Bengal) or manually enter Latitude and Longitude.
4. Click "RECONSTRUCT TEMPERATURE".
5. The application extracts the 15x15 spatial patch, runs the CNN, and displays the predicted 0-1000m temperature profile along with the GLORYS reference (when available). Metrics are calculated dynamically.

## License
Project code is provided under an open-source license. Third-party datasets (OSTIA, SSS, SSH, OSCAR, CCMP, GLORYS) are subject to their respective terms.
