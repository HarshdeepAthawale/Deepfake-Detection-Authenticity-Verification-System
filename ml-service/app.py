"""
ML Service - Flask API for Deepfake Detection
Python service for ML model inference using EfficientNet-B0

This service:
1. Loads trained EfficientNet-B0 model
2. Preprocesses media files (frames, images)
3. Runs inference on models
4. Returns detection scores

Installation:
    pip install -r requirements.txt

Run:
    python app.py
"""

import os
import time
import numpy as np
import torch
import torch.nn.functional as F
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

# Import our modules
from model_loader import get_model, is_model_loaded, get_device
from preprocessing import preprocess_image, preprocess_frames

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model instance (loaded on startup)
_model = None
_model_loaded = False


def load_model_on_startup():
    """Load model when service starts"""
    global _model, _model_loaded
    
    try:
        model_path = os.environ.get('MODEL_PATH', None)
        logger.info('[ML_SERVICE] Loading model on startup...')
        _model = get_model(model_path)
        _model_loaded = True
        logger.info('[ML_SERVICE] Model loaded successfully')
    except Exception as e:
        logger.error(f'[ML_SERVICE] Failed to load model: {str(e)}', exc_info=True)
        # No fallback - service is unhealthy if model fails to load
        _model_loaded = False
        # Do not raise here to allow service to start and report unhealthy status






def run_model_inference(model, images_tensor, device):
    """
    Run inference on preprocessed images
    
    Args:
        model: Loaded PyTorch model
        images_tensor: Preprocessed image tensor [batch_size, 3, 224, 224]
        device: Device to run inference on
    
    Returns:
        List of predictions (probabilities for each class)
    """
    try:
        # Move tensor to device
        images_tensor = images_tensor.to(device)
        
        # Run inference
        with torch.no_grad():
            logits = model(images_tensor)
            # Apply softmax to get probabilities
            probabilities = F.softmax(logits, dim=1)
        
        return probabilities.cpu().numpy()
        
    except Exception as e:
        logger.error(f'[ML_SERVICE] Model inference error: {str(e)}', exc_info=True)
        raise


def calculate_scores(predictions, media_type, frame_count=1):
    """
    Calculate detection scores from model predictions
    
    Args:
        predictions: Array of predictions [batch_size, 2] where [Real_prob, Fake_prob]
        media_type: Type of media (VIDEO, IMAGE, AUDIO)
        frame_count: Number of frames processed
    
    Returns:
        Dictionary of calculated scores
    """
    try:
        # Extract fake probabilities (class 1)
        fake_probs = predictions[:, 1]  # Shape: [batch_size]
        
        # DEBUG: Log actual predictions
        logger.info(f'[ML_SERVICE] Raw predictions shape: {predictions.shape}')
        logger.info(f'[ML_SERVICE] Sample predictions (first 3): {predictions[:min(3, len(predictions))]}')
        logger.info(f'[ML_SERVICE] Fake probabilities: {fake_probs}')
        
        # Calculate video score (probability of fake, scaled to 0-100)
        video_score = float(np.mean(fake_probs) * 100)
        
        # GAN fingerprint is same as video score (model detects GAN artifacts)
        gan_fingerprint = video_score
        
        # Calculate temporal consistency for videos (lower variance = more consistent)
        if media_type == 'VIDEO' and len(fake_probs) > 1:
            variance = float(np.var(fake_probs))
            # Convert variance to consistency score (0-100)
            # Lower variance = higher consistency
            temporal_consistency = max(0, min(100, 100 - (variance * 1000)))
        else:
            temporal_consistency = 100.0  # Single frame/image is always consistent
        
        # Audio score: 0 for image-based model (would need separate audio model)
        audio_score = 0.0 if media_type != 'AUDIO' else video_score
        
        # Calculate confidence (max probability across all predictions)
        max_probs = np.max(predictions, axis=1)
        confidence = float(np.mean(max_probs) * 100)
        
        # Calculate risk score (weighted combination)
        # Video score is primary indicator
        risk_score = video_score * 0.5 + gan_fingerprint * 0.3 + (100 - temporal_consistency) * 0.2
        risk_score = min(100, max(0, risk_score))
        
        logger.info(f'[ML_SERVICE] Calculated scores: video={video_score}, risk={risk_score}, confidence={confidence}')
        
        return {
            'video_score': round(video_score, 2),
            'audio_score': round(audio_score, 2),
            'gan_fingerprint': round(gan_fingerprint, 2),
            'temporal_consistency': round(temporal_consistency, 2),
            'risk_score': round(risk_score, 2),
            'confidence': round(confidence, 2)
        }
        
    except Exception as e:
        logger.error(f'[ML_SERVICE] Score calculation error: {str(e)}', exc_info=True)
        raise



