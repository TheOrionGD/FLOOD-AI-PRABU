"""
validate_dataset.py
-------------------
Automated deterministic validation test for the FloodAI historical dataset.
Verifies column schema, null counts, coordinate bounding boxes, physical
hydrological value ranges, and target class balance.
"""

import os
import sys
import pandas as pd
import numpy as np

DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "flood_dataset.csv")

EXPECTED_COLUMNS = [
    "date", "district", "state", "latitude", "longitude",
    "rainfall_mm", "river_level_m", "sea_level_m", "temperature_c",
    "humidity_pct", "wind_speed_kmh", "soil_moisture_pct",
    "reservoir_level_pct", "elevation_m", "distance_from_coast_km",
    "population_density", "forest_cover_pct", "cyclone", "drainage_score",
    "flood_occurred", "flood_severity", "damage_cost_inr",
    "affected_population", "deaths", "rescue_time_hrs", "flood_probability_pct"
]

EXPECTED_DISTRICTS = [
    "Chennai", "Kochi", "Mumbai", "Kolkata", "Guwahati",
    "Patna", "Surat", "Visakhapatnam", "Bhubaneswar", "Hosur"
]

def validate():
    print("=" * 65)
    print("       FLOODAI DATASET VALIDATION & INTEGRITY SUITE")
    print("=" * 65)
    
    if not os.path.exists(DATASET_PATH):
        print(f"[FAIL] Dataset file not found at: {DATASET_PATH}")
        sys.exit(1)
        
    df = pd.read_csv(DATASET_PATH)
    total_rows = len(df)
    print(f"[INFO] Loaded dataset: {total_rows} rows, {len(df.columns)} columns")
    
    errors = []
    
    # 1. Row count check
    if total_rows != 10000:
        errors.append(f"Expected exactly 10,000 rows, found {total_rows}")
        
    # 2. Schema check
    missing_cols = set(EXPECTED_COLUMNS) - set(df.columns)
    if missing_cols:
        errors.append(f"Missing expected columns: {missing_cols}")
        
    # 3. Null values check
    null_counts = df.isnull().sum()
    if null_counts.sum() > 0:
        cols_with_nulls = null_counts[null_counts > 0].to_dict()
        errors.append(f"Null values detected: {cols_with_nulls}")
        
    # 4. District check
    unique_districts = set(df["district"].unique())
    diff_districts = set(EXPECTED_DISTRICTS) - unique_districts
    if diff_districts:
        errors.append(f"Missing expected districts: {diff_districts}")
        
    # 5. Coordinate bounds check (India bounding box roughly 8N-35N, 68E-98E)
    if not df["latitude"].between(8.0, 35.0).all():
        errors.append("Latitude values out of expected geographic range [8.0, 35.0]")
    if not df["longitude"].between(68.0, 98.0).all():
        errors.append("Longitude values out of expected geographic range [68.0, 98.0]")
        
    # 6. Physical hydrological bounds check
    if not df["rainfall_mm"].between(0, 1500).all():
        errors.append("rainfall_mm out of physical bounds [0, 1500]")
    if not df["river_level_m"].between(0.1, 25).all():
        errors.append("river_level_m out of physical bounds [0.1, 25]")
    if not df["humidity_pct"].between(10, 100).all():
        errors.append("humidity_pct out of physical bounds [10, 100]")
    if not df["soil_moisture_pct"].between(0, 100).all():
        errors.append("soil_moisture_pct out of physical bounds [0, 100]")
    if not df["reservoir_level_pct"].between(0, 100).all():
        errors.append("reservoir_level_pct out of physical bounds [0, 100]")
    if not df["forest_cover_pct"].between(0, 100).all():
        errors.append("forest_cover_pct out of physical bounds [0, 100]")
    if not df["drainage_score"].between(0, 100).all():
        errors.append("drainage_score out of physical bounds [0, 100]")
    if not df["cyclone"].isin([0, 1]).all():
        errors.append("cyclone flag must be binary [0, 1]")
        
    # 7. Target distribution check
    if not df["flood_occurred"].isin([0, 1]).all():
        errors.append("flood_occurred target must be binary [0, 1]")
        
    flood_events = df["flood_occurred"].sum()
    flood_rate = (flood_events / total_rows) * 100
    
    valid_severities = {"Low", "Medium", "High", "Very High"}
    actual_severities = set(df["flood_severity"].unique())
    if not actual_severities.issubset(valid_severities):
        errors.append(f"Unexpected flood_severity values: {actual_severities - valid_severities}")
        
    print("\n--- Summary Statistics ---")
    print(f"Total Records:         {total_rows}")
    print(f"Flood Events:          {flood_events} ({flood_rate:.2f}%)")
    print(f"Non-Flood Records:     {total_rows - flood_events} ({100 - flood_rate:.2f}%)")
    print(f"Mean Rainfall:         {df['rainfall_mm'].mean():.2f} mm")
    print(f"Max Rainfall:          {df['rainfall_mm'].max():.2f} mm")
    print(f"Mean River Level:      {df['river_level_m'].mean():.2f} m")
    print(f"Severity Breakdown:    {df['flood_severity'].value_counts().to_dict()}")
    print(f"Monitored Districts:   {len(unique_districts)}")
    
    if errors:
        print("\n[FAIL] Validation issues detected:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("\n[PASS] All dataset integrity and hydrological boundary checks PASSED!")
        return True

if __name__ == "__main__":
    validate()
