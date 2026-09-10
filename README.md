# OceanEmbed: AI-Based Reconstruction of 3D Subsurface Ocean Temperature From Surface Ocean Observations

## Project Overview
OceanEmbed is an oceanographic machine-learning project that reconstructs 3D subsurface ocean temperature profiles from surface ocean observations. The workspace contains an interactive dashboard notebook that loads surface-feature NetCDF files and a trained PyTorch patch-based CNN model to compare predictions against GLORYS reference temperature profiles.

## Problem Statement
Subsurface ocean temperature is difficult to observe continuously because in situ subsurface observations are sparse and expensive. Surface ocean variables such as sea surface temperature, salinity, sea surface height, currents, and wind contain useful information for estimating the vertical temperature structure.

## Objectives
The files and notebooks in this workspace support:
- Loading preprocessed surface input datasets from NetCDF files.
- Reconstructing temperature profiles from a patch-CNN model.
- Comparing predicted profiles with GLORYS reference profiles.
- Generating an interactive dashboard for selected dates and locations.

## Methodology
The confirmed workflow in the notebook uses a PyTorch convolutional neural network with a patch-based design. The model is recreated from a checkpoint file, `oceanembed_patch_cnn_final.pth`, and receives a 7-feature surface tensor prepared from the processed NetCDF file `oceanembed_surface_025.nc`. The model output is used to generate a 15-depth subsurface temperature profile. The GLORYS file `oceanembed_glorys_target_025.nc` is used as the target/reference profile for evaluation.

## Input Variables
Confirmed notebook inputs used in the dashboard:
- SST (`sst`)
- SSS (`sss`)
- SSH (`ssh`)
- Current U (`current_u`)
- Current V (`current_v`)
- Wind U (`wind_u`)
- Wind V (`wind_v`)

The model checkpoint stores `features`, `depths`, `patch_size`, `train_mean`, and `train_std`, indicating the input feature list and normalization information.

## Target
The target is the subsurface temperature profile `thetao` in the GLORYS reference file `oceanembed_glorys_target_025.nc`. The notebook compares predicted profiles from the trained CNN against this GLORYS reference.

## Dataset
This repository keeps the raw observation and reanalysis data locally in the `Data/` directory. The public GitHub repository should only include safe documentation, sample files if approved, and code or notebook artifacts. The raw NetCDF datasets are not committed to the repository.

## Project Structure
```text
OceanVision/
├── notebooks/
│   ├── Ocean_embeded_dashboard.ipynb
│   └── OceanTitan.ipynb
├── src/
│   ├── __init__.py
│   └── README.md
├── data/
│   └── README.md
├── samples/
│   └── README.md
├── models/
│   ├── README.md
│   └── oceanembed_patch_cnn_final.pth
├── results/
│   └── README.md
├── README.md
├── requirements.txt
└── .gitignore
```

## Installation
```bash
git clone https://github.com/rahulkrvermaa/OceanVision-SIH-26066-.git
cd OceanVision

python -m venv .venv
# Activate on Windows
.\.venv\Scripts\activate
# Activate on macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
```

## Usage
1. Obtain the project data from the local raw data directory following the data inventory in `data/README.md`.
2. Place the NetCDF data in the `Data/` directory structure or update paths in the notebooks.
3. Run the dashboard notebook `Ocean_embeded_dashboard.ipynb` to load the model and processed files.
4. Use the notebook cell that loads `oceanembed_surface_025.nc` and `oceanembed_patch_cnn_final.pth` for inference.
5. Compare predictions with the GLORYS target file `oceanembed_glorys_target_025.nc`.

## Model
The model architecture in the notebook is a PyTorch `nn.Sequential` stack with 5 convolutional stages and a final 1x1 convolution, producing 15 depth outputs from a 7-feature input patch. The trained weights are stored in `oceanembed_patch_cnn_final.pth` and are loaded via the checkpoint dictionary with `model_state_dict` and metadata such as `features`, `depths`, `patch_size`, `train_mean`, and `train_std`.

## Results
Performance metrics are produced in the dashboard notebook (`RMSE`, `MAE`, `Bias`, and `Correlation`) when the dashboard generates validation or test profile comparisons. The notebook demonstrates metric calculation but does not include a persistent benchmark report in the repository. Performance metrics will be added after systematic evaluation.

## Visualization
The dashboard notebook creates:
- an interactive map of the selected location,
- a surface-condition table,
- a predicted-vs-actual profile plot,
- a depth-wise comparison table.

## Reproducibility
The notebook imports and uses the following confirmed packages: `numpy`, `pandas`, `xarray`, `torch`, `torch.nn`, `matplotlib`, `ipywidgets`, `plotly`, and `IPython.display`. The workspace currently relies on local NetCDF files and the local checkpoint file, and it does not include a packaged training script or a deterministic random-seed manifest.

## Data Availability
The raw data are stored locally in the `Data/` folder and separated by variable/source:
- SST / OSTIA
- SSS
- SSH / satellite altimetry
- OSCAR currents
- CCMP wind
- GLORYS reference data
The raw source datasets should be downloaded or copied into the data directory by the user before running the notebook.

## Citation
Citation details are not available in the repository files. Please cite the source datasets and files according to their respective providers and licenses when publishing results.

## License
Use an open-source code license such as Apache-2.0 or MIT for the project source code. Third-party scientific datasets such as OSTIA, SSS, SSH, OSCAR, CCMP, and GLORYS must be checked separately and may have their own terms of use and redistribution requirements.
