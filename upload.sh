#!/bin/bash

# Set S3 credentials
export AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}
export AWS_BUCKET_NAME='notary-session'
export AWS_REGION='eu-west-2'



# Upload file to S3
aws s3 cp "C:/Users/LENOVO/Downloads/video/design_concept-1681538243877.mp4" "s3://${AWS_BUCKET_NAME}/"
# "C:/Users/LENOVO/Downloads/video/design_concept-1681538243877.mp4"
# Get file URL
file_url="https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/output.webm"

# Output file URL
echo "File URL: ${file_url}"


