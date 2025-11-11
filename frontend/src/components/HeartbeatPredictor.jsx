import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://your-production-domain.com" // Change for production
  : "http://localhost:5016";

const HeartbeatPredictor = () => {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPrediction(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await axios.post(`${API_BASE_URL}/predict`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: false   // explicitly disable
          });
          
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Heartbeat Classification</h1>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {loading ? "Processing..." : "Upload & Predict"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {prediction && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <p className="text-lg">
            <strong>Prediction:</strong> {prediction.prediction}
          </p>
          <p>
            <strong>Probability:</strong> {prediction.probability.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
};

export default HeartbeatPredictor;
