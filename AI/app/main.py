from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# 1. CONFIGURATION
HF_TOKEN = os.getenv("HF_TOKEN")

# FIX: Added missing /hf-inference/ path segment to the Router URL
API_URL = "https://router.huggingface.co/hf-inference/models/MoritzLaurer/DeBERTa-v3-base-mnli-xnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify(payload: BugPayload):
    # Combining title and description for better context
    text = f"Title: {payload.title}. Description: {payload.description}"
    candidate_labels = ["High", "Normal", "Low"]

    try:
        response = requests.post(
            API_URL, 
            headers=headers, 
            json={
                "inputs": text,
                "parameters": {"candidate_labels": candidate_labels},
                "options": {"wait_for_model": True}
            },
            timeout=45 # High timeout to allow for model loading
        )
        
        # DEBUGGING: Verifying we get a 200 OK now
        print(f"[HF STATUS]: {response.status_code}")
        
        # If HF returns HTML or an error page, catch it before JSON parsing
        if "application/json" not in response.headers.get("Content-Type", ""):
            print(f"[HF NON-JSON RESPONSE]: {response.text[:100]}")
            raise HTTPException(status_code=503, detail="AI Service is warming up")

        result = response.json()
        print(f"[HF RAW RESPONSE]: {result}")

        # Handle Hugging Face specific error objects
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        # SUCCESS: Result format is {'labels': ['High', ...], 'scores': [...]}
        prediction = result['labels'][0]
        return {"severity": prediction}

    except requests.exceptions.Timeout:
        print("HF API Timeout - model took too long to load")
        raise HTTPException(status_code=504, detail="Hugging Face timed out")
    except HTTPException:
        # FIX: Let intentional HTTP errors pass through unchanged
        # Previously, HTTPExceptions raised above (503, 500) were being caught
        # by the broad Exception handler below, wrapping them in a new 500 error
        # and printing misleading [AI SERVICE CRASH] logs.
        raise
    except Exception as e:
        print(f"[AI SERVICE CRASH]: {str(e)}")
        # Triggers Backend 'Benefit of the Doubt' (High) logic
        raise HTTPException(status_code=500, detail=str(e))