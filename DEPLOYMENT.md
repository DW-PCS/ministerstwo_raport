# Deployment Instructions

## Update application on server

### Step 1 — Build new Docker image (laptop, PowerShell)

To run this comand you will need doker desktop open.

```powershell
doppler run --project ministerstwo --config prd_daniel -- docker build `
  --build-arg NEXT_PUBLIC_AZURE_AD_CLIENT_ID=$(doppler secrets get NEXT_PUBLIC_AZURE_AD_CLIENT_ID --plain --project ministerstwo --config prd_daniel) `
  --build-arg NEXT_PUBLIC_AZURE_AD_SCOPE=$(doppler secrets get NEXT_PUBLIC_AZURE_AD_SCOPE --plain --project ministerstwo --config prd_daniel) `
  --build-arg NEXT_PUBLIC_AZURE_AD_ENDPOINT=$(doppler secrets get NEXT_PUBLIC_AZURE_AD_ENDPOINT --plain --project ministerstwo --config prd_daniel) `
  --build-arg NEXT_PUBLIC_AZURE_AD_TENANT_ID=$(doppler secrets get NEXT_PUBLIC_AZURE_AD_TENANT_ID --plain --project ministerstwo --config prd_daniel) `
  --build-arg NEXT_PUBLIC_APP_URL=$(doppler secrets get NEXT_PUBLIC_APP_URL --plain --project ministerstwo --config prd_daniel) `
  --build-arg NEXT_PUBLIC_ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX=$(doppler secrets get NEXT_PUBLIC_ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX --plain --project ministerstwo --config prd_daniel) `
  -t thewicha/ministerstwo-app:latest .
```

### Step 2 — Push to Docker Hub (laptop, PowerShell)

```powershell
docker push thewicha/ministerstwo-app:latest
```

### Step 3 — Deploy on server (SSH)

```bash
ssh daniel@74.248.33.80
```

```bash
docker compose down && docker pull thewicha/ministerstwo-app:latest && doppler run --project ministerstwo --config prd_daniel -- docker compose up -d
```

### Step 4 — Verify

```bash
docker compose ps
docker compose logs -f
```

App runs at: http://74.248.33.80:3000 || https://raportymi.polskipcs.pl/

---

## Secrets management (doppler.com)

- `NEXTAUTH_SECRET` — NextAuth secret key
- `NEXTAUTH_URL` — public URL of the app
- `NEXT_PUBLIC_ENABLE_MONTHLY_SECTIONS_IN_PDF_AND_DOCX` — `true` adds monthly sections to PDF and Word exports

To update secrets: log in to doppler.com → project → production environment.
No changes needed on the server after updating secrets — restart container:

```bash
doppler run --project ministerstwo --config prd_daniel -- docker compose up -d
```
