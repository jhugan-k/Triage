from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# 1. CONFIGURATION
HF_TOKEN = os.getenv("HF_TOKEN")
# We use BART Large MNLI for zero-shot classification
API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify(payload: BugPayload):
    text = f"{payload.title}: {payload.description}"
    candidate_labels = ["High", "Normal", "Low"]

    # 2. CALL HUGGING FACE
    response = requests.post(API_URL, headers=headers, json={
        "inputs": text,
        "parameters": {"candidate_labels": candidate_labels}
    })

    result = response.json()

    # 3. DEBUGGING: Print the actual response to Render logs
    print(f"[HF RAW RESPONSE]: {result}")

    # 4. HANDLE ERRORS
    if "error" in result:
        # If the model is loading, HF returns a 503-style error
        # We raise an exception so the Backend knows the AI failed
        raise HTTPException(status_code=500, detail=result["error"])

    try:
        # The first label in 'labels' is the highest score
        prediction = result['labels'][0]
        return {"severity": prediction}
    except KeyError:
        # This is where your 'labels' error was happening
        print(f"Critical Failure: Response format unexpected: {result}")
        raise HTTPException(status_code=500, detail="Unexpected AI response format")