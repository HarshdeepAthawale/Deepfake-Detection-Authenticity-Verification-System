"""
Audio Preprocessing Module for Deepfake Detection

Handles audio loading, validation, and preprocessing for the wav2vec2-based
audio deepfake detection model.

Uses librosa for resampling from 44.1kHz (FFmpeg output) to 16kHz (model requirement)
Target model: Gustking/wav2vec2-large-xlsr-deepfake-audio-classification
"""

import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Try to import librosa - graceful fallback if not available
try:
    import librosa
    LIBROSA_AVAILABLE = True
    logger.info('[AUDIO_PREPROCESSING] librosa loaded successfully')
except ImportError:
    LIBROSA_AVAILABLE = False
    logger.warning('[AUDIO_PREPROCESSING] librosa not available - audio processing disabled')

# Constants
TARGET_SAMPLE_RATE = 16000  # wav2vec2 models require 16kHz
MIN_AUDIO_DURATION = 0.5    # Minimum 0.5 seconds
MAX_AUDIO_DURATION = 30.0   # Maximum 30 seconds for memory efficiency
SILENCE_THRESHOLD = 0.001   # RMS threshold for silence detection


def is_audio_processing_available():
    """Check if audio processing is available"""
    return LIBROSA_AVAILABLE


def load_audio(audio_path, target_sr=TARGET_SAMPLE_RATE):
    """
    Load and resample audio file to target sample rate

    Args:
        audio_path: Path to audio file (WAV, MP3, FLAC supported)
        target_sr: Target sample rate (default 16kHz for wav2vec2)

    Returns:
        tuple: (audio_array, sample_rate) or (None, None) on failure
    """
    if not LIBROSA_AVAILABLE:
        logger.error('[AUDIO_PREPROCESSING] librosa not available')
        return None, None

    try:
        if not audio_path:
            logger.error('[AUDIO_PREPROCESSING] No audio path provided')
            return None, None

        if not os.path.exists(audio_path):
            logger.error(f'[AUDIO_PREPROCESSING] Audio file not found: {audio_path}')
            return None, None

        file_size = os.path.getsize(audio_path)
        if file_size == 0:
            logger.error(f'[AUDIO_PREPROCESSING] Audio file is empty: {audio_path}')
            return None, None

        logger.info(f'[AUDIO_PREPROCESSING] Loading audio: {audio_path} ({file_size} bytes)')

        # Load audio with librosa
        # sr=target_sr automatically resamples from source (e.g., 44.1kHz) to target (16kHz)
        # mono=True converts stereo to mono
        audio, sr = librosa.load(audio_path, sr=target_sr, mono=True)

        duration = len(audio) / sr
        logger.info(f'[AUDIO_PREPROCESSING] Loaded audio: {duration:.2f}s at {sr}Hz, {len(audio)} samples')

        return audio, sr

    except Exception as e:
        logger.error(f'[AUDIO_PREPROCESSING] Error loading audio: {str(e)}')
        return None, None


def validate_audio(audio, sample_rate, min_duration=MIN_AUDIO_DURATION, max_duration=MAX_AUDIO_DURATION):
    """
    Validate that audio meets requirements for model inference

    Args:
        audio: numpy array of audio samples
        sample_rate: Sample rate in Hz
        min_duration: Minimum duration in seconds
        max_duration: Maximum duration in seconds

    Returns:
        tuple: (is_valid, error_message or None)
    """
    if audio is None:
        return False, 'Audio is None'

    if not isinstance(audio, np.ndarray):
        return False, f'Audio must be numpy array, got {type(audio)}'

    if len(audio) == 0:
        return False, 'Audio array is empty'

    duration = len(audio) / sample_rate

    if duration < min_duration:
        return False, f'Audio too short: {duration:.2f}s (minimum: {min_duration}s)'

    if duration > max_duration:
        # This is a warning, not an error - we'll truncate
        logger.warning(f'[AUDIO_PREPROCESSING] Audio will be truncated: {duration:.2f}s > {max_duration}s')

    # Check for silence (very low RMS energy)
    rms = np.sqrt(np.mean(audio**2))
    if rms < SILENCE_THRESHOLD:
        return False, f'Audio appears to be silent (RMS: {rms:.6f})'

    # Check for NaN or Inf values
    if np.isnan(audio).any() or np.isinf(audio).any():
        return False, 'Audio contains NaN or Inf values'

    return True, None


def normalize_audio(audio):
    """
    Normalize audio to [-1, 1] range

    Args:
        audio: numpy array of audio samples

    Returns:
        Normalized audio array
    """
    max_val = np.abs(audio).max()
    if max_val > 0:
        return audio / max_val
    return audio


def preprocess_audio(audio_path, max_duration=MAX_AUDIO_DURATION):
    """
    Full preprocessing pipeline for audio deepfake detection

    Args:
        audio_path: Path to audio file
        max_duration: Maximum duration to process (truncates if longer)

    Returns:
        dict with keys:
            - 'audio': numpy array of preprocessed audio (or None on failure)
            - 'sample_rate': int (16000)
            - 'duration': float (seconds)
            - 'valid': bool
            - 'error': str or None
    """
    result = {
        'audio': None,
        'sample_rate': TARGET_SAMPLE_RATE,
        'duration': 0.0,
        'valid': False,
        'error': None
    }

    # Check if librosa is available
    if not LIBROSA_AVAILABLE:
        result['error'] = 'Audio processing not available (librosa not installed)'
        logger.warning(f'[AUDIO_PREPROCESSING] {result["error"]}')
        return result

    # Load audio (automatically resamples to 16kHz)
    audio, sr = load_audio(audio_path, TARGET_SAMPLE_RATE)
    if audio is None:
        result['error'] = 'Failed to load audio file'
        return result

    # Truncate if too long
    max_samples = int(max_duration * sr)
    if len(audio) > max_samples:
        original_duration = len(audio) / sr
        audio = audio[:max_samples]
        logger.info(f'[AUDIO_PREPROCESSING] Truncated audio from {original_duration:.2f}s to {max_duration}s')

    # Validate audio
    is_valid, error = validate_audio(audio, sr)
    if not is_valid:
        result['error'] = error
        logger.warning(f'[AUDIO_PREPROCESSING] Validation failed: {error}')
        return result

    # Normalize audio to [-1, 1] range
    audio = normalize_audio(audio)

    # Populate result
    result['audio'] = audio
    result['sample_rate'] = sr
    result['duration'] = len(audio) / sr
    result['valid'] = True

    logger.info(f'[AUDIO_PREPROCESSING] Preprocessed audio: {result["duration"]:.2f}s, {sr}Hz, {len(audio)} samples')

    return result


def get_audio_stats(audio, sample_rate):
    """
    Get statistics about audio for debugging/logging

    Args:
        audio: numpy array of audio samples
        sample_rate: Sample rate in Hz

    Returns:
        dict with audio statistics
    """
    if audio is None or len(audio) == 0:
        return {}

    return {
        'duration': len(audio) / sample_rate,
        'sample_rate': sample_rate,
        'samples': len(audio),
        'rms': float(np.sqrt(np.mean(audio**2))),
        'peak': float(np.abs(audio).max()),
        'mean': float(np.mean(audio)),
        'std': float(np.std(audio))
    }
