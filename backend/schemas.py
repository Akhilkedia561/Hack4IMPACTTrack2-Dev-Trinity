from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EnergyReadingSchema(BaseModel):
    id:              int
    timestamp:       datetime
    production_kw:   float
    consumption_kw:  float
    battery_percent: float
    grid_export_kw:  float

    class Config:
        from_attributes = True

class OptimizerResult(BaseModel):
    action:      str
    savings_inr: int
    savings_kwh: float
    reason:      str
    confidence:  int

class PredictionHour(BaseModel):
    hour:          str
    predicted_kwh: float
    actual_kwh:    Optional[float]
    cloud_cover:   float
    temperature:   int

class PredictionResult(BaseModel):
    location:            str
    panel_size_kw:       float
    hours:               list[PredictionHour]
    total_predicted_kwh: float
    peak_hour:           str

class StatsResult(BaseModel):
    total_readings:  int
    avg_production:  float
    avg_consumption: float
    avg_battery:     float
    total_kwh:       float
    session_start:   Optional[str]
    last_reading:    Optional[str]