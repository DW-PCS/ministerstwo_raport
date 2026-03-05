# Deployment Instructions

## Update application on server

### Step 1 — Build new Docker image (laptop, PowerShell)

```powershell
docker build --build-arg NEXT_PUBLIC_AZURE_AD_CLIENT_ID=3af57c76-7425-4946-a2ce-f3bd2930c21d --build-arg NEXT_PUBLIC_AZURE_AD_SCOPE="api://3af57c76-7425-4946-a2ce-f3bd2930c21d/access_as_user" --build-arg NEXT_PUBLIC_AZURE_AD_ENDPOINT="https://login.microsoftonline.com/common/oauth2/v2.0/token" --build-arg NEXT_PUBLIC_AZURE_AD_TENANT_ID=common --build-arg NEXT_PUBLIC_APP_URL=http://74.248.33.80:3000 -t thewicha/ministerstwo-app:latest .
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
docker compose down && docker pull thewicha/ministerstwo-app:latest && doppler run -- docker compose up -d
```

### Step 4 — Verify

```bash
docker compose ps
docker compose logs -f
```

App runs at: http://74.248.33.80:3000

---

## Secrets management (doppler.com)

- `NEXTAUTH_SECRET` — NextAuth secret key
- `NEXTAUTH_URL` — public URL of the app

To update secrets: log in to doppler.com → project → production environment.
No changes needed on the server after updating secrets — restart container:

```bash
doppler run -- docker compose up -d
```
