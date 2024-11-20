from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
from langdetect import detect

app = Flask(__name__)

# Load models
hindi_model_name = "Hate-speech-CNERG/hindi-abusive-MuRIL"
hindi_tokenizer = AutoTokenizer.from_pretrained(hindi_model_name)
hindi_model = AutoModelForSequenceClassification.from_pretrained(hindi_model_name)
toxicity_model = pipeline("text-classification", model="unitary/toxic-bert")

def check_hindi_toxicity(text, threshold=0.5):
    inputs = hindi_tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    outputs = hindi_model(**inputs)
    probabilities = torch.softmax(outputs.logits, dim=1)
    abusive_prob = probabilities[0, 1].item()
    return abusive_prob >= threshold, abusive_prob

def check_english_toxicity(text, threshold=0.95):
    result = toxicity_model(text)[0]
    return result['label'] == 'toxic' and result['score'] >= threshold, result['score']

@app.route('/check-toxicity', methods=['POST'])
def analyze_message():
    data = request.json
    message = data.get('message', '')
    
    try:
        language = detect(message)
    except:
        return jsonify({'allowed': True, 'reason': 'Undetected language'})
    
    if language == "hi":
        is_toxic, score = check_hindi_toxicity(message)
        return jsonify({'allowed': not is_toxic, 'language': 'hi', 'score': score})
    elif language == "en":
        is_toxic, score = check_english_toxicity(message)
        return jsonify({'allowed': not is_toxic, 'language': 'en', 'score': score})
    else:
        return jsonify({'allowed': True, 'reason': 'Unsupported language'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
