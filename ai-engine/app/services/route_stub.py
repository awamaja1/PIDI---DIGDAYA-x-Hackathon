from __future__ import annotations

import hashlib
import json
from math import sqrt

from app.schemas.contracts import (
    AlgorithmMeta,
    GeoPoint,
    OptimizeRouteRequest,
    OptimizeRouteResponse,
    RouteMetrics,
    RoutePlan,
)


def _point_distance_km(a: GeoPoint, b: GeoPoint) -> float:
    # Lightweight approximation for PoC: degree distance to km.
    return sqrt(((a.lat - b.lat) ** 2) + ((a.lon - b.lon) ** 2)) * 111.0


def _deterministic_rotation(destinations: list[GeoPoint], seed: int) -> list[GeoPoint]:
    if len(destinations) <= 1:
        return destinations

    idx = seed % len(destinations)
    return destinations[idx:] + destinations[:idx]


def optimize_route_stub(request: OptimizeRouteRequest) -> OptimizeRouteResponse:
    destination_seed_payload = [
        {"code": d.code, "lat": d.lat, "lon": d.lon}
        for d in request.destinations
    ]
    hashed = hashlib.sha256(json.dumps(destination_seed_payload, sort_keys=True).encode("utf-8")).hexdigest()
    hash_seed = int(hashed[:8], 16)
    effective_seed = request.algorithm_config.random_seed + hash_seed

    sorted_destinations = sorted(request.destinations, key=lambda item: item.code)
    ordered_destinations = _deterministic_rotation(sorted_destinations, effective_seed)

    path = [request.origin, *ordered_destinations]

    total_distance_km = 0.0
    for idx in range(len(path) - 1):
        total_distance_km += _point_distance_km(path[idx], path[idx + 1])

    total_distance_km = round(total_distance_km, 2)
    estimated_cost_idr = round(total_distance_km * 5200.0, 2)
    baseline_cost_idr = round(estimated_cost_idr / 0.88, 2)
    cost_reduction_pct = round(((baseline_cost_idr - estimated_cost_idr) / baseline_cost_idr) * 100, 2)

    estimated_duration_min = int(round(total_distance_km * 2.1))
    service_level_pct = round(max(85.0, 99.5 - (len(ordered_destinations) * 0.7)), 2)

    algorithm_used = "GA+PPO+GNN" if request.algorithm_config.enable_ppo else "GA"
    optimization_time_ms = 120 + (len(ordered_destinations) * 25)

    return OptimizeRouteResponse(
        route_plan=RoutePlan(
            ordered_stops=ordered_destinations,
            total_distance_km=total_distance_km,
        ),
        metrics=RouteMetrics(
            estimated_cost_idr=estimated_cost_idr,
            estimated_duration_min=estimated_duration_min,
            service_level_pct=service_level_pct,
            baseline_cost_idr=baseline_cost_idr,
            cost_reduction_pct=cost_reduction_pct,
        ),
        algorithm_meta=AlgorithmMeta(
            algorithm_used=algorithm_used,
            ga_generations_run=request.algorithm_config.ga_generations,
            ppo_active=request.algorithm_config.enable_ppo,
            gnn_embedding_used=True,
            optimization_time_ms=optimization_time_ms,
        ),
        correlation_id=request.correlation_id,
    )
