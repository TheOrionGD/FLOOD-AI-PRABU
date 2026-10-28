"""
test_ml_service.py
------------------
Tests predict_api Flask application directly using Flask test client.
"""
import os
import json
import unittest
from predict_api import app, INTERNAL_SERVICE_KEY

class TestMLMicroservice(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.headers = {
            "Internal-Service-Key": INTERNAL_SERVICE_KEY,
            "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
        }

    def test_health(self):
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertTrue(data['models']['xgboost']['loaded'])
        self.assertTrue(data['models']['random_forest']['loaded'])
        self.assertTrue(data['models']['shap_explainer']['ready'])

    def test_internal_service_key_security(self):
        # 1. Valid key in Internal-Service-Key header succeeds
        res_ok = self.client.post('/predict', json={}, headers={"Internal-Service-Key": INTERNAL_SERVICE_KEY})
        # Empty body triggers 400 validation error, not 401 unauthorized
        self.assertNotEqual(res_ok.status_code, 401)

        # 2. Invalid key with remote IP triggers 401
        res_bad = self.client.post(
            '/predict',
            json={},
            headers={"Internal-Service-Key": "wrong-secret-key"},
            environ_base={"REMOTE_ADDR": "192.168.1.50"}
        )
        self.assertEqual(res_bad.status_code, 401)
        print("\n[TEST] Unauthorized rejection verified: 401 with invalid Internal-Service-Key")

    def test_predict_and_shap(self):
        payload = {
            "rainfall_mm": 220.0,
            "river_level_m": 7.5,
            "sea_level_m": 2.1,
            "temperature_c": 28.0,
            "humidity_pct": 85.0,
            "wind_speed_kmh": 45.0,
            "soil_moisture_pct": 75.0,
            "reservoir_level_pct": 88.0,
            "elevation_m": 12.0,
            "distance_from_coast_km": 15.0,
            "population_density": 4500.0,
            "forest_cover_pct": 15.0,
            "cyclone": 1.0,
            "drainage_score": 35.0,
            "engine": "xgboost"
        }
        res = self.client.post('/predict', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('flood_probability_pct', data)
        self.assertIn('risk_level', data)
        self.assertIn('shap_explanation', data)
        self.assertTrue(len(data['shap_explanation']['contributions']) > 0)
        print("\n[TEST] Sample Prediction Risk:", data['risk_level'], data['flood_probability_pct'], "%")
        print("[TEST] Top SHAP driver:", data['shap_explanation']['top_positive'][0]['feature'])

    def test_comparison(self):
        res = self.client.get('/models/comparison')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('random_forest', data['models'])
        self.assertIn('xgboost', data['models'])
        self.assertIn('shap_analysis', data)

    def test_threat_intel(self):
        payload = {
            "district": "Chennai",
            "state": "Tamil Nadu",
            "risk_level": "High",
            "flood_probability_pct": 72.4,
            "rainfall_mm": 240.0,
            "river_level_m": 8.1,
            "cyclone": 1,
            "top_factors": ["rainfall_mm", "cyclone", "river_level_m"]
        }
        res = self.client.post('/threat-intel', json=payload, headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('threat_title', data)
        self.assertIn('civilian_directives', data)
        print("[TEST] Generated Threat Intel Headline:", data['threat_title'])
        print("[TEST] AI Model Used:", data.get('source_ai_model'))

if __name__ == '__main__':
    unittest.main()
