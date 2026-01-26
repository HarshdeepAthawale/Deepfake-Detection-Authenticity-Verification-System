FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install wget for downloading model
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download and extract model from S3
RUN wget -O model.tar.gz "https://deepfake-ml-models.s3.ap-south-1.amazonaws.com/efficientnet_b0_ffpp_c23.tar.gz" && \
    tar -xzf model.tar.gz && \
    rm model.tar.gz

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
