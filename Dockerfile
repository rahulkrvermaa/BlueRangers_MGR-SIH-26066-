# This Dockerfile is built from the repository root (build context = repo root)
# so that the model checkpoint in models/ is included in the image.
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/app/ app/

# Copy model checkpoint to /models, where app/core/config.py expects it
COPY models/ /models/

# Copy NetCDF data files to filesystem root, where app/core/config.py expects them (BASE_DIR resolves to /)
COPY oceanembed_surface_025.nc oceanembed_glorys_target_025.nc /

# Run uvicorn on the port specified by PORT, defaulting to 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
