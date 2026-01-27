from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from app.utils import normalize_text

app = FastAPI()

# --- Config ---
THRESHOLD = 0.3  # The magic number you found

print("Loading model...")
model = joblib.load("app/triage_model.joblib")
vectorizer = joblib.load("app/triage_vectorizer.joblib")

# Find where "High" is located in the model's brain (usually index 0, 1, or 2)
# We do this dynamically to be safe.
classes = list(model.classes_)
HIGH_INDEX = classes.index("High")
print(f"Model loaded. 'High' severity is at index {HIGH_INDEX}")

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify_bug(payload: BugPayload):
    # 1. Clean
    full_text = f"{payload.title} {payload.description}"
    clean_text = normalize_text(full_text)
    
    # 2. Vectorize
    features = vectorizer.transform([clean_text])
    
    # 3. Get Probabilities (e.g., [0.10, 0.45, 0.45])
    # output is a list of lists, we take the first one [0]
    probs = model.predict_proba(features)[0]
    
    # 4. Apply Custom Logic
    high_prob = probs[HIGH_INDEX]
    
    if high_prob > THRESHOLD:
        prediction = "High"
    else:
        # If it's not High, let the model decide between Normal/Low normally
        # We temporarily silence the High score so it doesn't interfere
        probs[HIGH_INDEX] = -1 
        best_remaining_index = np.argmax(probs)
        prediction = classes[best_remaining_index]
    
    return {
        "severity": prediction,
        "confidence_score": float(high_prob), # Useful for debugging
        "is_urgent": prediction == "High"
    }

@app.get("/")
def health_check():
    return {"status": "online"}