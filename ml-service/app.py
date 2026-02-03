"""
ML Service - Flask API for Deepfake Detection
High-accuracy deepfake detection using deepfake-detector-model-v1 (94.44% accuracy)

This service:
1. Loads the deepfake-detector-model-v1 model
2. Preprocesses media files (frames, images)
3. Runs inference on the model
4. Returns detection scores
"""

import os
import time
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

# Import our modules
from model_loader import get_pipeline, is_model_loaded, load_model, get_model_info
from preprocessing import preprocess_image, preprocess_frames

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model status
_model_loaded = False


def load_model_on_startup():
    """Load model when service starts"""
    global _model_loaded

    try:
        logger.info('[ML_SERVICE] Loading model on startup...')
        load_model()
        _model_loaded = True
        logger.info('[ML_SERVICE] Model loaded successfully')
    except Exception as e:
        logger.error(f'[ML_SERVICE] Failed to load model: {str(e)}', exc_info=True)
        _model_loaded = False


def extract_fake_probability(result):
    """
    Extract the fake probability from model result
    Model returns: Class 0 = 'fake', Class 1 = 'real'

    Args:
        result: Single prediction result from pipeline

    Returns:
        Float probability that the image is fake (0-1)
    """
    try:
        if isinstance(result, list):
            # Find the 'fake' label
            for item in result:
                label = item.get('label', '').lower()
                score = item.get('score', 0.0)

                if 'fake' in label or label == 'label_0':
                    return score
                elif 'real' in label or label == 'label_1':
                    return 1.0 - score

            # Fallback: use first result
            if len(result) > 0:
                top_result = result[0]
                label = top_result.get('label', '').lower()
                score = top_result.get('score', 0.5)

                if 'fake' in label or label == 'label_0':
                    return score
                elif 'real' in label or label == 'label_1':
                    return 1.0 - score

        return 0.5

    except Exception as e:
        logger.error(f'[ML_SERVICE] Error extracting fake probability: {str(e)}')
        return 0.5


def run_inference(pipeline, images):
    """
    Run inference on preprocessed images using pipeline

    Args:
        pipeline: Loaded pipeline
        images: List of PIL Images or single PIL Image

    Returns:
        List of predictions with probabilities
    """
    try:
        # Run inference
        raw_results = pipeline(images)

        # Normalize results to list of predictions
        # Each prediction is a list of {label, score} dicts
        results = []

        if isinstance(raw_results, dict):
            # Single dict result
            results = [[raw_results]]
        elif isinstance(raw_results, list) and len(raw_results) > 0:
            if isinstance(raw_results[0], dict) and 'label' in raw_results[0]:
                # Single image result: [{'label': 'Real', 'score': 0.51}, {'label': 'Fake', 'score': 0.49}]
                results = [raw_results]
            elif isinstance(raw_results[0], list):
                # Batch result: [[{...}, {...}], [{...}, {...}]]
                results = raw_results
            else:
                # Unknown format, wrap it
                results = [raw_results]
        else:
            # Empty or unknown, use default
            results = [raw_results]

        # Extract fake probabilities - each result is a full prediction with all labels
        fake_probs = [extract_fake_probability(result) for result in results]

        return fake_probs, raw_results

    except Exception as e:
        logger.error(f'[ML_SERVICE] Model inference error: {str(e)}', exc_info=True)
        raise


