"""
train_model.py
---------------
Trains a Random Forest classifier on flood_dataset.csv to predict
`flood_occurred`, then reports accuracy, precision, recall, F1,
confusion matrix and feature importances. Saves the trained model
as flood_model.pkl for the Flask serving API (predict_api.py).
"""

import pandas as pd
import numpy as np
import pickle
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report
)

df = pd.read_csv("../dataset/flood_dataset.csv")

FEATURES = [
    "rainfall_mm", "river_level_m", "sea_level_m", "temperature_c",
    "humidity_pct", "wind_speed_kmh", "soil_moisture_pct",
    "reservoir_level_pct", "elevation_m", "distance_from_coast_km",
    "population_density", "forest_cover_pct", "cyclone", "drainage_score",
]
TARGET = "flood_occurred"

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=300, max_depth=12, min_samples_leaf=3,
    class_weight="balanced", random_state=42, n_jobs=-1
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred)
rec = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)
cm = confusion_matrix(y_test, y_pred)

importances = sorted(
    zip(FEATURES, model.feature_importances_), key=lambda x: -x[1]
)

print("=" * 55)
print("MODEL EVALUATION -- RandomForestClassifier (n=300 trees)")
print("=" * 55)
print(f"Accuracy  : {acc:.4f}")
print(f"Precision : {prec:.4f}")
print(f"Recall    : {rec:.4f}")
print(f"F1 Score  : {f1:.4f}")
print(f"ROC-AUC   : {auc:.4f}")
print("\nConfusion Matrix [ [TN FP] [FN TP] ]:")
print(cm)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["No Flood", "Flood"]))
print("\nTop Feature Importances:")
for feat, imp in importances:
    print(f"  {feat:<25s} {imp:.4f}")

# Save model
with open("flood_model.pkl", "wb") as f:
    pickle.dump(model, f)

# Save metrics + importances as JSON for the frontend dashboard to display
metrics = {
    "accuracy": round(acc, 4),
    "precision": round(prec, 4),
    "recall": round(rec, 4),
    "f1_score": round(f1, 4),
    "roc_auc": round(auc, 4),
    "confusion_matrix": cm.tolist(),
    "feature_importances": [{"feature": f, "importance": round(float(i), 4)} for f, i in importances],
    "training_rows": len(X_train),
    "test_rows": len(X_test),
}
with open("model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("\nSaved -> flood_model.pkl, model_metrics.json")
