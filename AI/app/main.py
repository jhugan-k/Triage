from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from sentence_transformers import SentenceTransformer

app = FastAPI()

# Configuration
THRESHOLD = 0.35 # Slightly higher threshold for semantic precision

print("Waking up Semantic Brain...")
# Load the transformer (this is our new 'vectorizer')
encoder = SentenceTransformer('all-MiniLM-L6-v2')
# Load the fine-tuned classifier
model = joblib.load("app/model_v2.joblib")
classes = list(model.classes_)

class BugPayload(BaseModel):
    title: str
    description: str

@app.post("/classify")
def classify_bug(payload: BugPayload):
    full_text = f"{payload.title} {payload.description}"
    
    # Transform text to meaning vector
    vector = encoder.encode([full_text])
    
    # Get prediction probabilities
    probs = model.predict_proba(vector)[0]
    classes = list(model.classes_)
    high_idx = classes.index("High")
    
    high_prob = probs[high_idx]

    # --- THE FIX ---
    # 1. Increase Threshold to 0.7 (Only flag High if 70% sure)
    # Since your model is 97% accurate, it should be very sure.
    NEW_THRESHOLD = 0.7 
    
    if high_prob > NEW_THRESHOLD:
        severity = "High"
    else:
        # If not High, we pick the mathematical winner between Normal and Low
        severity = classes[np.argmax(probs)]
    
    # Print to your Python terminal so you can see the math
    print(f"--- AI ANALYSIS ---")
    print(f"Text: {payload.title}")
    for i, label in enumerate(classes):
        print(f"{label}: {probs[i]:.2f}")
    print(f"RESULT: {severity}")
    print(f"-------------------")

    return {
        "severity": severity,
        "confidence": float(high_prob),
        "all_probs": {classes[i]: float(probs[i]) for i in range(len(classes))}
    }

@app.get("/")
def health():
    return {"status": "Semantic Engine v2.0 Operational"}