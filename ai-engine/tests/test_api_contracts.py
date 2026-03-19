import unittest
from copy import deepcopy

from fastapi.testclient import TestClient

from app.main import app


class TestAIEngineAPIContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_health_endpoint_returns_ok(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["service"], "ai-engine")
        self.assertIn("timestamp", body)

    def test_predict_price_is_deterministic(self) -> None:
        payload = {
            "commodity_code": "JAGUNG",
            "region_code": "JKT",
            "horizon_days": 3,
            "historical_prices": [
                {"date": "2026-03-10", "price": 7100.0, "quality_flag": "NORMAL"},
                {"date": "2026-03-11", "price": 7150.0, "quality_flag": "NORMAL"},
                {"date": "2026-03-12", "price": 7200.0, "quality_flag": "NORMAL"},
            ],
            "correlation_id": "GARUDA-11111111-1111-1111-1111-111111111111",
        }

        first = self.client.post("/predict/price", json=payload)
        second = self.client.post("/predict/price", json=deepcopy(payload))

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.json(), second.json())
        self.assertEqual(first.json()["model_meta"]["algorithm"], "XGBoost-LSTM")
        self.assertTrue(first.json()["model_meta"]["is_mock"])

    def test_predict_price_missing_correlation_id_returns_422(self) -> None:
        payload = {
            "commodity_code": "JAGUNG",
            "region_code": "JKT",
            "horizon_days": 3,
        }

        response = self.client.post("/predict/price", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_predict_price_invalid_correlation_pattern_returns_422(self) -> None:
        payload = {
            "commodity_code": "JAGUNG",
            "region_code": "JKT",
            "horizon_days": 3,
            "historical_prices": [
                {"date": "2026-03-10", "price": 7100.0, "quality_flag": "NORMAL"},
                {"date": "2026-03-11", "price": 7150.0, "quality_flag": "NORMAL"},
                {"date": "2026-03-12", "price": 7200.0, "quality_flag": "NORMAL"},
            ],
            "correlation_id": "INVALID-CORRELATION-ID",
        }

        response = self.client.post("/predict/price", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_predict_price_insufficient_history_returns_data_quality_error(self) -> None:
        payload = {
            "commodity_code": "JAGUNG",
            "region_code": "JKT",
            "horizon_days": 3,
            "historical_prices": [
                {"date": "2026-03-10", "price": 7100.0, "quality_flag": "NORMAL"},
                {"date": "2026-03-11", "price": 7150.0, "quality_flag": "NORMAL"},
            ],
            "correlation_id": "GARUDA-33333333-3333-3333-3333-333333333333",
        }

        response = self.client.post("/predict/price", json=payload)
        self.assertEqual(response.status_code, 422)

        detail = response.json()["detail"]
        self.assertEqual(detail["error_code"], "INSUFFICIENT_DATA")
        self.assertEqual(detail["min_required_data_points"], 3)
        self.assertEqual(detail["available_data_points"], 2)
        self.assertEqual(detail["correlation_id"], payload["correlation_id"])
        self.assertIn("historical_prices<3", detail["data_quality_issues"])

    def test_optimize_route_is_deterministic(self) -> None:
        payload = {
            "origin": {"code": "WH-JKT", "lat": -6.2, "lon": 106.8, "label": "Jakarta Hub"},
            "destinations": [
                {"code": "DST-1", "lat": -6.1, "lon": 106.9, "label": "A"},
                {"code": "DST-2", "lat": -6.25, "lon": 106.75, "label": "B"},
                {"code": "DST-3", "lat": -6.3, "lon": 106.7, "label": "C"},
            ],
            "fleet_capacity_kg": 1500,
            "demand_per_destination_kg": [300, 400, 500],
            "deadline_iso": "2026-03-20T09:00:00Z",
            "algorithm_config": {
                "ga_generations": 120,
                "enable_ppo": True,
                "random_seed": 42,
            },
            "correlation_id": "GARUDA-22222222-2222-2222-2222-222222222222",
        }

        first = self.client.post("/optimize/route", json=payload)
        second = self.client.post("/optimize/route", json=deepcopy(payload))

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.json(), second.json())
        self.assertEqual(first.json()["algorithm_meta"]["algorithm_used"], "GA+PPO+GNN")
        self.assertGreaterEqual(first.json()["metrics"]["cost_reduction_pct"], 0)


if __name__ == "__main__":
    unittest.main()
