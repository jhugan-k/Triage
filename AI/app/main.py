from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# 1. CONFIGURATION
HF_TOKEN = os.getenv("HF_TOKEN")
# MUST USE ROUTER DOMAIN: api-inference is officially unsupported for this model
API_URL = "https://router.huggingface.co/models/facebook/bart-large-mnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify(payload: BugPayload):
    text = f"{payload.title}: {payload.description}"
    candidate_labels = ["High", "Normal", "Low"]

    try:
        # Calling the new router endpoint
        response = requests.post(
            API_URL, 
            headers=headers, 
            json={
                "inputs": text,
                "parameters": {"candidate_labels": candidate_labels}
            },
            timeout=25
        )
        
        # DEBUGGING: Log status to verify 200 OK
        print(f"[HF STATUS]: {response.status_code}")
        
        # Check if response is valid JSON
        if "application/json" not in response.headers.get("Content-Type", ""):
            print(f"[HF NON-JSON ERROR]: {response.text[:100]}")
            raise HTTPException(status_code=503, detail="AI Service Busy or Waking Up")

        result = response.json()
        print(f"[HF RAW RESPONSE]: {result}")

        # Handle Hugging Face error objects
        if isinstance(result, dict) and "error" in result:
            # If model is loading, return 503 so Backend triggers fallback
            if "currently loading" in str(result.get("error")):
                 raise HTTPException(status_code=503, detail="Model Warming Up")
            raise HTTPException(status_code=500, detail=result["error"])

        # SUCCESS CASE
        # Result format for zero-shot is usually {'labels': [...], 'scores': [...]}
        prediction = result['labels'][0]
        return {"severity": prediction}

    except requests.exceptions.Timeout:
        print("HF API Timeout")
        raise HTTPException(status_code=504, detail="Hugging Face timed out")
    except Exception as e:
        print(f"[AI SERVICE CRASH]: {str(e)}")
        # Raise 500 to ensure Backend triggers its 'Benefit of the Doubt' (High) logic
        raise HTTPException(status_code=500, detail=str(e))