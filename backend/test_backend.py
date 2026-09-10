import asyncio
from fastapi import FastAPI
from app.main import lifespan, app
from app.schemas.prediction import PredictionRequest
from fastapi.testclient import TestClient

client = TestClient(app)

def test():
    with client:
        # Client automatically triggers lifespan
        print("Testing /health")
        resp = client.get("/health")
        print(resp.json())
        
        print("Testing /metadata")
        resp = client.get("/metadata")
        print(resp.json())
        
        print("Testing /predict")
        req = PredictionRequest(date="2025-06-10", latitude=15.5, longitude=65.5)
        resp = client.post("/predict", json=req.model_dump())
        if resp.status_code == 200:
            res = resp.json()
            print("Prediction successful!")
            print("Selected grid:", res["selected_grid_location"])
            print("Predicted temperature len:", len(res["predicted_temperature"]))
            if res.get("metrics"):
                print("Metrics RMSE:", res["metrics"]["rmse"])
        else:
            print("Prediction failed:", resp.status_code, resp.text)

if __name__ == "__main__":
    test()