def calculate_scores(fake_probs, media_type, frame_count=1, faces_detected=0):
    """
    Calculate detection scores from model predictions

    Args:
        fake_probs: List of fake probabilities
        media_type: Type of media (VIDEO, IMAGE, AUDIO)
        frame_count: Number of frames processed
        faces_detected: Number of frames with detected faces

    Returns:
        Dictionary of calculated scores
    """
    try:
        fake_probs = np.array(fake_probs)

        logger.info(f'[ML_SERVICE] Fake probabilities: {fake_probs[:min(5, len(fake_probs))]}...')

        # Calculate scores using 90th percentile (P90) for robustness
        if len(fake_probs) > 0:
            video_score = float(np.percentile(fake_probs, 90) * 100)
            peak_risk = float(np.max(fake_probs) * 100)
            mean_risk = float(np.mean(fake_probs) * 100)
        else:
            video_score = 0.0
            peak_risk = 0.0
            mean_risk = 0.0

        # GAN fingerprint score (same as video score for this model)
        gan_fingerprint = video_score

        # Temporal consistency for videos
        if media_type == 'VIDEO' and len(fake_probs) > 1:
            variance = float(np.var(fake_probs))
            # Higher variance = lower consistency
            temporal_consistency = max(0, min(100, 100 - (variance * 1000)))
        else:
            temporal_consistency = 100.0

        # Audio score: 0 for image-based model
        audio_score = 0.0

        # Calculate confidence (how certain the model is)
        # Use the average of how far predictions are from 0.5 (uncertain)
        confidence = float(np.mean([abs(p - 0.5) * 2 for p in fake_probs]) * 100)

        # Calculate risk score (weighted combination)
        risk_score = video_score
        # If peak is significantly higher than P90, blend them
        if peak_risk > risk_score + 10:
            risk_score = (risk_score * 0.7) + (peak_risk * 0.3)
        risk_score = min(100, max(0, risk_score))

        logger.info(f'[ML_SERVICE] Scores: P90={video_score:.2f}, Peak={peak_risk:.2f}, Mean={mean_risk:.2f}, Risk={risk_score:.2f}, Confidence={confidence:.2f}')

        return {
            'video_score': round(video_score, 2),
            'peak_risk': round(peak_risk, 2),
            'mean_risk': round(mean_risk, 2),
            'audio_score': round(audio_score, 2),
            'gan_fingerprint': round(gan_fingerprint, 2),
            'temporal_consistency': round(temporal_consistency, 2),
            'risk_score': round(risk_score, 2),
            'confidence': round(confidence, 2),
            'faces_detected': faces_detected,
            'total_frames': frame_count
        }

    except Exception as e:
        logger.error(f'[ML_SERVICE] Score calculation error: {str(e)}', exc_info=True)
        raise


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    model_info = get_model_info()
    return jsonify({
        'status': 'healthy' if _model_loaded else 'unhealthy',
        'service': 'deepfake-detection-ml-service',
        'version': '4.0.0',
        'model': model_info['model'],
        'model_status': 'loaded' if _model_loaded else 'not_loaded',
        'accuracy': model_info['accuracy'],
        'architecture': model_info['architecture'],
        'device': model_info['device'],
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
        model_version = data.get('modelVersion', 'v4')
        extracted_frames = data.get('extractedFrames', [])
        extracted_audio = data.get('extractedAudio', None)

        logger.info(f'[ML_SERVICE] Inference request: hash={hash_value[:16] if hash_value else "none"}..., type={media_type}, model={model_version}')

        # Get pipeline
        pipeline = get_pipeline()

        # Track face detection
        faces_detected = 0
        total_frames = 0

        # Process based on media type
        if media_type == 'IMAGE':
            if not extracted_frames:
                raise ValueError('No frame paths provided for IMAGE')

            # Process first frame as image
            image_path = extracted_frames[0] if isinstance(extracted_frames, list) else extracted_frames
            
            # Validate path exists
            if not os.path.exists(image_path):
                raise ValueError(f'Image file not found: {image_path}')
            
            image, face_found = preprocess_image(image_path, return_face_info=True)
            total_frames = 1
            faces_detected = 1 if face_found else 0

            if not face_found:
                logger.warning(f'[ML_SERVICE] No face detected in image - results may be less accurate')

            # Run inference
            fake_probs, results = run_inference(pipeline, image)
            scores = calculate_scores(fake_probs, media_type, frame_count=1, faces_detected=faces_detected)

        elif media_type == 'VIDEO':
            if not extracted_frames:
                raise ValueError('No frame paths provided for VIDEO')
            
            # Validate frame paths exist
            valid_paths = []
            for frame_path in extracted_frames:
                if os.path.exists(frame_path):
                    valid_paths.append(frame_path)
                else:
                    logger.warning(f'[ML_SERVICE] Frame file not found: {frame_path}')
            
            if not valid_paths:
                raise ValueError('No valid frame files found')

            # Process frames (limit to max 30 frames for performance)
            max_frames = 30
            images, valid_frames = preprocess_frames(valid_paths, max_frames=max_frames)

            if not images or len(valid_frames) == 0:
                raise ValueError('No valid frames processed')

            total_frames = len(valid_frames)

            # Check face detection for each frame
            faces_detected = 0
            processed_images = []
            for img in images:
                # Note: images are already preprocessed with face detection
                # We assume preprocessing applied face detection
                # Check if it's a face crop by comparing aspect ratio and size
                w, h = img.size
                aspect_ratio = w / h if h > 0 else 1
                # Face crops are typically square-ish (aspect ratio near 1)
                if 0.7 <= aspect_ratio <= 1.3:
                    faces_detected += 1
                processed_images.append(img)

            # Run inference on all frames
            fake_probs, results = run_inference(pipeline, processed_images)
            scores = calculate_scores(fake_probs, media_type, frame_count=len(valid_frames), faces_detected=faces_detected)

        elif media_type == 'AUDIO':
            raise NotImplementedError('Audio-only inference not supported by image classification model')

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

        # Add warning if no faces detected
        if faces_detected == 0:
            response['warning'] = 'No faces detected - results may be less accurate'

        logger.info(f'[ML_SERVICE] Inference complete: risk_score={response["risk_score"]}, confidence={response["confidence"]}, faces={faces_detected}/{total_frames}, time={inference_time}ms')

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))

    # Load model before starting server
    load_model_on_startup()

    logger.info(f'[ML_SERVICE] Starting ML service on port {port}')
    logger.info(f'[ML_SERVICE] Model loaded: {_model_loaded}')
    logger.info(f'[ML_SERVICE] Using deepfake-detector-model-v1 (94.44% accuracy)')

    app.run(host='0.0.0.0', port=port, debug=False)
else:
    # Also load when imported as module (e.g., for testing)
    load_model_on_startup()
