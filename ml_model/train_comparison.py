"""
train_comparison.py
-------------------
Trains both Random Forest and XGBoost classifiers on flood_dataset.csv,
evaluates both models using stratified holdouts, computes comprehensive metrics
(Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, Confusion Matrix),
fits SHAP TreeExplainer, and saves model artifacts and comparison metrics.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, average_precision_score, classification_report
)
import xgboost as xgb
import shap

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "..", "dataset", "flood_dataset.csv")

FEATURES = [
    "rainfall_mm", "river_level_m", "sea_level_m", "temperature_c",
    "humidity_pct", "wind_speed_kmh", "soil_moisture_pct",
    "reservoir_level_pct", "elevation_m", "distance_from_coast_km",
    "population_density", "forest_cover_pct", "cyclone", "drainage_score",
]
TARGET = "flood_occurred"

print(f"[INFO] Loading dataset from: {DATASET_PATH}")
df = pd.read_csv(DATASET_PATH)

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"[INFO] Dataset split: {len(X_train)} train rows, {len(X_test)} test rows.")

# 1. Random Forest Classifier
print("[INFO] Training Random Forest Classifier (n=300 trees)...")
rf_model = RandomForestClassifier(
    n_estimators=300, max_depth=12, min_samples_leaf=3,
    class_weight="balanced", random_state=42, n_jobs=-1
)
rf_model.fit(X_train, y_train)

rf_pred = rf_model.predict(X_test)
rf_proba = rf_model.predict_proba(X_test)[:, 1]

rf_metrics = {
    "accuracy": round(float(accuracy_score(y_test, rf_pred)), 4),
    "precision": round(float(precision_score(y_test, rf_pred)), 4),
    "recall": round(float(recall_score(y_test, rf_pred)), 4),
    "f1_score": round(float(f1_score(y_test, rf_pred)), 4),
    "roc_auc": round(float(roc_auc_score(y_test, rf_proba)), 4),
    "pr_auc": round(float(average_precision_score(y_test, rf_proba)), 4),
    "confusion_matrix": confusion_matrix(y_test, rf_pred).tolist(),
    "feature_importances": [
        {"feature": f, "importance": round(float(imp), 4)}
        for f, imp in sorted(zip(FEATURES, rf_model.feature_importances_), key=lambda x: -x[1])
    ]
}

# 2. XGBoost Classifier
print("[INFO] Training XGBoost Classifier...")
scale_pos_weight = (len(y_train) - sum(y_train)) / max(sum(y_train), 1)
xgb_model = xgb.XGBClassifier(
    n_estimators=250,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.85,
    colsample_bytree=0.85,
    scale_pos_weight=scale_pos_weight,
    random_state=42,
    eval_metric="logloss"
)
xgb_model.fit(X_train, y_train)

xgb_pred = xgb_model.predict(X_test)
xgb_proba = xgb_model.predict_proba(X_test)[:, 1]

xgb_metrics = {
    "accuracy": round(float(accuracy_score(y_test, xgb_pred)), 4),
    "precision": round(float(precision_score(y_test, xgb_pred)), 4),
    "recall": round(float(recall_score(y_test, xgb_pred)), 4),
    "f1_score": round(float(f1_score(y_test, xgb_pred)), 4),
    "roc_auc": round(float(roc_auc_score(y_test, xgb_proba)), 4),
    "pr_auc": round(float(average_precision_score(y_test, xgb_proba)), 4),
    "confusion_matrix": confusion_matrix(y_test, xgb_pred).tolist(),
    "feature_importances": [
        {"feature": f, "importance": round(float(imp), 4)}
        for f, imp in sorted(zip(FEATURES, xgb_model.feature_importances_), key=lambda x: -x[1])
    ]
}

# 3. SHAP Explainability computation
print("[INFO] Computing SHAP TreeExplainer values on test sample...")
sample_X = X_test.iloc[:200]
explainer_xgb = shap.TreeExplainer(xgb_model)
shap_values = explainer_xgb.shap_values(sample_X)

mean_abs_shap = np.abs(shap_values).mean(axis=0)
shap_importance = [
    {"feature": f, "mean_abs_shap": round(float(val), 4)}
    for f, val in sorted(zip(FEATURES, mean_abs_shap), key=lambda x: -x[1])
]

# 4. Save Artifacts
rf_path = os.path.join(BASE_DIR, "flood_model.pkl")
with open(rf_path, "wb") as f:
    pickle.dump(rf_model, f)
print(f"[SUCCESS] Saved Random Forest -> {rf_path}")

xgb_path = os.path.join(BASE_DIR, "xgboost_model.json")
xgb_model.save_model(xgb_path)
print(f"[SUCCESS] Saved XGBoost Model -> {xgb_path}")

comparison_data = {
    "dataset_info": {
        "total_records": len(df),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "features": FEATURES,
        "split_ratio": "80/20 Stratified"
    },
    "models": {
        "random_forest": {
            "name": "Random Forest Classifier",
            "parameters": "n_estimators=300, max_depth=12, class_weight='balanced'",
            "metrics": rf_metrics
        },
        "xgboost": {
            "name": "XGBoost Classifier",
            "parameters": "n_estimators=250, max_depth=6, lr=0.05, subsample=0.85",
            "metrics": xgb_metrics
        }
    },
    "shap_analysis": {
        "explainer": "TreeExplainer (XGBoost)",
        "expected_value": round(float(explainer_xgb.expected_value), 4) if hasattr(explainer_xgb.expected_value, '__float__') else float(explainer_xgb.expected_value[0]),
        "global_importance": shap_importance
    }
}

comp_path = os.path.join(BASE_DIR, "model_comparison.json")
with open(comp_path, "w") as f:
    json.dump(comparison_data, f, indent=2)
print(f"[SUCCESS] Saved Comparison Data -> {comp_path}")

print("=" * 60)
print("EVALUATION SUMMARY COMPARISON:")
print(f"Metric      | Random Forest | XGBoost")
print(f"Accuracy    | {rf_metrics['accuracy']:.4f}        | {xgb_metrics['accuracy']:.4f}")
print(f"Precision   | {rf_metrics['precision']:.4f}        | {xgb_metrics['precision']:.4f}")
print(f"Recall      | {rf_metrics['recall']:.4f}        | {xgb_metrics['recall']:.4f}")
print(f"F1 Score    | {rf_metrics['f1_score']:.4f}        | {xgb_metrics['f1_score']:.4f}")
print(f"ROC-AUC     | {rf_metrics['roc_auc']:.4f}        | {xgb_metrics['roc_auc']:.4f}")
print(f"PR-AUC      | {rf_metrics['pr_auc']:.4f}        | {xgb_metrics['pr_auc']:.4f}")
print("=" * 60)
