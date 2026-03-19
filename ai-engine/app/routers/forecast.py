from fastapi import APIRouter, HTTPException

from app.schemas.contracts import (
    DataQualityErrorResponse,
    PredictPriceRequest,
    PredictPriceResponse,
)
from app.services.forecast_stub import predict_price_stub

router = APIRouter()


@router.post("/predict/price", response_model=PredictPriceResponse)
def predict_price(payload: PredictPriceRequest) -> PredictPriceResponse:
    if payload.historical_prices and len(payload.historical_prices) < 3:
        error = DataQualityErrorResponse(
            error_code="INSUFFICIENT_DATA",
            message="Data historis belum cukup untuk inferensi stabil",
            data_quality_issues=["historical_prices<3"],
            min_required_data_points=3,
            available_data_points=len(payload.historical_prices),
            correlation_id=payload.correlation_id,
        )
        raise HTTPException(status_code=422, detail=error.model_dump())

    return predict_price_stub(payload)
