import pandas as pd
import numpy as np
import re
import spacy
import joblib
import os

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE

# --- 1. CONFIGURATION ---
THRESHOLD = 0.3  # The "Magic Number" we found
print("Initializing NLP engine...")
nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])

if not os.path.exists('app'):
    os.makedirs('app')

# --- 2. TEXT CLEANING ---
def normalize_text(text):
    if not isinstance(text, str): return ""
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+|\S+@\S+', ' ', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if not token.is_stop and token.lemma_.strip()]
    return " ".join(tokens)

# --- 3. DATA LOADING ---
print("Loading datasets...")
try:
    mozilla = pd.read_csv("RawData/Mozilla.csv", delimiter=';')
    netbeans = pd.read_csv("RawData/Netbeans.csv", delimiter=';')
    openoffice = pd.read_csv("RawData/Openoffice.csv", delimiter=';')
    df = pd.concat([mozilla, netbeans, openoffice], ignore_index=True)
except FileNotFoundError:
    print("Error: CSV files not found in RawData folder.")
    exit()

# --- 4. MAPPING (3-Class System) ---
print("Mapping labels...")
df['bsr'] = df['bsr'].str.lower()
severity_map = {
    'blocker': 'High', 'critical': 'High', 's1': 'High', 'major': 'High', 's2': 'High',
    'normal': 'Normal', 's3': 'Normal',
    'minor': 'Low', 's4': 'Low', 'trivial': 'Low', 'enhancement': 'Low'
}
df['bsr'] = df['bsr'].map(severity_map)
df = df.dropna(subset=['bsr'])

# --- 5. PREPROCESSING ---
print("Normalizing text...")
df['text'] = df['sd'] + " " + df['dt']
df['text'] = df['text'].apply(normalize_text)

# --- 6. VECTORIZATION ---
print("Vectorizing...")
tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
X = tfidf.fit_transform(df["text"])
y = df['bsr']

# --- 7. SPLIT & SMOTE ---
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print("Applying SMOTE balancing...")
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

# --- 8. TRAINING ---
print("Training Logistic Regression...")
logreg = LogisticRegression(class_weight='balanced', max_iter=1000, n_jobs=-1)
logreg.fit(X_train_resampled, y_train_resampled)

# --- 9. CUSTOM EVALUATION (The 0.3 Logic) ---
print(f"Evaluating with Custom Threshold: {THRESHOLD}...")

# Get raw probabilities (e.g., [0.1, 0.6, 0.3])
probs = logreg.predict_proba(X_test)
high_index = list(logreg.classes_).index("High")

final_preds = []
for p in probs:
    # If "High" probability > 0.3, force it to be High
    if p[high_index] > THRESHOLD:
        final_preds.append("High")
    else:
        # Otherwise, pick the winner of the remaining classes
        p_copy = p.copy()
        p_copy[high_index] = -1 # Remove High from contention
        best_idx = np.argmax(p_copy)
        final_preds.append(logreg.classes_[best_idx])

# Print the final report
print("\n" + "="*50)
print(f"FINAL REPORT (High Threshold > {THRESHOLD})")
print("="*50)
print(classification_report(y_test, final_preds))

# --- 10. SAVE ---
print("Saving model to app/...")
joblib.dump(logreg, 'app/triage_model.joblib')
joblib.dump(tfidf, 'app/triage_vectorizer.joblib')
print("Model saved. Ready for API.")