import pandas as pd
import re
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
nlp = spacy.load("en_core_web_sm", disable = ["parser", "ner"])


#load all data into df
mozilla_data = pd.read_csv("RawData/Mozilla.csv", delimiter = ';')
netbeans_data = pd.read_csv("RawData/Netbeans.csv", delimiter = ';')
openoffice_data = pd.read_csv("RawData/Openoffice.csv", delimiter = ';')

#data normalisation function
def normalize_text(text) : 
    if not isinstance(text,str):
        return ""
    

    #remoe spaces, numbers, special characters etc.
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+|\S+@\S+', ' ', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if not token.is_stop and token.lemma_.strip()]

    return " ".join(tokens)


#join all datasets and apply normalisation on small description (sd) and detailed description (dt) columns

df = pd.concat([mozilla_data, netbeans_data, openoffice_data], ignore_index=True)
df["sd_norm"] = df["sd"].apply(normalize_text)
df["dt_norm"] = df["dt"].apply(normalize_text)
df["text"] = df["sd_norm"] + " " + df["dt_norm"]


#TF-IDF
tfidf = TfidfVectorizer()
X = tfidf.fit_transform(df["text"])

print(df["text"].head())


# Vocab size : 11001
# Matrix shape : (13023, 11001)

print("Vocabulary size:", len(tfidf.vocabulary_))
print("TF-IDF matrix shape:", X.shape)









