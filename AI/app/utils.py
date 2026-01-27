import re
import spacy

nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])

def normalize_text(text):
    if not isinstance(text, str): return ""
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+|\S+@\S+', ' ', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if not token.is_stop and token.lemma_.strip()]
    return " ".join(tokens)