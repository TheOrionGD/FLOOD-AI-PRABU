# FloodAI Security Policy & Threat Defense

## 1. Security Architecture & Threat Defense

FloodAI handles mission-critical civil defense telemetry, emergency sirens, and risk assessments. Security is integrated at every architectural boundary.

```
[ Browser / Citizen ]
       │  (HTTPS / TLS 1.3 + WSS)
       ▼
[ Cloudflare / Reverse Proxy ] ── WAF & DDoS Shield
       │
       ▼
[ Express API Backend ] ──────── Helmet Security Headers, Strict CORS, Rate Limiting
       │
       ├──► [ JWT RBAC Guard ] ── User / Resident / Analyst / Admin Tier Isolation
       │
       ├──► [ MongoDB Atlas ] ─── Encrypted at Rest & in Transit (TLS), SCRAM-SHA-256
       │
       ▼  (Internal Service Secret Auth)
[ Python ML Microservice ] ───── Sandboxed XGBoost / Random Forest Inference
```

---

## 2. Zero-Secret Policy

- **No Secrets in Source Control**: No `.env`, `atlas-credentials.env`, `FIREBASE.JSON`, or private keys are ever committed to tracked Git trees.
- **Fail-Fast Validation**: Centralized loaders (`backend/config/env.js`, `ml_model/config.py`) validate environment variables at startup and abort safely if production credentials are missing.
- **Automated Scanning**: The `.github/workflows/security.yml` pipeline runs `validate_secrets.js` and `gitleaks` on every push and pull request.

---

## 3. Role-Based Access Control (RBAC) Hierarchy

The platform strictly isolates capabilities according to verified credentials:

| Persona | Permitted Capabilities | Restricted Screens |
|---|---|---|
| **Resident** (`resident`, `user`) | Local flood risk, precipitation telemetry, civil advisories, preparedness handbook, saved locations, emergency SOS receiver | Cannot view or access Admin or Analyst operational screens |
| **Analyst** (`analyst`) | Dual ML simulation lab, SHAP tree explainers, district risk comparison matrix, model evaluation logs, threat intelligence | Cannot access administrative user management or platform config |
| **Admin** (`admin`) | Full platform access, sensor health telemetry, user directory & session revocation, alert broadcast dispatches, compliance audit logs | None |

---

## 4. Reporting a Vulnerability

If you discover a security vulnerability within the FloodAI platform, please review our [SECURITY.md](../SECURITY.md) for responsible disclosure instructions. Do not file public GitHub issues for security vulnerabilities.
