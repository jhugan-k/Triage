from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# 1. CONFIGURATION
HF_TOKEN = os.getenv("HF_TOKEN")

# SWITCHING TO DEBERTA: More modern, faster, and currently more stable on HF Inference API
# Using the standard endpoint (api-inference) with this model
API_URL = "https://api-inference.huggingface.co/models/MoritzLaurer/DeBERTa-v3-base-mnli-xnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify(payload: BugPayload):
    # Combine title and description for better context understanding
    text = f"Title: {payload.title}. Description: {payload.description}"
    candidate_labels = ["High", "Normal", "Low"]

    try:
        response = requests.post(
            API_URL, 
            headers=headers, 
            json={
                "inputs": text,
                "parameters": {"candidate_labels": candidate_labels},
                "options": {"wait_for_model": True} # Tells HF to wait if model is loading
            },
            timeout=30 # Increased timeout
        )
        
        print(f"[HF STATUS]: {response.status_code}")
        
        # Check if the response is actually JSON
        if "application/json" not in response.headers.get("Content-Type", ""):
            print(f"[HF ERROR CONTENT]: {response.text[:100]}")
            raise HTTPException(status_code=503, detail="AI Service Busy")

        result = response.json()
        print(f"[HF RAW RESPONSE]: {result}")

        # Handle Hugging Face specific errors
        if isinstance(result, dict) and "error" in result:
            # If rate limited or loading, trigger fallback
            raise HTTPException(status_code=500, detail=result["error"])

        # SUCCESS: DeBERTa returns the same format: {'labels': [...], 'scores': [...]}
        prediction = result['labels'][0]
        return {"severity": prediction}

    except requests.exceptions.Timeout:
        print("HF API Timeout")
        raise HTTPException(status_code=504, detail="Hugging Face timed out")
    except Exception as e:
        print(f"[AI SERVICE CRASH]: {str(e)}")
        # Return 500 to ensure Backend triggers "Benefit of the Doubt" (High) logic
        raise HTTPException(status_code=500, detail=str(e))