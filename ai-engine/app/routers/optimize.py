from fastapi import APIRouter

from app.schemas.contracts import OptimizeRouteRequest, OptimizeRouteResponse
from app.services.route_stub import optimize_route_stub

router = APIRouter()


@router.post("/optimize/route", response_model=OptimizeRouteResponse)
def optimize_route(payload: OptimizeRouteRequest) -> OptimizeRouteResponse:
    return optimize_route_stub(payload)
