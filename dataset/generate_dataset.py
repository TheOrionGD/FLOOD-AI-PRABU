"""
generate_dataset.py
--------------------
Generates a realistic synthetic historical flood dataset (10,000+ records)
for the AI-Based Flood Prediction and Alert System.

The values are synthetically generated but follow real-world statistical
relationships (e.g. higher rainfall + high river level + low elevation +
low forest cover => higher flood probability), so the dataset is suitable
for training a genuine classification model (Random Forest / XGBoost).

Usage:
    python3 generate_dataset.py
Output:
    flood_dataset.csv  (10,000 rows, 22 columns)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

np.random.seed(42)
N = 10000

# Coastal / flood-prone Indian districts used as realistic location anchors
LOCATIONS = [
    ("Chennai", "Tamil Nadu", 13.0827, 80.2707, 6),
    ("Kochi", "Kerala", 9.9312, 76.2673, 2),
    ("Mumbai", "Maharashtra", 19.0760, 72.8777, 8),
    ("Kolkata", "West Bengal", 22.5726, 88.3639, 6),
    ("Guwahati", "Assam", 26.1445, 91.7362, 55),
    ("Patna", "Bihar", 25.5941, 85.1376, 53),
    ("Surat", "Gujarat", 21.1702, 72.8311, 13),
    ("Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185, 45),
    ("Bhubaneswar", "Odisha", 20.2961, 85.8245, 45),
    ("Hosur", "Tamil Nadu", 12.7409, 77.8253, 890),
]

rows = []
start_date = datetime(2000, 1, 1)

for i in range(N):
    loc = LOCATIONS[np.random.randint(0, len(LOCATIONS))]
    district, state, lat, lon, base_elev = loc

    date = start_date + timedelta(days=int(np.random.rand() * 365 * 24))
    month = date.month
    monsoon = 1 if month in [6, 7, 8, 9, 10] else 0

    rainfall = np.clip(np.random.gamma(2.2, 60 if monsoon else 15), 0, 900)
    river_level = np.clip(np.random.normal(4 + rainfall / 250, 1.2), 0.5, 14)
    sea_level = np.clip(np.random.normal(1.5 + (0.002 * (date.year - 2000)), 0.3), 0.5, 3.5)
    temperature = np.clip(np.random.normal(29 - monsoon * 3, 3.5), 12, 45)
    humidity = np.clip(np.random.normal(65 + monsoon * 15, 10), 20, 100)
    wind_speed = np.clip(np.random.gamma(2, 12) + monsoon * 8, 2, 140)
    soil_moisture = np.clip(np.random.normal(35 + monsoon * 25, 12), 5, 100)
    reservoir_level = np.clip(np.random.normal(60 + monsoon * 20, 15), 5, 100)
    elevation = np.clip(np.random.normal(base_elev, base_elev * 0.15 + 2), 0, 1200)
    dist_coast = np.clip(np.random.exponential(30) if base_elev < 100 else np.random.normal(250, 80), 0, 600)
    population_density = np.clip(np.random.gamma(3, 900), 50, 30000)
    forest_cover = np.clip(np.random.normal(28, 15), 0, 90)
    cyclone = 1 if (monsoon and np.random.rand() < 0.12) else 0
    drainage_score = np.clip(np.random.normal(55, 20), 5, 100)  # higher = better drainage

    # ---- physically-motivated flood probability -----------------------
    risk = (
        0.30 * (rainfall / 900)
        + 0.20 * (river_level / 14)
        + 0.10 * (sea_level / 3.5)
        + 0.10 * (soil_moisture / 100)
        + 0.08 * (reservoir_level / 100)
        + 0.10 * (1 - np.clip(elevation, 0, 300) / 300)
        + 0.05 * (1 - np.clip(dist_coast, 0, 300) / 300)
        + 0.07 * cyclone
        - 0.08 * (forest_cover / 90)
        - 0.10 * (drainage_score / 100)
    )
    risk = np.clip(risk + np.random.normal(0, 0.05), 0, 1)

    flood_occurred = 1 if risk > 0.32 else 0
    if flood_occurred:
        if risk > 0.6:
            severity = "Very High"
        elif risk > 0.45:
            severity = "High"
        else:
            severity = "Medium"
    else:
        severity = "Low"

    damage_cost = round(risk * np.random.gamma(2, 1_500_000), 2) if flood_occurred else round(np.random.rand() * 20000, 2)
    affected_population = int(risk * population_density * np.random.uniform(0.1, 0.6)) if flood_occurred else int(np.random.rand() * 50)
    deaths = int(np.random.poisson(risk * 8)) if flood_occurred else 0
    rescue_time_hrs = round(np.random.uniform(2, 48), 1) if flood_occurred else 0

    rows.append([
        date.strftime("%Y-%m-%d"), district, state, round(lat, 4), round(lon, 4),
        round(rainfall, 1), round(river_level, 2), round(sea_level, 2),
        round(temperature, 1), round(humidity, 1), round(wind_speed, 1),
        round(soil_moisture, 1), round(reservoir_level, 1), round(elevation, 1),
        round(dist_coast, 1), int(population_density), round(forest_cover, 1),
        cyclone, round(drainage_score, 1), flood_occurred, severity,
        damage_cost, affected_population, deaths, rescue_time_hrs, round(risk * 100, 2),
    ])

columns = [
    "date", "district", "state", "latitude", "longitude",
    "rainfall_mm", "river_level_m", "sea_level_m",
    "temperature_c", "humidity_pct", "wind_speed_kmh",
    "soil_moisture_pct", "reservoir_level_pct", "elevation_m",
    "distance_from_coast_km", "population_density", "forest_cover_pct",
    "cyclone", "drainage_score", "flood_occurred", "flood_severity",
    "damage_cost_inr", "affected_population", "deaths", "rescue_time_hrs",
    "flood_probability_pct",
]

df = pd.DataFrame(rows, columns=columns)
df.to_csv("flood_dataset.csv", index=False)

print(f"Generated {len(df)} rows -> flood_dataset.csv")
print(f"Flood-positive rate: {df['flood_occurred'].mean():.2%}")
print(df.head(3).to_string())
