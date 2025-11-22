from flask import Flask, request, jsonify
import joblib
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow React frontend to call API

# Load model and scaler
model = joblib.load('newwwwframingham_xgboost_gpu_model.pkl')
scaler = joblib.load('newwwwframingham_scaler.pkl')

# Endpoint for prediction
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # receive JSON data
    df = pd.DataFrame([data])
    
    # Scale input
    df_scaled = scaler.transform(df)
    
    # Predict probability
    risk_prob = model.predict_proba(df_scaled)[0, 1]
    
    # Risk level categorization
    if risk_prob < 0.10:
        risk_level = "Low"
    elif risk_prob < 0.20:
        risk_level = "Moderate"
    else:
        risk_level = "High"
    
    return jsonify({
        "risk_probability": float(risk_prob),
        "risk_level": risk_level
    })

if __name__ == "__main__":
    app.run(debug=True)