@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    model_status = 'loaded' if _model_loaded else 'not_loaded'
    return jsonify({
        'status': 'healthy' if _model_loaded else 'unhealthy',
        'service': 'deepfake-detection-ml-service',
        'version': '1.0.0',
        'model_status': model_status,
        'using_fallback': False,
        'timestamp': datetime.utcnow().isoformat()
    }), 200 if _model_loaded else 503


@app.route('/api/v1/inference', methods=['POST'])
def inference():
    """
    Deepfake detection inference endpoint
    """
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Invalid request',
                'message': 'Request body must be JSON'
            }), 400
            
        if not _model_loaded:
            return jsonify({
                'error': 'Service Unavailable',
                'message': 'Model is not loaded'
            }), 503
        
        hash_value = data.get('hash', '')
        media_type = data.get('mediaType', 'UNKNOWN')
        model_version = data.get('modelVersion', 'v1')
        extracted_frames = data.get('extractedFrames', [])
        extracted_audio = data.get('extractedAudio', None)
        
        logger.info(f'[ML_SERVICE] Inference request: hash={hash_value[:16]}..., type={media_type}, model={model_version}')
        
        # Get device
        device = get_device()
        
        # Process based on media type
        if media_type == 'IMAGE':
            # Single image processing
            if not extracted_frames:
                raise ValueError('No frame paths provided for IMAGE')
            
            # Process first frame as image
            image_path = extracted_frames[0] if isinstance(extracted_frames, list) else extracted_frames
            image_tensor = preprocess_image(image_path)
            predictions = run_model_inference(_model, image_tensor, device)
            scores = calculate_scores(predictions, media_type, frame_count=1)
        
        elif media_type == 'VIDEO':
            # Video frame processing
            if not extracted_frames:
                raise ValueError('No frame paths provided for VIDEO')
            
            # Process frames (limit to max 30 frames for performance)
            max_frames = 30
            frames_tensor, valid_frames = preprocess_frames(extracted_frames, max_frames=max_frames)
            
            if frames_tensor is None or len(valid_frames) == 0:
                raise ValueError('No valid frames processed')
            
            # Run inference on frames
            predictions = run_model_inference(_model, frames_tensor, device)
            scores = calculate_scores(predictions, media_type, frame_count=len(valid_frames))
        
        elif media_type == 'AUDIO':
            # Audio processing not supported by current image model
            raise NotImplementedError('Audio-only inference not supported by EfficientNet model')
        
        else:
            raise ValueError(f'Unknown media type: {media_type}')
        
        # Calculate inference time
        inference_time = int((time.time() - start_time) * 1000)
        
        # Build response
        response = {
            **scores,
            'model_version': model_version,
            'inference_time': inference_time
        }
        
        logger.info(f'[ML_SERVICE] Inference complete: risk_score={response["risk_score"]}, confidence={response["confidence"]}, time={inference_time}ms')
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f'[ML_SERVICE] Inference error: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Inference failed',
            'message': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not found',
        'message': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An error occurred during inference'
    }), 500


# Load model when module is imported
if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    
    # Load model before starting server
    load_model_on_startup()
    
    logger.info(f'[ML_SERVICE] Starting ML service on port {port}')
    logger.info(f'[ML_SERVICE] Model loaded: {_model_loaded}')
    
    app.run(host='0.0.0.0', port=port, debug=False)
else:
    # Also load when imported as module (e.g., for testing)
    load_model_on_startup()
