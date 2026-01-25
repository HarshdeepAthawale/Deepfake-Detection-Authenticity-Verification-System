# ML Service - Deepfake Detection API

Python Flask service for deepfake detection using EfficientNet-B0 PyTorch model.

## Overview

This ML service provides inference endpoints for the deepfake detection system. It integrates with a trained **EfficientNet-B0** model fine-tuned on the **FaceForensics++ (FF++) C23** dataset. The model classifies images and video frames as Real (0) or Fake (1).

## Model Details

- **Architecture**: EfficientNet-B0 (ImageNet pretrained)
- **Output**: 2 classes (Real=0, Fake=1)
- **Input Size**: 224×224 RGB images
- **Training Dataset**: FaceForensics++ C23
- **Performance**: 
  - Frame-Level AUC: 0.933
  - Frame-Level Accuracy: 0.852
  - Frame-Level F1-Score: 0.843

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Dependencies

- **PyTorch** (>=2.0.0) - Deep learning framework
- **torchvision** (>=0.15.0) - Computer vision utilities
- **Flask** (>=2.3.0) - Web framework
- **Pillow** (>=10.0.0) - Image processing
- **NumPy** (>=1.24.0) - Numerical computing
- **OpenCV** (>=4.8.0) - Media processing (optional)

## Running the Service

```bash
# Set environment variables (optional)
export PORT=5000
export MODEL_PATH=../efficientnet_b0_ffpp_c23  # Path to model directory

# Run the service
python app.py
```

The service will start on `http://localhost:5000` by default.

### Model Loading

The service automatically loads the model on startup from:
1. Path specified in `MODEL_PATH` environment variable
2. Default path: `../efficientnet_b0_ffpp_c23` (relative to ml-service directory)

The model file should be one of:
- `efficientnet_b0_ffpp_c23.pth` (preferred)
- Any `.pth` or `.pt` file in the model directory
- `data.pkl` (pickled format)

If model loading fails, the service falls back to mock inference mode.

## Endpoints

### Health Check

```
GET /health
```

Returns service health status and model loading state:

```json
{
  "status": "healthy",
  "service": "deepfake-detection-ml-service",
  "version": "1.0.0",
  "model_status": "loaded",
  "using_fallback": false,
  "timestamp": "2026-01-26T12:00:00"
}
```

### Inference

```
POST /api/v1/inference
Content-Type: application/json
```

**Request Body:**
```json
{
  "hash": "sha256:...",
  "mediaType": "VIDEO|AUDIO|IMAGE",
  "metadata": {...},
  "extractedFrames": ["/path/to/frame1.jpg", "/path/to/frame2.jpg"],
  "extractedAudio": "/path/to/audio.wav",
  "modelVersion": "v1"
}
```

**Response:**
```json
{
  "video_score": 75.5,
  "audio_score": 0.0,
  "gan_fingerprint": 75.5,
  "temporal_consistency": 85.2,
  "risk_score": 68.3,
  "confidence": 92.1,
  "model_version": "v1",
  "inference_time": 1234
}
```

#### Score Descriptions

- **video_score** (0-100): Probability that the media is fake, based on visual analysis
- **audio_score** (0-100): Audio analysis score (0 for image-based model)
- **gan_fingerprint** (0-100): GAN artifact detection score (same as video_score)
- **temporal_consistency** (0-100): Frame-to-frame consistency for videos (higher = more consistent)
- **risk_score** (0-100): Overall risk assessment (weighted combination)
- **confidence** (0-100): Model confidence in the prediction

## Model Inference Process

1. **Image Processing**: 
   - Single image: Preprocessed and analyzed directly
   - Video: Multiple frames extracted and processed in batches (max 30 frames)

2. **Preprocessing**:
   - Resize to 224×224
   - Convert to RGB
   - Normalize using ImageNet statistics
   - Convert to tensor format

3. **Inference**:
   - Model outputs logits for 2 classes [Real, Fake]
   - Softmax applied to get probabilities
   - Scores calculated from probabilities

4. **Score Calculation**:
   - Frame-level predictions aggregated for videos
   - Temporal consistency calculated from frame variance
   - Risk score computed as weighted combination

## Integration with Backend

The Node.js backend calls this service when:
1. ML service is enabled (`ML_SERVICE_ENABLED=true`)
2. ML service health check passes
3. A scan is being processed through the detection agent

If the ML service is unavailable or model fails to load, the service gracefully falls back to mock inference mode.

## Environment Variables

- `PORT`: Service port (default: 5000)
- `MODEL_PATH`: Path to model directory (default: `../efficientnet_b0_ffpp_c23`)
- `FLASK_ENV`: Flask environment (development/production)

## Error Handling

The service includes comprehensive error handling:

- **Model Loading Failures**: Falls back to mock inference
- **Image Processing Errors**: Falls back to mock inference for that request
- **Invalid Inputs**: Returns appropriate error responses
- **Service Errors**: Returns 500 with error details

All errors are logged with full context for debugging.

## Performance Considerations

- Model is loaded once at startup (singleton pattern)
- Batch processing for multiple frames
- GPU acceleration if CUDA is available
- Frame sampling for videos (max 30 frames per video)
- Efficient tensor operations using PyTorch

## Development

### Testing

Test the service with:

```bash
# Health check
curl http://localhost:5000/health

# Inference (example)
curl -X POST http://localhost:5000/api/v1/inference \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "sha256:test123",
    "mediaType": "IMAGE",
    "extractedFrames": ["/path/to/image.jpg"],
    "modelVersion": "v1"
  }'
```

## Status

✅ **Fully implemented** with EfficientNet-B0 model integration. The service uses real model inference for images and videos, with graceful fallback to mock inference if needed.
