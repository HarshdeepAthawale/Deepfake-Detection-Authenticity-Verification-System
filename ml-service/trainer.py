"""
Trainer Module
Background-thread fine-tuning with HuggingFace Trainer + hot-swap
"""

import os
import time
import threading
import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

CHECKPOINT_DIR = os.environ.get('CHECKPOINT_DIR', '/app/checkpoints')
CALLBACK_URL = os.environ.get('TRAINING_CALLBACK_URL', 'http://backend:3001/api/admin/learning/training-complete')

# Training state
_training_lock = threading.Lock()
_training_status = {
    'is_training': False,
    'progress': 0,
    'epoch': 0,
    'total_epochs': 2,
    'status': 'idle',
    'started_at': None,
    'error': None,
    'version': None,
}


def get_training_status():
    """Get current training status"""
    with _training_lock:
        return dict(_training_status)


def _update_status(**kwargs):
    """Thread-safe status update"""
    with _training_lock:
        _training_status.update(kwargs)


def start_training():
    """
    Start model fine-tuning in a background thread.
    Returns immediately with status.
    """
    with _training_lock:
        if _training_status['is_training']:
            return {'status': 'already_training', 'message': 'Training already in progress'}

    version = f'ft-{datetime.utcnow().strftime("%Y%m%d-%H%M%S")}'
    _update_status(
        is_training=True,
        progress=0,
        epoch=0,
        status='starting',
        started_at=datetime.utcnow().isoformat(),
        error=None,
        version=version,
    )

    thread = threading.Thread(target=_training_loop, args=(version,), daemon=True)
    thread.start()

    return {'status': 'started', 'version': version}


def _training_loop(version):
    """Background training loop"""
    try:
        from dataset_builder import build_train_val_split, get_dataset_stats
        from model_loader import get_pipeline, hot_swap_model, LOCAL_MODEL_PATH

        _update_status(status='building_dataset', progress=5)

        # Check dataset
        stats = get_dataset_stats()
        logger.info(f'[TRAINER] Dataset stats: {stats}')

        if stats['total'] < 10:
            raise ValueError(f'Insufficient training data: {stats["total"]} samples (need >= 10)')

        # Build train/val split
        train_dataset, val_dataset = build_train_val_split(val_ratio=0.2)
        if train_dataset is None:
            raise ValueError('Failed to build training dataset')

        _update_status(status='preparing_model', progress=10)

        # Import training dependencies
        import torch
        from transformers import (
            AutoModelForImageClassification,
            AutoImageProcessor,
            TrainingArguments,
            Trainer,
            EarlyStoppingCallback,
        )
        from sklearn.metrics import accuracy_score
        import numpy as np

        # Load current model for fine-tuning
        model_path = LOCAL_MODEL_PATH if os.path.exists(LOCAL_MODEL_PATH) else 'prithivMLmods/deepfake-detector-model-v1'
        processor = AutoImageProcessor.from_pretrained(model_path)
        model = AutoModelForImageClassification.from_pretrained(model_path)

        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model.to(device)

        # Preprocess datasets
        def transform(batch):
            inputs = processor(batch['image'], return_tensors='pt')
            inputs['labels'] = batch['label']
            return inputs

        train_dataset = train_dataset.with_transform(transform)
        val_dataset = val_dataset.with_transform(transform)

        # Training arguments - conservative fine-tuning
        output_dir = os.path.join(CHECKPOINT_DIR, version)
        os.makedirs(output_dir, exist_ok=True)

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=2,
            per_device_train_batch_size=8,
            per_device_eval_batch_size=8,
            learning_rate=2e-7,
            weight_decay=0.01,
            eval_strategy='epoch',
            save_strategy='epoch',
            load_best_model_at_end=True,
            metric_for_best_model='accuracy',
            greater_is_better=True,
            logging_steps=10,
            save_total_limit=2,
            remove_unused_columns=False,
            fp16=torch.cuda.is_available(),
            dataloader_num_workers=0,
        )

        def compute_metrics(eval_pred):
            logits, labels = eval_pred
            predictions = np.argmax(logits, axis=-1)
            acc = accuracy_score(labels, predictions)
            return {'accuracy': acc}

        _update_status(status='training', progress=20)

        class ProgressCallback:
            """Report training progress"""
            def on_epoch_end(self, args, state, control, **kwargs):
                epoch = state.epoch or 0
                total = args.num_train_epochs
                progress = 20 + int((epoch / total) * 60)
                _update_status(epoch=int(epoch), progress=progress)
                logger.info(f'[TRAINER] Epoch {int(epoch)}/{total} complete')

        # Create trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=compute_metrics,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
        )

        # Add progress callback
        trainer.add_callback(ProgressCallback())

        # Train
        train_result = trainer.train()

        _update_status(status='evaluating', progress=85)

        # Evaluate
        eval_result = trainer.evaluate()

        _update_status(status='saving', progress=90)

        # Save best model
        best_model_path = os.path.join(output_dir, 'best')
        trainer.save_model(best_model_path)
        processor.save_pretrained(best_model_path)

        _update_status(status='swapping', progress=95)

        # Hot-swap model
        hot_swap_model(best_model_path)

        metrics = {
            'accuracy': eval_result.get('eval_accuracy', 0),
            'loss': eval_result.get('eval_loss', 0),
            'valAccuracy': eval_result.get('eval_accuracy', 0),
            'valLoss': eval_result.get('eval_loss', 0),
            'epochs': training_args.num_train_epochs,
            'learningRate': training_args.learning_rate,
        }

        _update_status(
            status='completed',
            progress=100,
            is_training=False,
        )

        logger.info(f'[TRAINER] Training complete. Accuracy: {metrics["accuracy"]:.4f}')

        # Callback to Node.js backend
        _notify_backend(version, 'completed', metrics, stats)

    except Exception as e:
        logger.error(f'[TRAINER] Training failed: {str(e)}', exc_info=True)
        _update_status(
            status='failed',
            is_training=False,
            error=str(e),
        )
        _notify_backend(version, 'failed', {}, {}, error=str(e))


def _notify_backend(version, status, metrics, dataset_stats, error=None):
    """Send training result callback to Node.js backend"""
    try:
        payload = {
            'version': version,
            'status': status,
            'metrics': metrics,
            'datasetSize': dataset_stats,
            'error': error,
        }
        headers = {'Content-Type': 'application/json'}
        secret = os.environ.get('TRAINING_CALLBACK_SECRET')
        if secret:
            headers['X-Training-Callback-Secret'] = secret
        response = requests.post(CALLBACK_URL, json=payload, headers=headers, timeout=10)
        logger.info(f'[TRAINER] Backend callback: {response.status_code}')
    except Exception as e:
        logger.warning(f'[TRAINER] Failed to notify backend: {str(e)}')
