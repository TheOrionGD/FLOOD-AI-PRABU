# FloodAI Historical Dataset Documentation

## Overview
The FloodAI dataset (`dataset/flood_dataset.csv`) contains 10,000 historical observation records spanning from 2000 through 2023 across 10 vulnerable and flood-prone Indian districts.

The dataset is synthetically generated via `dataset/generate_dataset.py` using physical hydrological distributions (monsoon rainfall gamma modeling, tidal sea level variance, elevation offsets, and realistic drainage metrics). It serves as the reproducible ground truth for training both the Random Forest and XGBoost classifiers.

---

## File Specifications
- **File Name:** `flood_dataset.csv`
- **Format:** Comma-Separated Values (CSV, UTF-8)
- **Total Records:** 10,000
- **Total Columns:** 26
- **Missing / Null Values:** 0
- **Coordinate Reference System:** WGS84 (EPSG:4326)

---

## Feature Dictionary

| # | Column Name | Type | Unit | Description | Range |
|---|---|---|---|---|---|
| 1 | `date` | String | YYYY-MM-DD | Observation date | 2000-01-01 to 2023-12-31 |
| 2 | `district` | String | — | Monitored district name | 10 Indian Districts |
| 3 | `state` | String | — | State jurisdiction | 8 Indian States |
| 4 | `latitude` | Float | Decimal Degrees | Latitude (WGS84) | 9.93 to 26.14 |
| 5 | `longitude` | Float | Decimal Degrees | Longitude (WGS84) | 72.83 to 91.74 |
| 6 | `rainfall_mm` | Float | mm | 24-hour cumulative precipitation | 0.0 to 757.2 |
| 7 | `river_level_m` | Float | meters | Local hydrological river gauge height | 0.5 to 13.9 |
| 8 | `sea_level_m` | Float | meters | Relative sea level / tidal anomaly | 0.5 to 3.5 |
| 9 | `temperature_c` | Float | °C | Ambient surface air temperature | 12.0 to 45.0 |
| 10 | `humidity_pct` | Float | % | Relative atmospheric humidity | 20.0 to 100.0 |
| 11 | `wind_speed_kmh` | Float | km/h | Sustained surface wind speed | 2.0 to 140.0 |
| 12 | `soil_moisture_pct`| Float | % | Volumetric soil moisture saturation | 5.0 to 100.0 |
| 13 | `reservoir_level_pct`| Float | % | Upstream dam / reservoir storage level | 5.0 to 100.0 |
| 14 | `elevation_m` | Float | meters | Mean terrain elevation above sea level | 0.0 to 1100.0 |
| 15 | `distance_from_coast_km`| Float | km | Linear distance to nearest ocean/sea | 0.0 to 580.0 |
| 16 | `population_density`| Integer | /km² | Local district population density | 50 to 28,000 |
| 17 | `forest_cover_pct`| Float | % | Watershed vegetative / canopy cover | 0.0 to 88.0 |
| 18 | `cyclone` | Integer | Binary | Cyclone / tropical depression flag (0 or 1) | 0, 1 |
| 19 | `drainage_score` | Float | Score (0-100)| Municipal stormwater drainage efficiency | 5.0 to 100.0 |
| 20 | `flood_occurred` | Integer | Binary | **Target Variable** (1 = Flood Event, 0 = No Flood)| 0, 1 |
| 21 | `flood_severity` | String | Categorical | Severity level: Low, Medium, High, Very High | 4 tiers |
| 22 | `damage_cost_inr` | Float | INR | Estimated economic infrastructure damage | ≥ 0.0 |
| 23 | `affected_population`| Integer | Count | Count of displaced / impacted civilians | ≥ 0 |
| 24 | `deaths` | Integer | Count | Fatalities resulting from the event | ≥ 0 |
| 25 | `rescue_time_hrs` | Float | Hours | Emergency response & rescue deployment time | ≥ 0.0 |
| 26 | `flood_probability_pct`| Float | % | Hydrological physical flood probability index | 0.0 to 100.0 |

---

## Monitored Districts

1. **Chennai** (Tamil Nadu) — Coastal low-lying urban basin (6m elevation)
2. **Kochi** (Kerala) — Coastal backwater estuarine zone (2m elevation)
3. **Mumbai** (Maharashtra) — Coastal island metropolis prone to monsoon tidal lock (8m elevation)
4. **Kolkata** (West Bengal) — Gangetic delta estuary prone to cyclonic storm surges (6m elevation)
5. **Guwahati** (Assam) — Brahmaputra riverine flood basin (55m elevation)
6. **Patna** (Bihar) — Confluence of Ganga, Gandak, and Son rivers (53m elevation)
7. **Surat** (Gujarat) — Tapi river mouth and coastal plain (13m elevation)
8. **Visakhapatnam** (Andhra Pradesh) — Bay of Bengal cyclonic landfall zone (45m elevation)
9. **Bhubaneswar** (Odisha) — Mahanadi delta drainage zone (45m elevation)
10. **Hosur** (Tamil Nadu) — Inland elevated plateau benchmark control (890m elevation)

---

## Validation & Verification

Run the automated verification suite to validate schema and boundary constraints:
```bash
python dataset/validate_dataset.py
```
Expected output:
```
[PASS] All dataset integrity and hydrological boundary checks PASSED!
```
