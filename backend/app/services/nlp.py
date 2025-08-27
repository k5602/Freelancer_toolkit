import spacy

# Load a pre-trained spaCy model
nlp = spacy.load("en_core_web_sm")

def analyze_sentiment(text: str) -> str:
    """
    Analyze the sentiment of a text.
    """
    doc = nlp(text)

    # TextBlob placeholder.
    if doc.sentiment > 0:
        return "positive"
    elif doc.sentiment < 0:
        return "negative"
    else:
        return "neutral"
