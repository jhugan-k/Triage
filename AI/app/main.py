from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# 1. CONFIGURATION
HF_TOKEN = os.getenv("HF_TOKEN")
# Using the standard inference endpoint which is more stable for Zero-Shot
API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify(payload: BugPayload):
    text = f"{payload.title}: {payload.description}"
    candidate_labels = ["High", "Normal", "Low"]

    try:
        response = requests.post(
            API_URL, 
            headers=headers, 
            json={
                "inputs": text,
                "parameters": {"candidate_labels": candidate_labels}
            },
            timeout=25
        )
        
        # DEBUGGING: Log status and content type
        print(f"[HF STATUS]: {response.status_code}")
        
        # If the response is not JSON, it's likely a 503 HTML page
        if "application/json" not in response.headers.get("Content-Type", ""):
            print(f"[HF NON-JSON ERROR]: {response.text[:100]}") # Log first 100 chars
            raise HTTPException(status_code=503, detail="AI Service Busy or Waking Up")

        result = response.json()
        print(f"[HF RAW RESPONSE]: {result}")

        # Handle specific Hugging Face error objects
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        # Success case
        prediction = result['labels'][0]
        return {"severity": prediction}

    except requests.exceptions.Timeout:
        print("HF API Timeout")
        raise HTTPException(status_code=504, detail="Hugging Face timed out")
    except Exception as e:
        print(f"[AI SERVICE CRASH]: {str(e)}")
        # We raise a 500 so the Backend triggers its "Benefit of the Doubt" logic
        raise HTTPException(status_code=500, detail=str(e))