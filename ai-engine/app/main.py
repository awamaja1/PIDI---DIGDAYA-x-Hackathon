from fastapi import FastAPI

from app.routers.forecast import router as forecast_router
from app.routers.health import router as health_router
from app.routers.optimize import router as optimize_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="GARUDA-LINK AI Engine",
        version="1.0.0",
        description="Internal AI Engine service for GARUDA-LINK PoC.",
    )

    app.include_router(health_router)
    app.include_router(forecast_router)
    app.include_router(optimize_router)
    return app


app = create_app()