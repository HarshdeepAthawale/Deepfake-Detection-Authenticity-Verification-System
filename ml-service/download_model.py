#!/usr/bin/env python3
"""
Model Download Script
Downloads the trained EfficientNet-B0 model weights from Hugging Face
"""

import os
import sys
import requests
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Model configuration
MODEL_URL = "https://huggingface.co/Xicor9/efficientnet-b0-ffpp-c23/resolve/main/efficientnet_b0_ffpp_c23.pth"
MODEL_DIR = "efficientnet_b0_ffpp_c23"
MODEL_FILENAME = "efficientnet_b0_ffpp_c23.pth"
EXPECTED_SIZE_MB = 17  # Approximate expected size in MB


def download_model(force=False):
    """
    Download the model weights from Hugging Face
    
    Args:
        force: If True, download even if file exists
    """
    # Get script directory
    script_dir = Path(__file__).parent.absolute()
    model_dir = script_dir / MODEL_DIR
    model_path = model_dir / MODEL_FILENAME
    
    # Create model directory if it doesn't exist
    model_dir.mkdir(exist_ok=True)
    
    # Check if model already exists
    if model_path.exists() and not force:
        file_size_mb = model_path.stat().st_size / (1024 * 1024)
        logger.info(f"Model file already exists: {model_path}")
        logger.info(f"File size: {file_size_mb:.2f} MB")
        
        if file_size_mb < 1:
            logger.warning("Model file is suspiciously small, re-downloading...")
        else:
            logger.info("Model file looks valid. Use --force to re-download.")
            return True
    
    logger.info(f"Downloading model from: {MODEL_URL}")
    logger.info(f"Saving to: {model_path}")
    
    try:
        # Download with progress
        response = requests.get(MODEL_URL, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        total_size_mb = total_size / (1024 * 1024)
        
        logger.info(f"Download size: {total_size_mb:.2f} MB")
        
        # Download in chunks with progress
        downloaded = 0
        chunk_size = 8192
        
        with open(model_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    # Print progress every 1MB
                    if downloaded % (1024 * 1024) == 0 or downloaded == total_size:
                        progress = (downloaded / total_size * 100) if total_size > 0 else 0
                        logger.info(f"Progress: {downloaded / (1024 * 1024):.2f} MB / {total_size_mb:.2f} MB ({progress:.1f}%)")
        
        # Verify download
        final_size_mb = model_path.stat().st_size / (1024 * 1024)
        logger.info(f"Download complete! Final size: {final_size_mb:.2f} MB")
        
        if final_size_mb < 1:
            logger.error("Downloaded file is too small! Download may have failed.")
            return False
        
        logger.info("✓ Model downloaded successfully!")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download model: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False


def verify_model():
    """Verify that the model can be loaded"""
    try:
        import torch
        from pathlib import Path
        
        script_dir = Path(__file__).parent.absolute()
        model_path = script_dir / MODEL_DIR / MODEL_FILENAME
        
        if not model_path.exists():
            logger.error(f"Model file not found: {model_path}")
            return False
        
        logger.info("Verifying model can be loaded...")
        
        # Try to load the model
        state_dict = torch.load(model_path, map_location='cpu', weights_only=False)
        
        if isinstance(state_dict, dict):
            num_params = len(state_dict)
            logger.info(f"✓ Model loaded successfully! Contains {num_params} parameter tensors")
            
            # Check for expected keys
            expected_keys = ['features.0.0.weight', 'classifier.1.weight', 'classifier.1.bias']
            found_keys = [key for key in expected_keys if key in state_dict]
            logger.info(f"Found {len(found_keys)}/{len(expected_keys)} expected keys")
            
            return True
        else:
            logger.warning("Model loaded but format is unexpected")
            return False
            
    except Exception as e:
        logger.error(f"Failed to verify model: {e}")
        return False


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Download EfficientNet-B0 deepfake detection model')
    parser.add_argument('--force', action='store_true', help='Force re-download even if file exists')
    parser.add_argument('--verify', action='store_true', help='Verify model after download')
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("EfficientNet-B0 Model Downloader")
    logger.info("=" * 60)
    
    success = download_model(force=args.force)
    
    if success and args.verify:
        logger.info("")
        verify_model()
    
    if success:
        logger.info("")
        logger.info("=" * 60)
        logger.info("✓ Setup complete! Model is ready to use.")
        logger.info("=" * 60)
        sys.exit(0)
    else:
        logger.error("")
        logger.error("=" * 60)
        logger.error("✗ Setup failed! Please check the errors above.")
        logger.error("=" * 60)
        sys.exit(1)
