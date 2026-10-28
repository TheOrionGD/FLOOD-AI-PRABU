# FloodAI Local Development & Setup Guide

This guide covers getting the FloodAI platform running locally for development and testing.

## Prerequisites
- **Node.js**: >= 18.x (v20 LTS recommended)
- **Python**: >= 3.9 (v3.10 recommended)
- **MongoDB**: Local MongoDB instance (v6.0+) or MongoDB Atlas cluster connection string
- **Git**: Installed and configured

---

## 1. Clone the Repository
```bash
git clone https://github.com/your-org/flood-ai-project.git
cd flood-ai-project
```

---

## 2. Environment Configuration
FloodAI uses strict environment configuration. Copy the example templates:

```bash
# 1. Root configuration (optional for system orchestration)
cp .env.example .env

# 2. Backend configuration
cp backend/.env.example backend/.env

# 3. ML Service configuration
cp ml_model/.env.example ml_model/.env
```

Edit `backend/.env` with your values:
- `MONGODB_URI`: Connection string to your MongoDB instance.
- `JWT_SECRET`: Random string of at least 32 characters.
- `OPENWEATHER_API_KEY`: (Optional) Free API key from openweathermap.org.

Edit `ml_model/.env`:
- `GROQ_API_KEY`: (Optional) API key from console.groq.com.

---

## 3. Install Dependencies

### Backend (Node.js)
```bash
cd backend
npm install
cd ..
```

### ML Microservice (Python)
```bash
cd ml_model
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

---

## 4. Launch Services

You can launch all services using the provided launcher scripts or individually.

### Option A: Windows Quick Launcher
```cmd
run_system.bat
```
To shut down all services:
```cmd
stop_system.bat
```

### Option B: Manual Service Launch

1. **Start ML Microservice** (Terminal 1):
   ```bash
   cd ml_model
   python predict_api.py
   # Listening on http://localhost:8000
   ```

2. **Start Backend API** (Terminal 2):
   ```bash
   cd backend
   npm run dev
   # Listening on http://localhost:5000
   ```

3. **Start Frontend Client** (Terminal 3):
   ```bash
   cd frontend
   # Using Python simple HTTP server:
   python -m http.server 3000
   # Or using npx serve:
   npx serve -l 3000
   ```

Open your browser to: **`http://localhost:3000`**

---

## 5. Running Automated Verification Suites

Execute tests from the repository root:

```bash
# Verify secret management & git hygiene
node scripts/validation/validate_secrets.js

# Verify atmospheric climate engine & resolver
node test_climate_engine.js

# Verify 12 background assets & crossfade service
node test_climate_backgrounds.js

# Verify light/dark theme particle physics
node test_light_theme_particles.js

# Verify responsive role navigation & Command Palette
node test_responsive_role_nav.js
```
