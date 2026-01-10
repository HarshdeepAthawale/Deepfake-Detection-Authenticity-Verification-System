# ML Service - Deepfake Detection API

Python Flask/FastAPI service for deepfake detection using ML models (TensorFlow/Keras).

## Overview

This ML service provides inference endpoints for the deepfake detection system. It integrates with TensorFlow/Keras models trained on the FaceForensics++ dataset.

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-cors tensorflow numpy pillow opencv-python requests

# Or install from requirements.txt (if created)
pip install -r requirements.txt
```

## Running the Service

```bash
# Set environment variables (optional)
export PORT=5000
export MODEL_PATH=./models
export ML_MODEL_VERSION=v1

# Run the service
python app.py
```

The service will start on `http://localhost:5000` by default.

## Endpoints

### Health Check
```
GET /health
```

Returns service health status.

### Inference
```
POST /api/v1/inference
Content-Type: application/json

{
  "hash": "sha256:...",
  "mediaType": "VIDEO|AUDIO|IMAGE",
  "metadata": {...},
  "extractedFrames": [...],
  "extractedAudio": "...",
  "modelVersion": "v1"
}
```

Returns detection scores:
```json
{
  "video_score": 0-100,
  "audio_score": 0-100,
  "gan_fingerprint": 0-100,
  "temporal_consistency": 0-100,
  "risk_score": 0-100,
  "confidence": 0-100,
  "model_version": "v1",
  "inference_time": 1234
}
```

## Integration with Backend

The Node.js backend will call this service when:
1. ML service is enabled (`ML_SERVICE_ENABLED=true`)
2. ML service health check passes
3. A scan is being processed through the detection agent

If the ML service is unavailable, the backend falls back to mock/deterministic detection logic.

## Environment Variables

- `PORT`: Service port (default: 5000)
- `MODEL_PATH`: Path to ML model files
- `ML_MODEL_VERSION`: Model version identifier
- `FLASK_ENV`: Flask environment (development/production)

## Model Integration

In production, replace the mock inference logic in `app.py` with:
1. Model loading (ResNet50/EfficientNet)
2. Frame preprocessing
3. Audio feature extraction
4. Model inference
5. Score calculation

## Status

Currently implemented as a skeleton with mock responses. Ready for ML model integration.
