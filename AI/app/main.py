from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# 1. CONFIGURATION
# Set these in your Render Environment Variables later
HF_TOKEN = os.getenv("HF_TOKEN")
# We use a powerful DeBERTa model for high accuracy
API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify(payload: BugPayload):
    text = f"{payload.title}: {payload.description}"
    
    # These are the categories the AI will choose from
    candidate_labels = ["High", "Normal", "Low"]

    # 2. CALL HUGGING FACE
    response = requests.post(API_URL, headers=headers, json={
        "inputs": text,
        "parameters": {"candidate_labels": candidate_labels}
    })

    # 3. PARSE THE RESULT
    try:
        result = response.json()
        # The first label in 'labels' is the one with the highest score
        prediction = result['labels'][0]
        return {"severity": prediction}
    except Exception as e:
        # Fallback if the API is busy or fails
        print(f"HF Error: {e}")
        return {"severity": "Normal"}