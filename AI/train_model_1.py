import pandas as pd
import re
import spacy
import numpy as np
import joblib
import os

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

from imblearn.over_sampling import SMOTE
from collections import Counter


# --------------------------------------------------
# Load spaCy (tokenizer + lemmatizer only)
# --------------------------------------------------
nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])


# --------------------------------------------------
# Load datasets
# --------------------------------------------------
mozilla_data = pd.read_csv("RawData/Mozilla.csv", delimiter=';')
netbeans_data = pd.read_csv("RawData/Netbeans.csv", delimiter=';')
openoffice_data = pd.read_csv("RawData/Openoffice.csv", delimiter=';')


# --------------------------------------------------
# Text normalization
# --------------------------------------------------
def normalize_text(text):
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+|\S+@\S+', ' ', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    doc = nlp(text)
    tokens = [
        token.lemma_
        for token in doc
        if not token.is_stop and token.lemma_.strip()
    ]

    return " ".join(tokens)


# --------------------------------------------------
# Combine datasets
# --------------------------------------------------
df = pd.concat(
    [mozilla_data, netbeans_data, openoffice_data],
    ignore_index=True
)


# --------------------------------------------------
# 🔥 Remap to 3 classes (High / Normal / Low)
# --------------------------------------------------
df['bsr'] = df['bsr'].str.lower()

severity_map = {
    # 🔴 Drop Everything
    'blocker': 'High',
    'critical': 'High',
    's1': 'High',
    'major': 'High',
    's2': 'High',

    # 🟡 Normal Sprint Work
    'normal': 'Normal',
    's3': 'Normal',

    # 🟢 Backlog
    'minor': 'Low',
    's4': 'Low',
    'trivial': 'Low',
    'enhancement': 'Low'
}

df['bsr'] = df['bsr'].map(severity_map)
df = df.dropna(subset=['bsr']).reset_index(drop=True)

print("Class Distribution (Original):")
print(df['bsr'].value_counts(), "\n")


# --------------------------------------------------
# Normalize text fields
# --------------------------------------------------
df["sd"] = df["sd"].fillna("")
df["dt"] = df["dt"].fillna("")

df["sd_norm"] = df["sd"].apply(normalize_text)
df["dt_norm"] = df["dt"].apply(normalize_text)
df["text"] = (df["sd_norm"] + " " + df["dt_norm"]).str.strip()


# --------------------------------------------------
# Vectorize
# --------------------------------------------------
tfidf = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),
    sublinear_tf=True,
    min_df=2
)

X = tfidf.fit_transform(df["text"])
y = df["bsr"]


# --------------------------------------------------
# Train / Test Split (Stratified)
# --------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training Distribution (Before SMOTE):")
print(Counter(y_train), "\n")


# --------------------------------------------------
# 🔥 Apply SMOTE to TRAINING DATA ONLY
# --------------------------------------------------
smote = SMOTE(random_state=42)

X_train_resampled, y_train_resampled = smote.fit_resample(
    X_train, y_train
)

print("Training Distribution (After SMOTE):")
print(Counter(y_train_resampled), "\n")


# --------------------------------------------------
# Train Logistic Regression
# --------------------------------------------------
logreg = LogisticRegression(
    C=1.0,
    max_iter=1000,
    n_jobs=-1
)

print("Training Logistic Regression...")
logreg.fit(X_train_resampled, y_train_resampled)


# --------------------------------------------------
# 🔥 FIXED THRESHOLD PREDICTION (threshold = 0.3)
# --------------------------------------------------
THRESHOLD = 0.3

# Probabilities
y_proba = logreg.predict_proba(X_test)

# Identify index of "High"
high_index = list(logreg.classes_).index("High")
print(f"'High' class index: {high_index}")
print("Class order:", logreg.classes_)


def predict_with_threshold(probabilities, threshold=0.3):
    predictions = []
    for probs in probabilities:
        if probs[high_index] > threshold:
            predictions.append("High")
        else:
            probs_copy = probs.copy()
            probs_copy[high_index] = -1
            max_index = np.argmax(probs_copy)
            predictions.append(logreg.classes_[max_index])
    return predictions


# Final predictions
y_pred = predict_with_threshold(y_proba, THRESHOLD)


# --------------------------------------------------
# Evaluation
# --------------------------------------------------
print("\nFINAL RESULTS (Threshold = 0.3)\n")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))


# --------------------------------------------------
# Diagnostics
# --------------------------------------------------
print("Vocabulary size:", len(tfidf.vocabulary_))
print("TF-IDF matrix shape:", X.shape)

SAVE_DIR = os.path.join("Triage", "AI")

os.makedirs(SAVE_DIR, exist_ok=True)

MODEL_PATH = os.path.join(SAVE_DIR, "triage_logreg_model.joblib")
VECTORIZER_PATH = os.path.join(SAVE_DIR, "triage_tfidf_vectorizer.joblib")
META_PATH = os.path.join(SAVE_DIR, "triage_metadata.joblib")

# Save model
joblib.dump(logreg, MODEL_PATH)

# Save vectorizer
joblib.dump(tfidf, VECTORIZER_PATH)

# Save metadata (threshold + class order)
metadata = {
    "threshold": 0.3,
    "classes": list(logreg.classes_),
    "high_class_index": list(logreg.classes_).index("High")
}

joblib.dump(metadata, META_PATH)

print("\nModel artifacts saved successfully:")
print(MODEL_PATH)
print(VECTORIZER_PATH)
print(META_PATH)


