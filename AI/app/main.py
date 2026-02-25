from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# 1. CONFIGURATION
HF_TOKEN = os.getenv("HF_TOKEN")
# UPDATED ENDPOINT: Switching to the new Hugging Face Router domain
API_URL = "https://router.huggingface.co/models/facebook/bart-large-mnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify(payload: BugPayload):
    text = f"{payload.title}: {payload.description}"
    candidate_labels = ["High", "Normal", "Low"]

    # 2. CALL HUGGING FACE
    try:
        response = requests.post(
            API_URL, 
            headers=headers, 
            json={
                "inputs": text,
                "parameters": {"candidate_labels": candidate_labels}
            },
            timeout=20 # Adding a timeout for the internal HF call
        )
        
        result = response.json()
        
        # DEBUGGING: Print the actual response to Render logs
        print(f"[HF RAW RESPONSE]: {result}")

        # 3. HANDLE ERRORS FROM HUGGING FACE
        if isinstance(result, dict) and "error" in result:
            # Check if it's the model loading error
            if "currently loading" in str(result.get("error")):
                raise HTTPException(status_code=503, detail="Model is warming up")
            raise HTTPException(status_code=500, detail=result["error"])

        # 4. PARSE THE RESULT
        # The new router API usually returns a dict for zero-shot: {'labels': [...], 'scores': [...]}
        prediction = result['labels'][0]
        return {"severity": prediction}

    except requests.exceptions.Timeout:
        print("HF API Timeout")
        raise HTTPException(status_code=504, detail="Hugging Face timed out")
    except (KeyError, TypeError, IndexError) as e:
        print(f"Parsing Error: {e} | Full Result: {result}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        print(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))