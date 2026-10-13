# Production Dockerfile for OceanEmbed API backend (build context: repository root)
FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies for netCDF4 / numpy compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/app app

# Copy model checkpoint and scientific datasets
COPY models /models
COPY oceanembed_surface_025.nc /oceanembed_surface_025.nc
COPY oceanembed_glorys_target_025.nc /oceanembed_glorys_target_025.nc

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

