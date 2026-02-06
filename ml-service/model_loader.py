"""
Model Loader Module
Loads and manages deepfake detection models:
- Image model: deepfake-detector-model-v1 (94.44% accuracy)
- Audio model: wav2vec2-large-xlsr-deepfake-audio-classification (92.86% accuracy)
"""

import os
import torch
import logging
from transformers import pipeline

logger = logging.getLogger(__name__)

# Image model configuration
LOCAL_MODEL_PATH = "/app/model"
MODEL_ID_HF = "prithivMLmods/deepfake-detector-model-v1"

# Audio model configuration
LOCAL_AUDIO_MODEL_PATH = "/app/audio_model"
AUDIO_MODEL_ID_HF = "Gustking/wav2vec2-large-xlsr-deepfake-audio-classification"

# Global instances (singleton pattern)
_pipeline = None
_audio_pipeline = None
_device = None
_audio_model_loaded = False


def get_device():
    """Get the appropriate device (CPU or GPU)"""
    global _device
    if _device is None:
        if torch.cuda.is_available():
            _device = 0  # GPU device ID
        else:
            _device = -1  # CPU
        logger.info(f'[MODEL_LOADER] Using device: {"cuda" if _device >= 0 else "cpu"}')
    return _device


def load_model():
    """
    Load the deepfake-detector-model-v1 model using pipeline

    Returns:
        Loaded pipeline for image classification
    """
    global _pipeline

    if _pipeline is not None:
        logger.info('[MODEL_LOADER] Model already loaded, returning cached instance')
        return _pipeline

    try:
        device = get_device()

        # Check for local model first
        if os.path.exists(LOCAL_MODEL_PATH):
            model_path = LOCAL_MODEL_PATH
            logger.info(f'[MODEL_LOADER] Using local model from: {LOCAL_MODEL_PATH}')
        else:
            model_path = MODEL_ID_HF
            logger.info(f'[MODEL_LOADER] Downloading model from HuggingFace: {MODEL_ID_HF}')

        logger.info(f'[MODEL_LOADER] Loading model: {model_path}')

        # Use pipeline for simple and reliable loading
        # The pipeline handles model and processor loading automatically
        _pipeline = pipeline(
            "image-classification",
            model=model_path,
            device=device
        )

        logger.info('[MODEL_LOADER] Model loaded successfully')
        return _pipeline

    except Exception as e:
        logger.error(f'[MODEL_LOADER] Failed to load model: {str(e)}', exc_info=True)
        raise


def get_pipeline():
    """
    Get the loaded pipeline instance (loads if not already loaded)

    Returns:
        Loaded pipeline
    """
    global _pipeline

    if _pipeline is None:
        _pipeline = load_model()

    return _pipeline


def is_model_loaded():
    """Check if image model is loaded"""
    return _pipeline is not None


def load_audio_model():
    """
    Load the audio deepfake detection model (wav2vec2-based)

    Returns:
        Loaded pipeline for audio classification or None if failed
    """
    global _audio_pipeline, _audio_model_loaded

    if _audio_pipeline is not None:
        logger.info('[MODEL_LOADER] Audio model already loaded, returning cached instance')
        return _audio_pipeline

    try:
        device = get_device()

        # Check for local model first
        if os.path.exists(LOCAL_AUDIO_MODEL_PATH):
            model_path = LOCAL_AUDIO_MODEL_PATH
            logger.info(f'[MODEL_LOADER] Using local audio model from: {LOCAL_AUDIO_MODEL_PATH}')
        else:
            model_path = AUDIO_MODEL_ID_HF
            logger.info(f'[MODEL_LOADER] Downloading audio model from HuggingFace: {AUDIO_MODEL_ID_HF}')

        logger.info(f'[MODEL_LOADER] Loading audio model: {model_path}')

        # Use audio-classification pipeline for wav2vec2 model
        _audio_pipeline = pipeline(
            "audio-classification",
            model=model_path,
            device=device
        )

        _audio_model_loaded = True
        logger.info('[MODEL_LOADER] Audio model loaded successfully')
        return _audio_pipeline

    except Exception as e:
        logger.error(f'[MODEL_LOADER] Failed to load audio model: {str(e)}', exc_info=True)
        _audio_model_loaded = False
        return None


def get_audio_pipeline():
    """
    Get the loaded audio pipeline instance (loads if not already loaded)

    Returns:
        Loaded audio pipeline or None if loading failed
    """
    global _audio_pipeline

    if _audio_pipeline is None:
        _audio_pipeline = load_audio_model()

    return _audio_pipeline


def is_audio_model_loaded():
    """Check if audio model is loaded"""
    return _audio_model_loaded and _audio_pipeline is not None


def get_model_info():
    """Get information about loaded models (image and audio)"""
    model_source = "local (/app/model)" if os.path.exists(LOCAL_MODEL_PATH) else MODEL_ID_HF
    audio_source = "local (/app/audio_model)" if os.path.exists(LOCAL_AUDIO_MODEL_PATH) else AUDIO_MODEL_ID_HF

    return {
        # Image model info
        'model': model_source,
        'model_name': 'deepfake-detector-model-v1',
        'model_version': 'v1.0.0',
        'model_id': MODEL_ID_HF,
        'model_loaded': _pipeline is not None,
        'device': 'cuda' if get_device() >= 0 else 'cpu',
        'accuracy': '94.44%',
        'architecture': 'SiglIP-based binary classifier',
        # Audio model info
        'audio_model': audio_source,
        'audio_model_name': 'wav2vec2-large-xlsr-deepfake-audio-classification',
        'audio_model_id': AUDIO_MODEL_ID_HF,
        'audio_model_loaded': _audio_model_loaded and _audio_pipeline is not None,
        'audio_accuracy': '92.86%',
        'audio_architecture': 'Wav2Vec2-XLS-R based binary classifier'
    }
