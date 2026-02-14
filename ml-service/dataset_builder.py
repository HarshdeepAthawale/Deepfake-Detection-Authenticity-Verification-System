"""
Dataset Builder
Builds HuggingFace Dataset from training_dataset/{real,fake}/ for fine-tuning
"""

import os
import logging
from pathlib import Path
from PIL import Image

logger = logging.getLogger(__name__)

TRAINING_DATASET_PATH = os.environ.get('TRAINING_DATASET_PATH', '/app/uploads/training_dataset')


def get_dataset_stats():
    """Get statistics about the current training dataset"""
    real_dir = os.path.join(TRAINING_DATASET_PATH, 'real')
    fake_dir = os.path.join(TRAINING_DATASET_PATH, 'fake')

    real_count = len(_list_images(real_dir)) if os.path.exists(real_dir) else 0
    fake_count = len(_list_images(fake_dir)) if os.path.exists(fake_dir) else 0

    return {
        'total': real_count + fake_count,
        'real': real_count,
        'fake': fake_count,
        'path': TRAINING_DATASET_PATH,
        'exists': os.path.exists(TRAINING_DATASET_PATH),
    }


def _list_images(directory):
    """List all image files in a directory"""
    if not os.path.exists(directory):
        return []

    extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    images = []
    for f in os.listdir(directory):
        if Path(f).suffix.lower() in extensions:
            images.append(os.path.join(directory, f))
    return images


def build_dataset(max_samples=None):
    """
    Build a HuggingFace Dataset from the training_dataset directory.

    Args:
        max_samples: Optional max samples per class for balanced training

    Returns:
        Dataset object or None if insufficient data
    """
    try:
        from datasets import Dataset, Features, Value, Image as HFImage

        real_dir = os.path.join(TRAINING_DATASET_PATH, 'real')
        fake_dir = os.path.join(TRAINING_DATASET_PATH, 'fake')

        real_images = _list_images(real_dir)
        fake_images = _list_images(fake_dir)

        if len(real_images) < 5 or len(fake_images) < 5:
            logger.warning(
                f'[DATASET] Insufficient data: {len(real_images)} real, {len(fake_images)} fake (need >= 5 each)'
            )
            return None

        # Balance classes
        if max_samples:
            real_images = real_images[:max_samples]
            fake_images = fake_images[:max_samples]
        else:
            min_count = min(len(real_images), len(fake_images))
            real_images = real_images[:min_count]
            fake_images = fake_images[:min_count]

        # Build dataset
        all_paths = fake_images + real_images
        # label 0 = fake, label 1 = real (matches original model)
        all_labels = [0] * len(fake_images) + [1] * len(real_images)

        # Validate images can be opened
        valid_paths = []
        valid_labels = []
        for p, label in zip(all_paths, all_labels):
            try:
                img = Image.open(p)
                img.verify()
                valid_paths.append(p)
                valid_labels.append(label)
            except Exception:
                logger.warning(f'[DATASET] Skipping corrupt image: {p}')

        if len(valid_paths) < 10:
            logger.warning(f'[DATASET] Too few valid images: {len(valid_paths)}')
            return None

        dataset = Dataset.from_dict({
            'image': valid_paths,
            'label': valid_labels,
        })

        # Cast image column to Image type for automatic loading
        dataset = dataset.cast_column('image', HFImage())

        logger.info(
            f'[DATASET] Built dataset: {len(valid_paths)} samples '
            f'({valid_labels.count(0)} fake, {valid_labels.count(1)} real)'
        )

        return dataset

    except ImportError:
        logger.error('[DATASET] datasets library not installed')
        return None
    except Exception as e:
        logger.error(f'[DATASET] Failed to build dataset: {str(e)}', exc_info=True)
        return None


def build_train_val_split(val_ratio=0.2):
    """
    Build training and validation datasets.

    Args:
        val_ratio: Fraction of data for validation

    Returns:
        (train_dataset, val_dataset) or (None, None) if insufficient data
    """
    dataset = build_dataset()
    if dataset is None:
        return None, None

    split = dataset.train_test_split(test_size=val_ratio, seed=42, stratify_by_column='label')
    train_dataset = split['train']
    val_dataset = split['test']

    logger.info(f'[DATASET] Split: {len(train_dataset)} train, {len(val_dataset)} val')

    return train_dataset, val_dataset
