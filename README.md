# URL Signer

## Description

Google Cloud Function to generate upload URL to Google Cloud Storage.

## Customization

1. Copy `.env.template` into `.env`.
2. Specify environment variables that suits your needs :
   1. CORS_DOMAINS, comma-separated list of allowed CORS domains
   2. BUCKET_NAME, the name of your GCS bucket
