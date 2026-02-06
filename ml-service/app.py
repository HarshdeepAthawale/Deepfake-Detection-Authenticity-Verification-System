"""
ML Service - Flask API for Deepfake Detection
High-accuracy deepfake detection using:
- Image model: deepfake-detector-model-v1 (94.44% accuracy)
- Audio model: wav2vec2-large-xlsr-deepfake-audio-classification (92.86% accuracy)

This service:
1. Loads deepfake detection models (image and audio)
2. Preprocesses media files (frames, images, audio)
3. Runs inference on the models
4. Returns combined detection scores
"""

import os
import time
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

# Import our modules
from model_loader import (
    get_pipeline, is_model_loaded, load_model, get_model_info,
    get_audio_pipeline, is_audio_model_loaded, load_audio_model
)
from preprocessing import preprocess_image, preprocess_frames
from audio_preprocessing import preprocess_audio, is_audio_processing_available

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model status
_model_loaded = False


def load_model_on_startup():
    """Load models when service starts (image and audio)"""
    global _model_loaded

    # Load image model (required)
    try:
        logger.info('[ML_SERVICE] Loading image model on startup...')
        load_model()
        _model_loaded = True
        logger.info('[ML_SERVICE] Image model loaded successfully')
    except Exception as e:
        logger.error(f'[ML_SERVICE] Failed to load image model: {str(e)}', exc_info=True)
        _model_loaded = False

    # Audio model loads lazily on first use (to not block server startup)
    # This allows the service to be healthy immediately
    logger.info('[ML_SERVICE] Audio model will load lazily on first audio request')


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


def extract_audio_fake_probability(result):
    """
    Extract fake probability from audio model result
    Model returns labels like 'fake', 'real', 'bonafide', 'spoof'

    Args:
        result: Prediction result from audio pipeline

    Returns:
        Float probability that audio is fake (0-1)
    """
    try:
        if isinstance(result, list):
            for item in result:
                label = item.get('label', '').lower()
                score = item.get('score', 0.0)

                # Handle various label formats from audio models
                if 'fake' in label or 'spoof' in label:
                    return score
                elif 'real' in label or 'bonafide' in label:
                    return 1.0 - score

            # Fallback: use first result
            if len(result) > 0:
                top_result = result[0]
                label = top_result.get('label', '').lower()
                score = top_result.get('score', 0.5)

                if 'fake' in label or 'spoof' in label:
                    return score
                else:
                    return 1.0 - score

        return 0.5  # Uncertain

    except Exception as e:
        logger.error(f'[ML_SERVICE] Error extracting audio fake probability: {str(e)}')
        return 0.5


def run_audio_inference(audio_data):
    """
    Run inference on preprocessed audio

    Args:
        audio_data: dict from preprocess_audio containing 'audio' and 'sample_rate'

    Returns:
        tuple: (fake_probability, raw_result) or (None, None) on failure
    """
    try:
        audio_pipeline = get_audio_pipeline()
        if audio_pipeline is None:
            logger.warning('[ML_SERVICE] Audio pipeline not available')
            return None, None

        if not audio_data.get('valid') or audio_data.get('audio') is None:
            logger.warning(f'[ML_SERVICE] Invalid audio data: {audio_data.get("error")}')
            return None, None

        # Prepare input for pipeline
        # HuggingFace audio-classification expects dict with 'array' and 'sampling_rate'
        audio_input = {
            'array': audio_data['audio'],
            'sampling_rate': audio_data['sample_rate']
        }

        # Run inference
        raw_result = audio_pipeline(audio_input)

        # Extract fake probability
        fake_prob = extract_audio_fake_probability(raw_result)

        logger.info(f'[ML_SERVICE] Audio inference complete: fake_prob={fake_prob:.4f}')

        return fake_prob, raw_result

    except Exception as e:
        logger.error(f'[ML_SERVICE] Audio inference error: {str(e)}', exc_info=True)
        return None, None


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


