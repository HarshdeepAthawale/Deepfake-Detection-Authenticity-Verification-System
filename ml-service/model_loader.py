"""
Model Loader Module
Loads and manages the deepfake-detector-model-v1
High-accuracy deepfake detection model (94.44% accuracy)
"""

import os
import torch
import logging
from transformers import pipeline

logger = logging.getLogger(__name__)

# Model configuration
LOCAL_MODEL_PATH = "/app/model"
MODEL_ID_HF = "prithivMLmods/deepfake-detector-model-v1"

# Global instances (singleton pattern)
_pipeline = None
_device = None


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
    """Check if model is loaded"""
    return _pipeline is not None


def get_model_info():
    """Get information about loaded model"""
    model_source = "local (/app/model)" if os.path.exists(LOCAL_MODEL_PATH) else MODEL_ID_HF
    return {
        'model': model_source,
        'model_loaded': _pipeline is not None,
        'device': 'cuda' if get_device() >= 0 else 'cpu',
        'accuracy': '94.44%',
        'architecture': 'SiglIP-based binary classifier'
    }
