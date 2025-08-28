# 23/CS/193

import streamlit as st
import joblib
import re
import spacy
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import spacy.cli

spacy.cli.download("en_core_web_sm")


# Download NLTK stuff only if not done
nltk.download('punkt')
nltk.download('stopwords')

# Load SpaCy and NLTK
nlp = spacy.load("en_core_web_sm")
stop_words = set(stopwords.words("english"))

# Load model and vectorizer
model_path = r'C:\Users\JHUGAN KARTIKEY\PROJECTS\ClassifyBug\models'
clf = joblib.load(model_path + r'\severity_model.joblib')
vectorizer = joblib.load(model_path + r'\tfidf_vectorizer.joblib')

# Clean & process text
def clean_and_process(text):
    text = str(text).lower()
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = word_tokenize(text)
    filtered = [word for word in tokens if word not in stop_words]
    doc = nlp(' '.join(filtered))
    lemmas = [token.lemma_ for token in doc if token.lemma_.isalpha()]
    return ' '.join(lemmas)

# Streamlit UI
st.title("🛠️ Bug Severity Predictor")

bug_text = st.text_area("Paste your bug report here:")

st.markdown("---")
st.subheader("📁 Upload a CSV File of Bug Reports")

uploaded_file = st.file_uploader("Upload CSV file with a 'bug_description' column", type="csv")

if uploaded_file is not None:
    import pandas as pd
    df = pd.read_csv(uploaded_file)

    if 'bug_description' not in df.columns:
        st.error("❌ CSV must contain a 'bug_description' column.")
    else:
        df['cleaned'] = df['bug_description'].apply(clean_and_process)
        vecs = vectorizer.transform(df['cleaned'])
        df['Predicted Severity'] = clf.predict(vecs)

        st.success("✅ Predictions complete!")
        st.write(df[['bug_description', 'Predicted Severity']])


if st.button("Predict Severity"):
    if bug_text.strip() == "":
        st.warning("Please enter some bug text.")
    else:
        cleaned = clean_and_process(bug_text)
        input_vector = vectorizer.transform([cleaned])
        prediction = clf.predict(input_vector)[0]
        st.success(f"🔮 Predicted Severity: **{prediction.upper()}**")
        
# test comment 