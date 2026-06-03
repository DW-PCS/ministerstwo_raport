# Deployment Instructions

## Prerequisites (macOS)

- Docker Desktop is running
- Doppler CLI is installed
- Doppler CLI is authenticated (`doppler login`)
- Doppler project/config is selected (`doppler setup --project ministerstwo --config prd_daniel`)
- Docker Hub login is active (`docker login`)

## Step 1 — Build and push image (macOS)

```bash
doppler run --project ministerstwo --config prd_daniel -- sh -c '
docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_AZURE_AD_CLIENT_ID="$NEXT_PUBLIC_AZURE_AD_CLIENT_ID" \
  --build-arg NEXT_PUBLIC_AZURE_AD_SCOPE="$NEXT_PUBLIC_AZURE_AD_SCOPE" \
  --build-arg NEXT_PUBLIC_AZURE_AD_ENDPOINT="$NEXT_PUBLIC_AZURE_AD_ENDPOINT" \
  --build-arg NEXT_PUBLIC_AZURE_AD_TENANT_ID="$NEXT_PUBLIC_AZURE_AD_TENANT_ID" \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  --build-arg NEXT_PUBLIC_ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX="$NEXT_PUBLIC_ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX" \
  -t thewicha/ministerstwo-app:latest \
  --push \
  .
'
```

## Step 2 — Deploy on server

```bash
ssh daniel@74.248.33.80
```

```bash
docker pull thewicha/ministerstwo-app:latest && doppler run --project ministerstwo --config prd_daniel -- sh -c 'docker compose down && docker compose up -d'
```

## Step 3 — Verify

```bash
doppler run --project ministerstwo --config prd_daniel -- docker compose ps
doppler run --project ministerstwo --config prd_daniel -- docker compose logs -f
curl -I http://localhost:3000
```

## Public URL

```bash
curl -I https://raportymi.polskipcs.pl/
```
