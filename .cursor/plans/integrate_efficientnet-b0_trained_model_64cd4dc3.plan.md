---
name: Integrate EfficientNet-B0 Trained Model
overview: Integrate the trained EfficientNet-B0 deepfake detection model into the ML service, replacing mock inference with real model inference. This includes loading the PyTorch model, implementing preprocessing, handling frame processing for videos/images, and calculating detection scores.
todos:
  - id: "1"
    content: Create model_loader.py module to load EfficientNet-B0 model from efficientnet_b0_ffpp_c23 directory
    status: completed
  - id: "2"
    content: Create preprocessing.py module for image preprocessing (resize to 224x224, normalize, tensor conversion)
    status: completed
  - id: "3"
    content: Update app.py to replace mock inference with real model inference using loaded model
    status: completed
  - id: "4"
    content: Create/update requirements.txt with PyTorch, torchvision, and Pillow dependencies
    status: completed
  - id: "5"
    content: Implement frame processing logic for videos (read frames, batch process, aggregate results)
    status: completed
  - id: "6"
    content: Calculate detection scores from model predictions (video_score, gan_fingerprint, risk_score, confidence)
    status: completed
  - id: "7"
    content: Add error handling and fallback mechanisms for model loading and inference failures
    status: completed
  - id: "8"
    content: Update ml-service/README.md with new installation and usage instructions
    status: completed
isProject: false
---

# Plan: Integrate EfficientNet-B0 Trained Model

## Overview

The trained EfficientNet-B0 model (`efficientnet_b0_ffpp_c23/`) needs to be integrated into the ML service to replace mock inference with real deepfake detection. The model classifies images/frames as Real (0) or Fake (1).

## Current State

- Model directory exists: `efficientnet_b0_ffpp_c23/` (contains pickled PyTorch model)
- ML service (`ml-service/app.py`) currently returns mock responses
- Backend extracts frames from videos and passes file paths to ML service
- Git LFS configured via `gitattributes` for large model files

## Implementation Tasks

### 1. Create Model Loader Module

**File**: `ml-service/model_loader.py`

- Load the PyTorch model from `efficientnet_b0_ffpp_c23/` directory
- Rebuild EfficientNet-B0 architecture with 2-class output layer
- Load state dict from the pickled model file
- Implement model initialization and caching (load once, reuse)
- Handle device selection (CPU/GPU) based on availability
- Add error handling for model loading failures

### 2. Create Preprocessing Module

**File**: `ml-service/preprocessing.py`

- Implement image preprocessing pipeline:
  - Resize to 224x224 (as per model requirements)
  - Convert to RGB if needed
  - Normalize using ImageNet statistics
  - Convert to tensor format
- Handle both single images and batch processing
- Support PIL Image and file path inputs

### 3. Update ML Service with Real Inference

**File**: `ml-service/app.py`

- Import model loader and preprocessing modules
- Load model on service startup (lazy loading with caching)
- Replace mock inference logic with real model inference:
  - For IMAGE: Process single image
  - For VIDEO: Process multiple frames, aggregate results
  - For AUDIO: Keep mock logic (model is image-based)
- Calculate scores from model predictions:
  - `video_score`: Probability of fake (0-100)
  - `gan_fingerprint`: Same as video_score (model detects GAN artifacts)
  - `temporal_consistency`: For videos, calculate consistency across frames
  - `risk_score`: Weighted combination of scores
  - `confidence`: Based on prediction probability
- Handle frame file paths from `extractedFrames` array
- Add proper error handling and logging

### 4. Update Dependencies

**File**: `ml-service/requirements.txt` (create if doesn't exist)

- Add PyTorch: `torch>=2.0.0`
- Add torchvision: `torchvision>=0.15.0`
- Add Pillow: `Pillow>=10.0.0`
- Keep existing: `flask`, `flask-cors`, `numpy`, `opencv-python`

### 5. Update Docker Configuration (Optional)

**File**: `docker-compose.yml`

- Add ML service container if not present
- Mount model directory as volume
- Set environment variables for model path
- Configure health checks

### 6. Update Documentation

**File**: `ml-service/README.md`

- Update installation instructions with PyTorch dependencies
- Document model loading process
- Add inference details and score calculation
- Update environment variables section

### 7. Handle Model File Paths

- Ensure model directory is accessible from ML service
- Update model path configuration (use environment variable)
- Handle both relative and absolute paths
- Add validation for model file existence

### 8. Frame Processing Logic

- Read frame images from file paths provided by backend
- Process frames in batches for efficiency
- For videos: Sample frames intelligently (not all frames needed)
- Aggregate frame-level predictions to video-level scores
- Calculate temporal consistency metric from frame predictions

### 9. Error Handling & Fallbacks

- Graceful degradation if model fails to load
- Fallback to mock inference if model inference fails
- Log errors with context for debugging
- Return appropriate error responses

### 10. Performance Optimization

- Load model once at startup (singleton pattern)
- Use batch processing for multiple frames
- Implement caching for repeated requests
- Consider GPU acceleration if available

## Key Implementation Details

### Model Loading

Based on README, the model needs to be loaded as:

```python
import torch
from torchvision import models
import torch.nn as nn

model = models.efficientnet_b0(weights=None)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, 2)
# Load state dict from efficientnet_b0_ffpp_c23 directory
```

### Score Calculation

- Model outputs logits for 2 classes [Real, Fake]
- Apply softmax to get probabilities
- `video_score` = probability of Fake class * 100
- `risk_score` = weighted combination of video_score and other metrics
- `confidence` = max(probabilities) * 100

### Frame Aggregation (Videos)

- Process multiple frames from `extractedFrames` array
- Average frame-level predictions for video-level score
- Calculate temporal consistency as variance of predictions

## Files to Modify/Create

1. **Create**: `ml-service/model_loader.py` - Model loading logic
2. **Create**: `ml-service/preprocessing.py` - Image preprocessing
3. **Modify**: `ml-service/app.py` - Replace mock with real inference
4. **Create/Update**: `ml-service/requirements.txt` - Add PyTorch dependencies
5. **Update**: `ml-service/README.md` - Update documentation
6. **Optional**: `docker-compose.yml` - Add ML service container

## Testing Considerations

- Test with single images
- Test with video frames
- Test error handling (missing model, invalid images)
- Verify score ranges (0-100)
- Test performance with multiple frames