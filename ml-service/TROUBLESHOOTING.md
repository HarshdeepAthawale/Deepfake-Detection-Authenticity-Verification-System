# ML Service Troubleshooting Guide

## Common Issues and Solutions

### Issue: Model Not Loading / Predictions Always 0%

**Symptoms:**
- All predictions return ~0% fake probability
- Logs show: `Fake probabilities: [4.6663553e-38]` or similar near-zero values
- Risk score is always 0

**Cause:**
Model weights file is missing or corrupted.

**Solution:**
1. Download the model weights:
   ```bash
   cd ml-service
   python3 download_model.py --verify
   ```

2. Verify the file exists and is the correct size (~17MB):
   ```bash
   ls -lh efficientnet_b0_ffpp_c23/efficientnet_b0_ffpp_c23.pth
   ```

3. Restart the ML service:
   ```bash
   docker-compose restart ml-service
   ```

---

### Issue: PyTorch Load Error - "weights_only" Warning

**Symptoms:**
```
WeightsUnpickler error: unsupported persistent id encountered
```

**Cause:**
PyTorch 2.6+ changed the default `weights_only` parameter to `True`.

**Solution:**
This has been fixed in the updated `model_loader.py`. Make sure you're using the latest version.

---

### Issue: Model File Not Found

**Symptoms:**
```
FileNotFoundError: Model directory not found
```

**Cause:**
Model directory doesn't exist or is in the wrong location.

**Solution:**
1. Ensure you're in the `ml-service` directory
2. Run the download script:
   ```bash
   python3 download_model.py
   ```

---

### Issue: ML Service Returns 503 (Service Unavailable)

**Symptoms:**
- Health check shows: `"status": "unhealthy"`
- Backend logs show: `ML service is not available`

**Cause:**
Model failed to load on startup.

**Solution:**
1. Check ML service logs:
   ```bash
   docker logs deepfake-ml-service
   ```

2. Look for errors in the model loading section

3. Download/re-download the model:
   ```bash
   docker exec -it deepfake-ml-service python3 download_model.py --force --verify
   ```

4. Restart the service:
   ```bash
   docker-compose restart ml-service
   ```

---

## Verification Steps

### 1. Check ML Service Health

```bash
curl http://localhost:5001/health | jq .
```

**Expected output:**
```json
{
  "model_status": "loaded",
  "service": "deepfake-detection-ml-service",
  "status": "healthy",
  "using_fallback": false,
  "version": "1.0.0"
}
```

### 2. Verify Model File

```bash
ls -lh ml-service/efficientnet_b0_ffpp_c23/efficientnet_b0_ffpp_c23.pth
```

**Expected output:**
```
-rw-r--r-- 1 user user 17M Jan 26 04:20 efficientnet_b0_ffpp_c23.pth
```

File should be approximately **17MB** (not 56KB).

### 3. Test Model Loading

```bash
cd ml-service
python3 -c "from model_loader import load_model; model = load_model(); print('✓ Model loaded successfully')"
```

### 4. Check Predictions Are Reasonable

After uploading a test image, check the logs:

```bash
docker logs deepfake-ml-service --tail 20
```

**Good predictions** (varied probabilities):
```
Sample predictions: [[0.73, 0.27]]
Fake probabilities: [0.27]
risk_score=27.5
```

**Bad predictions** (always 0 or 100):
```
Sample predictions: [[1.0, 4.67e-38]]
Fake probabilities: [4.67e-38]
risk_score=0.0
```

---

## Manual Model Download

If the automatic download script fails, you can manually download the model:

1. Download from Hugging Face:
   ```bash
   wget https://huggingface.co/Xicor9/efficientnet-b0-ffpp-c23/resolve/main/efficientnet_b0_ffpp_c23.pth \
     -O ml-service/efficientnet_b0_ffpp_c23/efficientnet_b0_ffpp_c23.pth
   ```

2. Or using curl:
   ```bash
   curl -L https://huggingface.co/Xicor9/efficientnet-b0-ffpp-c23/resolve/main/efficientnet_b0_ffpp_c23.pth \
     -o ml-service/efficientnet_b0_ffpp_c23/efficientnet_b0_ffpp_c23.pth
   ```

3. Verify the download:
   ```bash
   ls -lh ml-service/efficientnet_b0_ffpp_c23/efficientnet_b0_ffpp_c23.pth
   ```

---

## Docker-Specific Issues

### Model Not Persisting After Container Restart

**Cause:**
Model directory is not mounted as a volume.

**Solution:**
Check `docker-compose.yml` has the volume mounted:
```yaml
ml-service:
  volumes:
    - ./ml-service:/app
```

### Permission Issues in Docker

**Symptoms:**
```
PermissionError: [Errno 13] Permission denied
```

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER ml-service/efficientnet_b0_ffpp_c23/

# Or run download inside container
docker exec -it deepfake-ml-service python3 download_model.py
```

---

## Performance Issues

### Inference Too Slow

**Symptoms:**
- Inference time > 1000ms per image
- Timeout errors

**Solutions:**

1. **Use GPU if available:**
   - Check if CUDA is available: `python3 -c "import torch; print(torch.cuda.is_available())"`
   - Update `docker-compose.yml` to enable GPU support

2. **Reduce number of frames for videos:**
   - Current default: 30 frames max
   - Edit `app.py` line 222 to reduce: `max_frames = 10`

3. **Increase timeout in backend:**
   - Edit backend `.env`: `ML_SERVICE_TIMEOUT=60000` (60 seconds)

---

## Getting Help

If you're still experiencing issues:

1. **Collect logs:**
   ```bash
   docker logs deepfake-ml-service > ml-service-logs.txt
   docker logs deepfake-backend > backend-logs.txt
   ```

2. **Check model info:**
   ```bash
   python3 download_model.py --verify
   ```

3. **Test direct inference:**
   ```bash
   curl -X POST http://localhost:5001/api/v1/inference \
     -H "Content-Type: application/json" \
     -d '{"hash":"test","mediaType":"IMAGE","extractedFrames":["/path/to/test/image.jpg"]}'
   ```

---

## Model Information

- **Model:** EfficientNet-B0
- **Training Dataset:** FaceForensics++ (FF++) C23
- **Classes:** 0 = Real, 1 = Fake
- **Input Size:** 224x224 RGB images
- **Expected Accuracy:** ~85% (frame-level), ~88% (video-level)
- **Model Size:** ~17MB
- **Source:** [Hugging Face - Xicor9/efficientnet-b0-ffpp-c23](https://huggingface.co/Xicor9/efficientnet-b0-ffpp-c23)
