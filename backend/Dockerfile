FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and artifacts
COPY app/ app/
# In production, data and model files should be handled via cloud storage or mounted volumes, 
# but for SIH demo, we can assume they are passed into the context if small enough.
# We will run uvicorn on port specified by PORT env or default 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