def calculate_scores(fake_probs, media_type, frame_count=1, faces_detected=0, audio_fake_prob=None):
    """
    Calculate detection scores from model predictions

    Args:
        fake_probs: List of fake probabilities (from video/image)
        media_type: Type of media (VIDEO, IMAGE, AUDIO)
        frame_count: Number of frames processed
        faces_detected: Number of frames with detected faces
        audio_fake_prob: Audio fake probability (0-1) or None if not available

    Returns:
        Dictionary of calculated scores
    """
    try:
        fake_probs = np.array(fake_probs) if len(fake_probs) > 0 else np.array([])

        if len(fake_probs) > 0:
            logger.info(f'[ML_SERVICE] Video fake probabilities: {fake_probs[:min(5, len(fake_probs))]}...')

        # Calculate video scores using 90th percentile (P90) for robustness
        if len(fake_probs) > 0 and fake_probs.max() > 0:
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

        # Audio score: calculate from audio_fake_prob if available
        if audio_fake_prob is not None:
            audio_score = float(audio_fake_prob * 100)
            logger.info(f'[ML_SERVICE] Audio score: {audio_score:.2f}%')
        else:
            audio_score = 0.0

        # Calculate confidence (how certain the model is)
        # Use the average of how far predictions are from 0.5 (uncertain)
        if len(fake_probs) > 0:
            confidence = float(np.mean([abs(p - 0.5) * 2 for p in fake_probs]) * 100)
        elif audio_fake_prob is not None:
            # Audio-only: use audio confidence
            confidence = float(abs(audio_fake_prob - 0.5) * 2 * 100)
        else:
            confidence = 0.0

        # Apply confidence penalty based on face detection rate
        # Lower face detection = lower confidence in results
        if frame_count > 0:
            face_detection_rate = faces_detected / frame_count
            confidence_penalty = 0.0

            if face_detection_rate < 0.3:
                # Very low face detection (<30%): 20% penalty
                confidence_penalty = 0.20
                logger.warning(f'[ML_SERVICE] Very low face detection rate: {face_detection_rate:.1%} - applying 20% confidence penalty')
            elif face_detection_rate < 0.5:
                # Low face detection (<50%): 10% penalty
                confidence_penalty = 0.10
                logger.warning(f'[ML_SERVICE] Low face detection rate: {face_detection_rate:.1%} - applying 10% confidence penalty')
            elif face_detection_rate < 0.7:
                # Moderate face detection (<70%): 5% penalty
                confidence_penalty = 0.05
                logger.info(f'[ML_SERVICE] Moderate face detection rate: {face_detection_rate:.1%} - applying 5% confidence penalty')

            # Apply penalty
            if confidence_penalty > 0:
                original_confidence = confidence
                confidence = confidence * (1 - confidence_penalty)
                logger.info(f'[ML_SERVICE] Confidence adjusted: {original_confidence:.2f}% → {confidence:.2f}%')

        # Calculate combined risk score
        if media_type == 'VIDEO' and audio_score > 0:
            # VIDEO with audio: weighted combination
            # 60% video, 40% audio - but use max if one is much higher (partial deepfake)
            weighted_score = (video_score * 0.6) + (audio_score * 0.4)
            risk_score = max(weighted_score, video_score, audio_score * 0.9)
            logger.info(f'[ML_SERVICE] Combined video+audio risk: weighted={weighted_score:.2f}, final={risk_score:.2f}')
        elif media_type == 'AUDIO':
            # AUDIO only: use audio score directly
            risk_score = audio_score
        else:
            # VIDEO/IMAGE without audio: use video score
            risk_score = video_score

        # If peak is significantly higher than current risk, blend them
        if peak_risk > risk_score + 10:
            risk_score = (risk_score * 0.7) + (peak_risk * 0.3)

        risk_score = min(100, max(0, risk_score))

        logger.info(f'[ML_SERVICE] Scores: Video={video_score:.2f}, Audio={audio_score:.2f}, Peak={peak_risk:.2f}, Risk={risk_score:.2f}, Confidence={confidence:.2f}')

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
        'version': '4.1.0',
        # Image model info
        'model': model_info['model'],
        'model_status': 'loaded' if _model_loaded else 'not_loaded',
        'accuracy': model_info['accuracy'],
        'architecture': model_info['architecture'],
        'device': model_info['device'],
        # Audio model info
        'audio_model': model_info.get('audio_model'),
        'audio_model_status': 'loaded' if model_info.get('audio_model_loaded') else 'not_loaded',
        'audio_accuracy': model_info.get('audio_accuracy'),
        'audio_processing_available': is_audio_processing_available(),
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

            # Run video/image inference on all frames
            fake_probs, results = run_inference(pipeline, processed_images)

            # Process audio if available
            audio_fake_prob = None
            if extracted_audio and os.path.exists(extracted_audio):
                logger.info(f'[ML_SERVICE] Processing audio track: {extracted_audio}')

                if is_audio_model_loaded() and is_audio_processing_available():
                    audio_data = preprocess_audio(extracted_audio)
                    if audio_data['valid']:
                        audio_fake_prob, audio_raw = run_audio_inference(audio_data)
                        if audio_fake_prob is not None:
                            logger.info(f'[ML_SERVICE] Audio analysis complete: fake_prob={audio_fake_prob:.4f}')
                        else:
                            logger.warning('[ML_SERVICE] Audio inference returned None')
                    else:
                        logger.warning(f'[ML_SERVICE] Audio preprocessing failed: {audio_data.get("error")}')
                else:
                    logger.info('[ML_SERVICE] Audio model not available, skipping audio analysis')
            else:
                logger.info('[ML_SERVICE] No audio track provided for video')

            # Calculate combined scores (video + audio)
            scores = calculate_scores(
                fake_probs,
                media_type,
                frame_count=len(valid_frames),
                faces_detected=faces_detected,
                audio_fake_prob=audio_fake_prob
            )

        elif media_type == 'AUDIO':
            # Standalone audio deepfake detection
            if not is_audio_model_loaded():
                raise ValueError('Audio deepfake detection not available - audio model not loaded')

            if not is_audio_processing_available():
                raise ValueError('Audio processing not available - librosa not installed')

            # Get audio path (either extracted or direct upload)
            audio_path = extracted_audio
            if not audio_path and extracted_frames:
                # For direct audio uploads, the path might be in extractedFrames
                audio_path = extracted_frames[0] if isinstance(extracted_frames, list) else extracted_frames

            if not audio_path or not os.path.exists(audio_path):
                raise ValueError('No valid audio file provided')

            logger.info(f'[ML_SERVICE] Processing audio file: {audio_path}')

            # Preprocess audio
            audio_data = preprocess_audio(audio_path)
            if not audio_data['valid']:
                raise ValueError(f'Audio preprocessing failed: {audio_data.get("error")}')

            # Run audio inference
            audio_fake_prob, audio_raw = run_audio_inference(audio_data)
            if audio_fake_prob is None:
                raise ValueError('Audio inference failed')

            # Calculate scores (video scores will be 0 for audio-only)
            scores = calculate_scores(
                fake_probs=[],  # No video frames
                media_type=media_type,
                frame_count=0,
                faces_detected=0,
                audio_fake_prob=audio_fake_prob
            )

        else:
            raise ValueError(f'Unknown media type: {media_type}')

        # Calculate inference time
        inference_time = int((time.time() - start_time) * 1000)

        # Get model info for version tracking
        model_info = get_model_info()

        # Build response
        response = {
            **scores,
            'model_version': model_info['model_version'],
            'model_name': model_info['model_name'],
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

    # Load models before starting server
    load_model_on_startup()

    logger.info(f'[ML_SERVICE] Starting ML service on port {port}')
    logger.info(f'[ML_SERVICE] Image model loaded: {_model_loaded}')
    logger.info(f'[ML_SERVICE] Audio model loaded: {is_audio_model_loaded()}')
    logger.info(f'[ML_SERVICE] Audio processing available: {is_audio_processing_available()}')
    logger.info(f'[ML_SERVICE] Using deepfake-detector-model-v1 (94.44% accuracy)')
    logger.info(f'[ML_SERVICE] Using wav2vec2-large-xlsr-deepfake-audio-classification (92.86% accuracy)')

    app.run(host='0.0.0.0', port=port, debug=False)
else:
    # Also load when imported as module (e.g., for testing)
    load_model_on_startup()
