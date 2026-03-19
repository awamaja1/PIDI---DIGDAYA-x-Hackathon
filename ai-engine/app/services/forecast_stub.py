from __future__ import annotations

from datetime import date, timedelta

from app.schemas.contracts import (
    PredictPriceRequest,
    PredictPriceResponse,
    PredictPriceModelMeta,
    PricePredictionItem,
)

BASE_PRICE_BY_COMMODITY = {
    "CABAI_RAWIT": 43000.0,
    "BAWANG_MERAH": 31000.0,
    "JAGUNG": 7200.0,
}

REGION_ADJ = {
    "JKT": 1.015,
    "MKS": 0.995,
    "SBY": 1.0,
}


def _starting_price(request: PredictPriceRequest) -> float:
    if request.historical_prices:
        return request.historical_prices[-1].price

    base = BASE_PRICE_BY_COMMODITY[request.commodity_code]
    return round(base * REGION_ADJ[request.region_code], 2)


def predict_price_stub(request: PredictPriceRequest) -> PredictPriceResponse:
    start_price = _starting_price(request)
    start_date = request.historical_prices[-1].date if request.historical_prices else date.today()

    trend = 0.0025
    volatility = 0.015

    predictions: list[PricePredictionItem] = []
    for day in range(1, request.horizon_days + 1):
        forecast_date = start_date + timedelta(days=day)
        predicted_price = round(start_price * (1 + (trend * day)), 2)
        confidence_low = round(predicted_price * (1 - volatility), 2)
        confidence_high = round(predicted_price * (1 + volatility), 2)

        predictions.append(
            PricePredictionItem(
                forecast_date=forecast_date,
                predicted_price=predicted_price,
                confidence_low=confidence_low,
                confidence_high=confidence_high,
            )
        )

    data_points = len(request.historical_prices)
    data_quality = "GOOD" if data_points >= 14 else "MOCK"

    return PredictPriceResponse(
        predictions=predictions,
        model_meta=PredictPriceModelMeta(
            version="hybrid-v1.0.0",
            algorithm="XGBoost-LSTM",
            data_quality=data_quality,
            training_data_points=data_points if data_points > 0 else 90,
            is_mock=True,
        ),
        correlation_id=request.correlation_id,
    )
