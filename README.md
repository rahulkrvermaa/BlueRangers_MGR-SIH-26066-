<<<<<<< HEAD
# 🌊 OceanEmbed

### AI-Based Reconstruction of 3D Subsurface Ocean Temperature from Surface Ocean Observations

> **From what we can observe at the surface → to what may be happening beneath the ocean.**

![OceanEmbed Banner](assets/oceanembed-banner.png)

[![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-Deep%20Learning-ee4c2c?logo=pytorch)](https://pytorch.org/)
[![Jupyter](https://img.shields.io/badge/Jupyter-Notebook-orange?logo=jupyter)](https://jupyter.org/)
[![Ocean Science](https://img.shields.io/badge/Domain-Ocean%20Science-0077b6)]()
[![Machine Learning](https://img.shields.io/badge/ML-Patch%20CNN-purple)]()

---

## 🌊 Overview

**OceanEmbed** is an AI-based oceanographic machine-learning system designed to reconstruct the **vertical subsurface temperature structure of the North Indian Ocean** using routinely available surface-ocean observations.

The system learns relationships between **seven surface variables** and ocean temperature at multiple depths, producing a temperature profile from approximately the surface to **1000 m depth**.

Instead of predicting only a single temperature value, OceanEmbed attempts to reconstruct an entire **multi-depth ocean temperature profile** from surface information.

### The core idea

```text
        SURFACE OCEAN OBSERVATIONS
                  │
                  ▼
        ┌─────────────────────┐
        │  SST                │
        │  SSS                │
        │  SSH / SLA          │
        │  Current U / V      │
        │  Wind U / V         │
        └──────────┬──────────┘
                   │
                   ▼
        Data Harmonization
                   │
                   ▼
          0.25° × 0.25° Grid
                   │
                   ▼
             15 × 15 Patch
                   │
                   ▼
             Patch CNN
                   │
                   ▼
       15 Temperature Channels
                   │
                   ▼
       SUBSURFACE TEMPERATURE
             0–1000 m
```

---

# 🎯 Problem

Direct observations of subsurface ocean temperature are considerably more limited in space and time than surface observations.

However, surface datasets provide extensive information about the ocean state through variables such as:

* Sea Surface Temperature
* Sea Surface Salinity
* Sea Surface Height
* Surface Currents
* Surface Winds

OceanEmbed investigates the following question:

> **Can the subsurface temperature structure of the ocean be estimated from information available at the surface?**

The current prototype focuses on the **North Indian Ocean**, covering:

* **Latitude:** 5°N–30°N
* **Longitude:** 45°E–105°E
* **Spatial resolution:** 0.25° × 0.25°
* **Temporal resolution:** Daily
* **Prediction depth:** approximately 0–1000 m

---

# 🧠 What OceanEmbed Does

OceanEmbed combines heterogeneous surface-ocean datasets into a common representation and uses a spatial deep-learning model to predict temperature at **15 depth levels simultaneously**.

### Seven surface inputs

| # | Variable      | Description                            |
| - | ------------- | -------------------------------------- |
| 1 | **SST**       | Sea Surface Temperature                |
| 2 | **SSS**       | Sea Surface Salinity                   |
| 3 | **SSH / SLA** | Sea Surface Height / Sea Level Anomaly |
| 4 | **Current U** | Zonal surface-current component        |
| 5 | **Current V** | Meridional surface-current component   |
| 6 | **Wind U**    | Zonal wind component                   |
| 7 | **Wind V**    | Meridional wind component              |

These variables are harmonized onto a common **0.25° × 0.25° daily grid**.

---

# 🗺️ Study Region

```text
              NORTH INDIAN OCEAN

        45°E ───────────────────── 105°E
          │                           │
          │      Arabian Sea          │
          │                           │
    30°N ─┼───────────────────────────┤
          │                           │
          │      Indian Ocean         │
          │                           │
     5°N ─┼───────────────────────────┤
          │                           │
          └───────────────────────────┘
```

The project region spans **5°N–30°N and 45°E–105°E**, covering major portions of the Arabian Sea, Bay of Bengal, and surrounding North Indian Ocean.

---

# 🛰️ Multi-Source Data Fusion

OceanEmbed combines information from multiple oceanographic and atmospheric products.

### Surface datasets

| Dataset               | Information Used             |
| --------------------- | ---------------------------- |
| **OSTIA**             | Sea Surface Temperature      |
| **Satellite SSS**     | Sea Surface Salinity         |
| **Satellite SSH/SLA** | Sea Surface Height / Anomaly |
| **OSCAR**             | Surface Current U/V          |
| **CCMP**              | Wind U/V                     |

The datasets originally have different spatial and temporal characteristics, so the preprocessing pipeline harmonizes them into a common representation.

### Target / reference data

**GLORYS ocean reanalysis** provides the subsurface potential-temperature target (`thetao`) used for model development and held-out validation.

### Independent observational evaluation

**INCOIS Gridded ARGO VAM 10-day Temperature** is used separately as an independent observational comparison rather than as a training target.

---

# 🔄 Data Processing Pipeline

```text
OSTIA SST
     │
Satellite SSS ───────┐
     │               │
Satellite SSH ───────┤
     │               │
OSCAR Current U/V ───┤
     │               │
CCMP Wind U/V ───────┘
          │
          ▼
   Regional Selection
          │
          ▼
      Quality Control
          │
          ▼
    Spatial Regridding
          │
          ▼
    Temporal Alignment
          │
          ▼
    Common 0.25° Grid
          │
          ▼
  Seven Surface Features
          │
          ▼
   15 × 15 Patch Extraction
          │
          ▼
       Patch CNN
          │
          ▼
 15-Depth Temperature Field
          │
       ┌──┴──────────────┐
       ▼                 ▼
 GLORYS Validation   ARGO Comparison
```

---

# 🧹 Data Preprocessing

The preprocessing pipeline addresses several practical issues associated with heterogeneous oceanographic datasets.

### Spatial harmonization

All surface variables are transformed onto a common:

**0.25° × 0.25° grid**

with:

* 100 latitude points
* 240 longitude points
* 24,000 total grid cells

The final surface representation contains:

**15 × 100 × 240 × 7**

daily surface observations.

### Missing values

A common ocean mask is generated across the seven surface variables.

The final common surface region contains:

* **11,051 valid locations**
* **24,000 total grid locations**
* approximately **46.05%** valid coverage

SSS missing values were handled using temporal interpolation followed by spatial nearest-neighbour filling within the surface processing stage.

### Feature standardization

Each feature is standardized using statistics calculated from the training period:

```text
X_scaled = (X - μ_train) / σ_train
```

Validation data use the same training statistics to avoid information leakage.

---

# 🌡️ Subsurface Target

The GLORYS `thetao` variable is used as the subsurface temperature target.

The model predicts **15 representative depth levels**:

```text
0 m
5 m
10 m
20 m
30 m
50 m
75 m
100 m
125 m
150 m
200 m
300 m
500 m
700 m
1000 m
```

Where exact requested depths were unavailable, the nearest GLORYS levels were selected.

The final target representation is:

```text
Time × Depth × Latitude × Longitude

15 × 15 × 100 × 240
```

---

# 🧪 Training Strategy

The project first established a **point-based MLP baseline** before introducing the spatial Patch CNN.

## Baseline: MLP

```text
7 Surface Features
       │
       ▼
    Dense 128
       │
      ReLU
       │
    Dense 256
       │
      ReLU
       │
    Dense 128
       │
      ReLU
       │
       ▼
15 Temperature Outputs
```

The MLP treats each location independently and therefore does not explicitly model local spatial structure.

Its overall validation performance was:

**RMSE: 0.8472°C**

---

# 🧩 Why Patch CNN?

Ocean processes are spatially connected.

Nearby locations can exhibit related:

* temperature patterns
* current structures
* wind forcing
* salinity gradients
* sea-level variability

A point-based model does not directly see these local spatial relationships.

OceanEmbed therefore uses a **Patch CNN** that processes local spatial neighborhoods rather than isolated points.

---

# 🧠 Patch CNN Architecture

Each model input is a:

```text
7 × 15 × 15
```

spatial patch.

The corresponding output contains:

```text
15 × 15 × 15
```

where the 15 channels represent the 15 target depth levels.

### Architecture

```text
Input
7 × 15 × 15
     │
     ▼
Conv2D
7 → 32
     │
    ReLU
     │
     ▼
Conv2D
32 → 64
     │
    ReLU
     │
     ▼
Conv2D
64 → 64
     │
    ReLU
     │
     ▼
Conv2D
64 → 32
     │
    ReLU
     │
     ▼
1 × 1 Conv2D
32 → 15
     │
     ▼
Output
15 × 15 × 15
```

The final model contains **76,431 trainable parameters**.

---

# 🧩 Patch Construction

Instead of treating an entire daily ocean image as one training example, the spatial domain is divided into overlapping **15 × 15 patches**.

A patch is retained when at least **50% of its cells belong to the valid ocean region**.

### Training samples

```text
7,648 valid patches / day
×
12 training days
=
91,776 training patches
```

Validation:

```text
7,648 patches / day
×
3 validation days
=
22,944 validation patches
```

This increases the number of spatial training examples without creating synthetic observations.

---

# 📅 Temporal Validation

The project uses a chronological split rather than a random split.

### Training

**1 June 2025 → 12 June 2025**

### Validation

**13 June 2025 → 15 June 2025**

This provides a more realistic test of temporal generalization than randomly mixing observations across time.

---

# 📊 Results

## Patch CNN — Held-Out GLORYS Validation

| Metric          |        Result |
| --------------- | ------------: |
| **RMSE**        |  **0.6294°C** |
| **MAE**         |  **0.4345°C** |
| **Bias**        | **+0.0115°C** |
| **Correlation** |    **0.9970** |

The Patch CNN improved substantially over the MLP baseline.

### MLP vs Patch CNN

| Metric      |       MLP |     Patch CNN |
| ----------- | --------: | ------------: |
| RMSE        |  0.8472°C |  **0.6294°C** |
| MAE         |  0.5945°C |  **0.4345°C** |
| Bias        | +0.0778°C | **+0.0115°C** |
| Correlation |    0.9946 |    **0.9970** |

### Improvement

* **~25.7% lower RMSE**
* **~26.9% lower MAE**

The improvement demonstrates the value of incorporating local spatial information.

---

# 🌊 Independent ARGO Evaluation

To test whether the learned temperature structure remains consistent with an independent observational product, OceanEmbed was compared against the **INCOIS Gridded ARGO VAM 10-day temperature product**.

This comparison is intentionally separate from training.

### Important distinction

```text
GLORYS
   │
   └── Training / Reference Target

ARGO
   │
   └── Independent Observational Evaluation
```

ARGO was **not used as the training target**.

### Independent comparison

| Metric                 | ARGO Comparison |
| ---------------------- | --------------: |
| **Valid observations** |       **8,601** |
| **RMSE**               |    **1.2325°C** |
| **MAE**                |    **0.8842°C** |
| **Bias**               |   **+0.5289°C** |
| **Correlation**        |      **0.9908** |

The ARGO comparison is more challenging than GLORYS validation because it involves different data sources, temporal averaging, spatial coarsening, and observational sparsity.

---

# 📈 Depth-Wise Performance

The Patch CNN performs differently across the water column.

The most challenging region is approximately:

**75–200 m**

with the highest GLORYS validation RMSE occurring around **125 m**.

This corresponds to a region associated with strong vertical temperature gradients and thermocline variability.

---

# 🔁 Patch Reconstruction

Because patches overlap, an individual grid cell can receive multiple predictions.

OceanEmbed reconstructs the full spatial field by averaging predictions contributing to each grid cell.

```text
Patch 1 ──────┐
Patch 2 ──────┤
Patch 3 ──────┼──► Average ──► Final Grid
Patch 4 ──────┤
              ┘
```

This helps reduce boundary effects and produces a continuous spatial prediction.

---

# 🖥️ Interactive Demonstration

OceanEmbed is designed to be presented through an interactive SIH dashboard.

A user can select:

* Date
* Latitude
* Longitude

The system then retrieves the seven surface variables and feeds them into the trained Patch CNN.

### Dashboard workflow

```text
User
 │
 ▼
Select Date
 │
 ▼
Select Latitude
 │
 ▼
Select Longitude
 │
 ▼
Retrieve 7 Surface Variables
 │
 ▼
Standardization
 │
 ▼
15 × 15 Spatial Patch
 │
 ▼
Patch CNN
 │
 ▼
15-Depth Temperature Profile
 │
 ├──────► Map
 ├──────► Graph
 ├──────► Table
 └──────► ARGO Comparison
```

The dashboard is designed to display the selected location, surface conditions, North Indian Ocean map, temperature-depth graph, depth-temperature table, ARGO comparison when available, and model performance metrics.

---

# 📂 Repository Structure

```text
OceanVision/
│
├── Data/                         # Local scientific datasets (not committed)
│   ├── Agro/
│   ├── Current_UV/
│   ├── GLORYS/
│   ├── SSH/
│   ├── SSS/
│   ├── SST/
│   └── WIND_UV/
│
├── models/
│   ├── README.md
│   └── oceanembed_patch_cnn_final.pth
│
├── notebooks/
│   └── README.md
│
├── samples/
│   └── README.md
│
├── results/
│   └── README.md
│
├── src/
│   └── __init__.py
│
├── Ocean_embeded_dashboard.ipynb
├── OceanTitan.ipynb
├── requirements.txt
├── LICENSE
├── .gitignore
└── README.md
```

> **Note:** Large scientific `.nc` datasets are intentionally kept outside the Git repository. The repository contains the project documentation, notebooks, and model artifact necessary for the public project structure.

---

# 📦 Model Checkpoint

The final trained Patch CNN is saved as:

```text
models/oceanembed_patch_cnn_final.pth
```

The checkpoint contains:

* Model state dictionary
* Training mean
* Training standard deviation
* Feature names
* Target depths
* Patch size

This allows the model to be reloaded without retraining.

---

# ⚠️ Current Limitations

OceanEmbed is currently a **research prototype / SIH demonstration**, not a fully operational ocean forecasting system.

### 1. Limited training period

The current dataset covers only:

**1–15 June 2025**

Therefore, the present model cannot establish year-round or multi-year generalization.

### 2. GLORYS-based training target

The model learns from GLORYS and may therefore inherit characteristics or biases present in the reanalysis.

### 3. Independent ARGO error is higher

The independent ARGO comparison produces approximately:

**1.2325°C RMSE**

which is higher than the held-out GLORYS validation error.

### 4. Limited spatial coverage

The common valid surface/GLORYS region represents approximately **36.87%** of the full regional grid.

### 5. Thermocline uncertainty

The **75–200 m** region presents relatively higher prediction errors.

---

# 🚀 Future Scope

The next development stages could expand OceanEmbed in several directions.

### 🌍 Longer training periods

```text
15 Days
   ↓
Months
   ↓
Seasons
   ↓
Multiple Years
```

This could allow the model to learn seasonal variability, monsoon effects, interannual variability, cyclone-related changes, and different ocean regimes.

### 🧩 Additional surface variables

Potential future inputs include:

* Surface heat flux
* Precipitation
* Mixed-layer depth
* Chlorophyll
* Atmospheric pressure
* Radiation
* Evaporation

### 🧠 Advanced architectures

Future experiments could investigate:

* U-Net
* ResNet
* ConvLSTM
* Temporal CNN
* Transformer
* Vision Transformer
* Spatiotemporal Transformer

### 📐 Uncertainty estimation

A future version could provide:

```text
Prediction
    +
Confidence / Uncertainty
```

rather than only a single deterministic prediction.

### ⚡ Operational deployment

With longer historical datasets and suitable near-real-time inputs, OceanEmbed could eventually be developed toward near-real-time subsurface ocean-state estimation.

---

# 💡 Key Technical Contributions

OceanEmbed currently demonstrates six major technical contributions:

### 1. Multi-source data fusion

Seven heterogeneous surface-ocean variables are combined into one representation.

### 2. Common spatial-temporal representation

Data are harmonized onto a **0.25° daily grid**.

### 3. Multi-depth prediction

The model predicts **15 temperature levels simultaneously**.

### 4. Spatial deep learning

The Patch CNN captures local spatial context.

### 5. Independent validation

The model is evaluated against an independent Gridded ARGO observational product.

### 6. Interactive AI demonstration

The system can be exposed through a date/location interactive interface.

---

# 🏆 Final Performance Snapshot

| Category                |             Result |
| ----------------------- | -----------------: |
| Study Region            | North Indian Ocean |
| Spatial Resolution      |  **0.25° × 0.25°** |
| Surface Variables       |              **7** |
| Prediction Depths       |             **15** |
| Maximum Depth           |         **1000 m** |
| Patch Size              |        **15 × 15** |
| Model                   |      **Patch CNN** |
| Parameters              |         **76,431** |
| GLORYS RMSE             |       **0.6294°C** |
| GLORYS MAE              |       **0.4345°C** |
| GLORYS Correlation      |         **0.9970** |
| ARGO RMSE               |       **1.2325°C** |
| ARGO MAE                |       **0.8842°C** |
| ARGO Correlation        |         **0.9908** |
| RMSE Improvement vs MLP |         **~25.7%** |
| MAE Improvement vs MLP  |         **~26.9%** |

These results are reported separately because GLORYS is the model-development reference while ARGO is an independent observational comparison.

---

# 🌊 Why OceanEmbed Matters

Ocean observations tell us a great deal about what is happening **at the surface**.

But many important ocean processes occur below the surface.

OceanEmbed explores a simple but powerful idea:

> **Use information we can observe frequently at the surface to infer the ocean's hidden vertical temperature structure.**

This can potentially support future work in:

* 🌊 Ocean monitoring
* 🌦️ Climate analysis
* 🌀 Cyclone and storm studies
* 🐟 Marine ecosystem research
* 📡 Ocean observation
* 🌍 Climate prediction
* 🚨 Disaster management
* 🔬 Scientific research

The current project demonstrates the feasibility of this approach while clearly identifying the need for longer training periods and stronger independent validation.

---

# 🧪 Reproducibility

The project notebooks contain the current experimental workflow and demonstration components.

Large scientific datasets are **not included in the Git repository** and should be obtained separately from their respective data providers.

The repository intentionally keeps large `.nc` datasets outside version control.

For reproducible experiments, use the same:

* spatial domain
* temporal period
* feature definitions
* target depth levels
* preprocessing strategy
* training/validation split
* model configuration

described in the project documentation.

---

# 📚 Project Documentation

The repository contains additional documentation in:

```text
Data/README.md
models/README.md
notebooks/README.md
samples/README.md
results/README.md
```

These files describe the intended role of each project component.

---

# 👥 Project Context

**OceanEmbed** was developed as an AI/oceanographic data-science prototype for the **Smart India Hackathon (SIH)** context.

The project combines:

**Oceanography + Multi-source Data Fusion + Deep Learning + Spatial Modeling + Interactive Visualization**

to explore AI-assisted reconstruction of subsurface ocean temperature.

---

# 📌 Project Status

### 🟢 Prototype / Research Demonstration

Current capabilities:

* [x] Multi-source surface data fusion
* [x] Common 0.25° grid
* [x] Seven surface features
* [x] GLORYS subsurface target generation
* [x] MLP baseline
* [x] Patch CNN
* [x] Chronological validation
* [x] Overlapping patch reconstruction
* [x] Independent ARGO comparison
* [x] Saved trained checkpoint
* [x] Interactive demonstration workflow

Future work:

* [ ] Multi-month / multi-year training
* [ ] Broader independent observational validation
* [ ] Uncertainty estimation
* [ ] Near-real-time inputs
* [ ] Advanced spatiotemporal architectures
* [ ] Operational deployment

---

# ⭐ Final Takeaway

**OceanEmbed demonstrates that surface-ocean information can be combined with spatial deep learning to reconstruct a useful approximation of subsurface temperature structure.**

The final Patch CNN achieved approximately **0.629°C RMSE on held-out GLORYS validation**, improving substantially over the point-based MLP baseline. An independent 10-day VAM ARGO comparison achieved approximately **1.233°C RMSE**, providing an additional observational consistency test while also highlighting the challenge of transferring from reanalysis-based training targets to independent observations.

The long-term goal is to move from a short-period prototype toward a more general **AI-based subsurface ocean-state reconstruction system** through longer historical training data, broader validation, uncertainty estimation, and eventually near-real-time deployment.

---

## 🌊 OceanEmbed

### *Seeing below the surface with AI.*

---
=======
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
>>>>>>> f8f88c2 (Prepare OceanEmbed for SIH deployment)
