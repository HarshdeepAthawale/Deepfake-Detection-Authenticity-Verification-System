#!/bin/bash

# ML Model Upload to AWS S3
# This script packages and uploads the ML model to S3

set -e

echo "=========================================="
echo "  ML Model S3 Upload Script"
echo "=========================================="
echo ""

# Configuration
BUCKET_NAME="deepfake-ml-models"
MODEL_DIR="ml-service/efficientnet_b0_ffpp_c23"
ARCHIVE_NAME="efficientnet_b0_ffpp_c23.tar.gz"
S3_PATH="s3://${BUCKET_NAME}/${ARCHIVE_NAME}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it with: sudo apt install awscli"
    echo "Or: pip install awscli"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (e.g., us-east-1)"
    exit 1
fi

echo -e "${BLUE}[1/5]${NC} Checking model directory..."
if [ ! -d "$MODEL_DIR" ]; then
    echo -e "${RED}Error: Model directory not found: $MODEL_DIR${NC}"
    exit 1
fi

MODEL_SIZE=$(du -sh "$MODEL_DIR" | cut -f1)
echo -e "${GREEN}✓ Model directory found (Size: $MODEL_SIZE)${NC}"
echo ""

echo -e "${BLUE}[2/5]${NC} Creating S3 bucket (if not exists)..."
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://${BUCKET_NAME}" --region us-east-1
    echo -e "${GREEN}✓ Bucket created: ${BUCKET_NAME}${NC}"
else
    echo -e "${GREEN}✓ Bucket already exists: ${BUCKET_NAME}${NC}"
fi
echo ""

echo -e "${BLUE}[3/5]${NC} Compressing model files..."
echo -e "${YELLOW}This may take a few minutes...${NC}"
cd ml-service
tar -czf "../${ARCHIVE_NAME}" efficientnet_b0_ffpp_c23/
cd ..
ARCHIVE_SIZE=$(du -sh "$ARCHIVE_NAME" | cut -f1)
echo -e "${GREEN}✓ Archive created: ${ARCHIVE_NAME} (${ARCHIVE_SIZE})${NC}"
echo ""

echo -e "${BLUE}[4/5]${NC} Uploading to S3..."
echo -e "${YELLOW}This may take several minutes depending on your connection...${NC}"
aws s3 cp "$ARCHIVE_NAME" "$S3_PATH" --storage-class STANDARD_IA

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Upload successful!${NC}"
else
    echo -e "${RED}Error: Upload failed${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}[5/5]${NC} Making file publicly readable..."
aws s3api put-object-acl --bucket "$BUCKET_NAME" --key "$ARCHIVE_NAME" --acl public-read
echo -e "${GREEN}✓ File is now publicly accessible${NC}"
echo ""

# Generate public URL
REGION=$(aws configure get region || echo "us-east-1")
PUBLIC_URL="https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${ARCHIVE_NAME}"

echo -e "${GREEN}=========================================="
echo "  Upload Complete!"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}Public URL:${NC}"
echo "$PUBLIC_URL"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Copy the URL above"
echo "2. Update ml-service/Dockerfile with this URL"
echo "3. Deploy to Render"
echo ""

# Clean up local archive
echo -e "${YELLOW}Cleaning up local archive...${NC}"
rm -f "$ARCHIVE_NAME"
echo -e "${GREEN}✓ Done!${NC}"
