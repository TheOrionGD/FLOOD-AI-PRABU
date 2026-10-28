# FloodAI Production Deployment Guide

This guide details deploying the FloodAI architecture across cloud platforms (Render, Docker, Kubernetes, or self-hosted VMs).

---

## 1. Cloud Architecture on Render (`render.yaml`)

FloodAI includes a native multi-service deployment blueprint configured in `render.yaml`:

- **`floodai-backend`**: Node.js Web Service on port 5000
- **`floodai-ml`**: Python 3.10 Web Service on port 8000
- **`floodai-frontend`**: Static Site serving `frontend/`

### Deploying via Render:
1. Connect your GitHub repository to Render.
2. Select **New > Blueprint**.
3. Choose this repository; Render will automatically detect `render.yaml`.
4. Populate your secret environment variables in the Render Dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GROQ_API_KEY`
   - `OPENWEATHER_API_KEY`

---

## 2. Docker Multi-Stage Deployment

### Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
USER node
EXPOSE 5000
CMD ["node", "server.js"]
```

### ML Microservice Dockerfile (`ml_model/Dockerfile`)
```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "predict_api.py"]
```

---

## 3. Production Hardening Checklist

1. **Strict Secret Management**: Ensure secrets are injected exclusively via environment variables or secret vaults (AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).
2. **Reverse Proxy & SSL/TLS**: Deploy behind Cloudflare, NGINX, or Caddy with automated HTTPS and HSTS enabled.
3. **Database Security**: Ensure MongoDB Atlas IP Access List restricts traffic to your backend application instances.
4. **Rate Limiting**: Backend includes `express-rate-limit` protecting `/api/auth/*` and `/api/disaster/predict`.
5. **CORS Isolation**: Configure `CORS_ORIGIN` with your exact frontend production domain instead of `*`.
