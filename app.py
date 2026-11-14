import os
import numpy as np
import pandas as pd
import torch
from torch import nn
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
from flask import Flask, request, jsonify, send_from_directory
from pathlib import Path

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=None)
url = 'https://raw.githubusercontent.com/dileep-lingamallu/Heart-Disease-Prediction-Dataset/main/heart.csv'
df = pd.read_csv(ROOT / 'heart.csv' if (ROOT / 'heart.csv').exists() else url)
X = df.drop(columns=['target'])
y = np.where(df.target == 0, 0, np.where((df.trestbps > 140) | (df.chol > 260), 2, 1))
features = ['age', 'sex', 'trestbps', 'chol']
# Preserve the original model architecture and matching method.
torch.manual_seed(42)
X_train, X_test, y_train, y_test = train_test_split(X.values, y, test_size=.2, random_state=42)
scaler = StandardScaler().fit(X_train)
matcher = NearestNeighbors(n_neighbors=1, algorithm='ball_tree').fit(df[features].values)
model = nn.Sequential(nn.Linear(X.shape[1],16), nn.ReLU(), nn.Linear(16,8), nn.ReLU(), nn.Linear(8,3))
optimizer = torch.optim.Adam(model.parameters(), lr=.01)
xt = torch.tensor(scaler.transform(X_train), dtype=torch.float32)
yt = torch.tensor(y_train, dtype=torch.long)
for epoch in range(1500):
    optimizer.zero_grad()
    loss = nn.functional.cross_entropy(model(xt), yt)
    loss.backward()
    optimizer.step()
model.eval()
print('PulseGuard demo model trained.', flush=True)

@app.get('/')
def home():
    return send_from_directory(ROOT, 'index.html')

@app.get('/<any(index.css,JS.js):filename>')
def assets(filename):
    return send_from_directory(ROOT, filename)

@app.post('/api/predict')
def predict():
    try:
        data = request.get_json() or {}
        values = [float(data[k]) for k in features]
        age, sex, bp, chol = values
        if not all(np.isfinite(values)) or not (18 <= age <= 120 and sex in (0,1) and 50 <= bp <= 300 and 50 <= chol <= 1000):
            raise ValueError()
    except (ValueError, TypeError, KeyError):
        return jsonify(error='Enter valid fictional adult demo values.'), 400
    _, indices = matcher.kneighbors([values])
    row = X.iloc[indices[0][0]].values
    with torch.inference_mode():
        scores = torch.softmax(model(torch.tensor(scaler.transform([row]), dtype=torch.float32)), dim=1)[0].tolist()
    category = int(np.argmax(scores))
    advice = 'This is a classification of a matched historical dataset record, not a personal health assessment. Discuss real readings with your care team.'
    source = 'Built-in explanation'
    if os.getenv('GEMINI_API_KEY'):
        try:
            from google import genai
            client = genai.Client(api_key=os.environ['AQ.Ab8RN6K4lVW-9ob5Uu3efVjdMpCc_TQUFIOG7ZtStlYECJ94MA'])
            response = client.models.generate_content(model='gemini-2.5-flash-lite', contents=f'Explain an educational hackathon demo using fictional inputs: age {age}, systolic BP {bp}, cholesterol {chol}. Model class {category}, softmax scores {scores}. The model classified a nearest historical record, not the person. Scores are not disease probabilities. Explain limitations and suggest discussing real readings with a clinician. No diagnosis, reassurance, triage, treatment or medication changes. Maximum three sentences.')
            if response.text:
                advice = response.text
                source = 'Gemini AI'
        except Exception:
            source = 'Built-in explanation (Gemini unavailable)'
    return jsonify(category=category, scores=[s*100 for s in scores], advice=advice, source=source)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
