"""
Preprocessing Module
Handles image preprocessing for the Hugging Face model
"""

import os
from PIL import Image, ImageOps
import logging

# Import face detection module
try:
    from face_detection import detect_and_crop_face
    FACE_DETECTION_AVAILABLE = True
except ImportError:
    FACE_DETECTION_AVAILABLE = False
    logging.warning('[PREPROCESSING] Face detection module not available')

logger = logging.getLogger(__name__)


def load_image(image_input):
    """
    Load and convert image to PIL format

    Args:
        image_input: Can be:
            - PIL Image object
            - File path (str)
            - numpy array

    Returns:
        PIL Image in RGB format
    """
    try:
        if isinstance(image_input, str):
            # File path
            if not os.path.exists(image_input):
                raise FileNotFoundError(f'Image file not found: {image_input}')
            image = Image.open(image_input)
            # Apply EXIF rotation (critical for mobile photos)
            image = ImageOps.exif_transpose(image)
            image = image.convert('RGB')
        elif isinstance(image_input, Image.Image):
            # PIL Image - apply EXIF rotation if available
            image = ImageOps.exif_transpose(image_input)
            image = image.convert('RGB')
        else:
            # Try to convert numpy array or other formats
            if hasattr(image_input, 'shape'):
                # numpy array
                image = Image.fromarray(image_input).convert('RGB')
            else:
                raise ValueError(f'Unsupported image input type: {type(image_input)}')

        return image

    except Exception as e:
        logger.error(f'[PREPROCESSING] Error loading image: {str(e)}')
        raise


def preprocess_image(image_input, detect_faces=True, return_face_info=False):
    """
    Preprocess a single image for model inference

    Args:
        image_input: Can be:
            - PIL Image object
            - File path (str)
            - numpy array
        detect_faces: If True, detect and crop face before preprocessing (default: True)
        return_face_info: If True, return tuple (image, face_detected) (default: False)

    Returns:
        PIL Image ready for model input
        If return_face_info=True: tuple (PIL Image, bool face_detected)
    """
    try:
        # Load image
        image = load_image(image_input)
        face_detected = False

        # Apply face detection if enabled and available
        if detect_faces and FACE_DETECTION_AVAILABLE:
            cropped_image, bbox = detect_and_crop_face(image, return_bbox=True)
            face_detected = bbox is not None
            image = cropped_image
            if face_detected:
                logger.debug(f'[PREPROCESSING] Face detection applied, bbox={bbox}')
            else:
                logger.warning('[PREPROCESSING] No face detected, using full image')
        elif detect_faces and not FACE_DETECTION_AVAILABLE:
            logger.warning('[PREPROCESSING] Face detection requested but not available')

        if return_face_info:
            return image, face_detected
        return image

    except Exception as e:
        logger.error(f'[PREPROCESSING] Error preprocessing image: {str(e)}')
        raise


def preprocess_batch(image_paths, detect_faces=True):
    """
    Preprocess a batch of images for model inference

    Args:
        image_paths: List of image file paths
        detect_faces: If True, detect and crop faces before preprocessing (default: True)

    Returns:
        List of PIL Images and list of valid paths
    """
    try:
        if not image_paths:
            raise ValueError('Empty image paths list')

        images = []
        valid_paths = []

        for path in image_paths:
            try:
                image = preprocess_image(path, detect_faces=detect_faces)
                images.append(image)
                valid_paths.append(path)
            except Exception as e:
                logger.warning(f'[PREPROCESSING] Skipping invalid image {path}: {str(e)}')
                continue

        if not images:
            raise ValueError('No valid images found in batch')

        return images, valid_paths

    except Exception as e:
        logger.error(f'[PREPROCESSING] Error preprocessing batch: {str(e)}')
        raise


def preprocess_frames(frame_paths, max_frames=None, detect_faces=True):
    """
    Preprocess video frames for inference

    Args:
        frame_paths: List of frame file paths
        max_frames: Maximum number of frames to process (None = all)
        detect_faces: If True, detect and crop faces before preprocessing (default: True)

    Returns:
        List of PIL Images and list of processed frame paths
    """
    try:
        if not frame_paths:
            logger.warning('[PREPROCESSING] No frame paths provided')
            return [], []

        # Limit number of frames if specified
        if max_frames and len(frame_paths) > max_frames:
            # Sample frames evenly
            step = len(frame_paths) // max_frames
            frame_paths = frame_paths[::step][:max_frames]
            logger.info(f'[PREPROCESSING] Sampling {len(frame_paths)} frames')

        # Preprocess batch
        images, valid_paths = preprocess_batch(frame_paths, detect_faces=detect_faces)

        return images, valid_paths

    except Exception as e:
        logger.error(f'[PREPROCESSING] Error preprocessing frames: {str(e)}')
        raise
