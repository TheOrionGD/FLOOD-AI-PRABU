# FloodAI Environment Variables Reference

FloodAI strictly manages all sensitive configurations via environment variables. Populated secrets must **never** be committed to the repository.

---

## 1. Backend Configuration (`backend/.env`)

| Variable | Type | Required? | Default / Example | Description |
|---|---|---|---|---|
| `PORT` | Integer | Optional | `5000` | Port for the Express backend server |
| `NODE_ENV` | String | Optional | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGODB_URI` | String | **Required in Prod** | `mongodb://127.0.0.1:27017/floodai` | MongoDB connection URI (Atlas or Local) |
| `JWT_SECRET` | String | **Required in Prod** | (Generated in dev) | Cryptographic signing secret for user tokens (>= 32 chars) |
| `JWT_EXPIRES_IN` | String | Optional | `7d` | JWT session validity duration |
| `CORS_ORIGIN` | String | Optional | `*` | Allowed CORS origins (comma-separated for multi-domain) |
| `ML_SERVICE_URL` | String | Optional | `http://127.0.0.1:8000` | URL of the internal Python ML prediction microservice |
| `INTERNAL_SERVICE_SECRET` | String | Optional | `""` | Service-to-service cryptographic shared key |
| `OPENWEATHER_API_KEY` | String | Optional | `""` | OpenWeather API key for real-time atmospheric telemetry |
| `BREVO_API_KEY` | String | Optional | `""` | Brevo (Sendinblue) API key for emergency email broadcasts |
| `TWILIO_ACCOUNT_SID` | String | Optional | `""` | Twilio Account SID for SMS alerts |
| `TWILIO_AUTH_TOKEN` | String | Optional | `""` | Twilio Auth Token for SMS alerts |
| `TWILIO_PHONE_NUMBER` | String | Optional | `""` | Registered Twilio sender phone number |
| `VAPID_PUBLIC_KEY` | String | Optional | `""` | Web Push VAPID public application server key |
| `VAPID_PRIVATE_KEY` | String | Optional | `""` | Web Push VAPID private signing key |

---

## 2. ML Microservice Configuration (`ml_model/.env`)

| Variable | Type | Required? | Default / Example | Description |
|---|---|---|---|---|
| `PORT` / `ML_PORT` | Integer | Optional | `8000` | Port for the Python Flask ML service |
| `ML_HOST` | String | Optional | `0.0.0.0` | Network binding interface |
| `ML_DEBUG` | Boolean | Optional | `false` | Enable Flask debug reloader |
| `GROQ_API_KEY` | String | Optional | `""` | Groq AI API key for LLM-powered civil defense synthesis |
| `INTERNAL_SERVICE_SECRET` | String | Optional | `""` | Shared key matching backend for service authorization |
| `STRICT_INTERNAL_AUTH` | Boolean | Optional | `false` | When true, rejects local requests without a valid internal key |
| `ALLOWED_ORIGINS` | String | Optional | `*` | Allowed cross-origin callers |

---

## 3. Frontend Client Configuration (`frontend/.env.example`)

The frontend operates in the browser and should **only** contain client-safe public keys.

| Variable | Type | Description |
|---|---|---|
| `API_BASE_URL` | String | Base URL pointing to the backend API (`/api` or `https://api.yourdomain.com/api`) |
| `ML_SERVICE_URL` | String | Base URL of the ML microservice if queried directly |
| `FIREBASE_VAPID_KEY` | String | Public VAPID key for browser push notification registration |

---

## 4. Secret Security Rules

1. **Never Commit Populated `.env`**: Always verify `git status` shows `.env` is untracked.
2. **Template Maintenance**: When adding a new variable, add a placeholder entry to `.env.example` and `backend/.env.example`.
3. **Fail-Fast Validation**: The backend config loader (`backend/config/env.js`) automatically validates critical parameters upon startup and throws if required values are missing in production.
4. **No Secrets in Logs**: Configuration loaders and logger middlewares must never print the raw values of tokens, keys, or passwords.
