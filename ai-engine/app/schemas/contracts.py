from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

CORRELATION_ID_PATTERN = r"^GARUDA-[0-9a-f-]{36}$"


class PriceHistoryPoint(BaseModel):
    date: date
    price: float
    quality_flag: Literal["NORMAL", "SUSPECT", "OUTLIER"]


class PredictPriceRequest(BaseModel):
    commodity_code: Literal["CABAI_RAWIT", "BAWANG_MERAH", "JAGUNG"]
    region_code: Literal["JKT", "MKS", "SBY"]
    horizon_days: int = Field(ge=1, le=7)
    historical_prices: list[PriceHistoryPoint] = Field(default_factory=list)
    correlation_id: str = Field(pattern=CORRELATION_ID_PATTERN)


class PricePredictionItem(BaseModel):
    forecast_date: date
    predicted_price: float
    confidence_low: float
    confidence_high: float


class PredictPriceModelMeta(BaseModel):
    version: str
    algorithm: str = "XGBoost-LSTM"
    data_quality: Literal["GOOD", "DEGRADED", "MOCK"]
    training_data_points: int | None = None
    is_mock: bool = True


class PredictPriceResponse(BaseModel):
    predictions: list[PricePredictionItem]
    model_meta: PredictPriceModelMeta
    correlation_id: str = Field(pattern=CORRELATION_ID_PATTERN)


class GeoPoint(BaseModel):
    code: str
    lat: float
    lon: float
    label: str | None = None


class AlgorithmConfig(BaseModel):
    ga_generations: int = 100
    enable_ppo: bool = False
    random_seed: int = 42


class OptimizeRouteRequest(BaseModel):
    origin: GeoPoint
    destinations: list[GeoPoint] = Field(min_length=1, max_length=10)
    fleet_capacity_kg: float = Field(gt=0)
    demand_per_destination_kg: list[float] = Field(default_factory=list)
    deadline_iso: datetime
    algorithm_config: AlgorithmConfig = Field(default_factory=AlgorithmConfig)
    correlation_id: str = Field(pattern=CORRELATION_ID_PATTERN)


class RoutePlan(BaseModel):
    ordered_stops: list[GeoPoint]
    total_distance_km: float


class RouteMetrics(BaseModel):
    estimated_cost_idr: float
    estimated_duration_min: int
    service_level_pct: float = Field(ge=0, le=100)
    baseline_cost_idr: float | None = None
    cost_reduction_pct: float | None = None


class AlgorithmMeta(BaseModel):
    algorithm_used: Literal["GA", "GA+PPO", "GA+PPO+GNN"]
    ga_generations_run: int
    ppo_active: bool
    gnn_embedding_used: bool
    optimization_time_ms: int


class OptimizeRouteResponse(BaseModel):
    route_plan: RoutePlan
    metrics: RouteMetrics
    algorithm_meta: AlgorithmMeta
    correlation_id: str = Field(pattern=CORRELATION_ID_PATTERN)


class AIHealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    models_loaded: dict[str, bool]
    mock_mode: bool
    version: str


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    detail: str | None = None
    correlation_id: str = Field(pattern=CORRELATION_ID_PATTERN)


class DataQualityErrorResponse(BaseModel):
    error_code: str
    message: str
    data_quality_issues: list[str] = Field(default_factory=list)
    min_required_data_points: int
    available_data_points: int
    correlation_id: str = Field(pattern=CORRELATION_ID_PATTERN)
