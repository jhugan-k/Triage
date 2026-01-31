import pandas as pd
import numpy as np
import joblib
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.utils import resample

# 1. LOAD OLD DATA
print("Loading and balancing original data...")
mozilla = pd.read_csv("RawData/Mozilla.csv", delimiter=';')
df_old = mozilla.copy()

# Map and clean
severity_map = {'blocker': 'High', 'critical': 'High', 'major': 'High', 'normal': 'Normal', 'minor': 'Low', 'trivial': 'Low'}
df_old['bsr'] = df_old['bsr'].str.lower().map(severity_map)
df_old = df_old.dropna(subset=['bsr'])
df_old['text'] = df_old['sd'].fillna('') + " " + df_old['dt'].fillna('')

# Downsample 'Normal' to match 'High' count
min_size = df_old['bsr'].value_counts().min()
df_h = df_old[df_old['bsr'] == 'High']
df_n = resample(df_old[df_old['bsr'] == 'Normal'], n_samples=min_size, random_state=42)
df_l = resample(df_old[df_old['bsr'] == 'Low'], n_samples=min_size, random_state=42)
df_old_bal = pd.concat([df_h, df_n, df_l])[['text', 'bsr']]

# 2. MERGE WITH MODERN
df_modern = pd.read_csv("RawData/ModernBugs.csv")
df_modern.columns = ['text', 'bsr']
df_final = pd.concat([df_old_bal, df_modern], ignore_index=True)

# 3. SPLIT (Crucial to detect overfitting)
X_train_text, X_test_text, y_train, y_test = train_test_split(
    df_final['text'], df_final['bsr'], test_size=0.2, stratify=df_final['bsr'], random_state=42
)

# 4. ENCODE
print("Encoding Semantic Vectors (this is the smart part)...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')
X_train = embedder.encode(X_train_text.tolist(), show_progress_bar=True)
X_test = embedder.encode(X_test_text.tolist(), show_progress_bar=True)

# 5. TRAIN
print("Training Semantic Classifier...")
model = LogisticRegression(max_iter=1000, C=1.2, class_weight='balanced')
model.fit(X_train, y_train)

# 6. EVALUATE ON UNSEEN DATA
y_pred = model.predict(X_test)
print("\n--- PERFORMANCE ON SECRET TEST SET (UNSEEN DATA) ---")
print(classification_report(y_test, y_pred))

# 7. SAVE
joblib.dump(model, "app/model_v2.joblib")
print("Saved: app/model_v2.joblib")