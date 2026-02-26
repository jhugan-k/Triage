from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# CONFIGURATION
HF_TOKEN = os.getenv("HF_TOKEN")
# Using the multilingual DeBERTa model
API_URL = "https://router.huggingface.co/hf-inference/models/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/classify")
def classify(payload: BugPayload):
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
            timeout=40 
        )
        
        # 1. Handle non-200 responses (like HF 503)
        if response.status_code != 200:
            print(f"[HF STATUS {response.status_code}]: {response.text}")
            raise HTTPException(status_code=503, detail="AI Model is warming up on Hugging Face")

        result = response.json()

        # 2. Handle specific "Model Loading" dictionary from Hugging Face
        if isinstance(result, dict) and "error" in result:
            # If the error contains "loading", return 503 to trigger backend retry
            if "loading" in result["error"].lower():
                raise HTTPException(status_code=503, detail="Model currently loading")
            raise HTTPException(status_code=500, detail=result["error"])

        # 3. Parse success response
        if isinstance(result, list):
            prediction = result[0]['label']
        elif isinstance(result, dict) and 'labels' in result:
            prediction = result['labels'][0]
        else:
            raise Exception("Invalid response format from HF Inference API")

        return {"severity": prediction}

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Hugging Face Timeout")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AI CRASH]: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))