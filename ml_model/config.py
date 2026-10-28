"""
ml_model/config.py
Centralized, validated configuration loader for FloodAI ML Microservice.
Loads environment variables safely without hardcoded secret fallbacks.
"""

import os
from pathlib import Path

# Attempt to load .env from current directory or project root
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        root_env = Path(__file__).resolve().parent.parent / ".env"
        if root_env.exists():
            load_dotenv(dotenv_path=root_env)
except ImportError:
    pass

class MLConfig:
    """Centralized configuration object for the ML prediction microservice."""
    
    BASE_DIR = Path(__file__).resolve().parent
    PORT = int(os.environ.get("ML_PORT") or os.environ.get("PORT") or 8000)
    HOST = os.environ.get("ML_HOST", "0.0.0.0")
    DEBUG = os.environ.get("ML_DEBUG", "false").lower() in ("true", "1")
    
    # AI Threat Intel
    GROQ_API_KEY = (
        os.environ.get("GROQ_API_KEY")
        or os.environ.get("GROQ_API_KEY2")
        or ""
    )
    GROQ_MODELS = [
        "qwen/qwen-2.5-72b-instruct",
        "llama-3.3-70b-versatile",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b"
    ]
    
    # Internal Service Authentication Key
    INTERNAL_SERVICE_KEY = (
        os.environ.get("INTERNAL_SERVICE_SECRET")
        or os.environ.get("INTERNAL_SERVICE_KEY")
        or ""
    )
    STRICT_INTERNAL_AUTH = os.environ.get("STRICT_INTERNAL_AUTH", "false").lower() in ("true", "1")
    
    # CORS
    ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

config = MLConfig()
