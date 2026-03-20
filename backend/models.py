from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from database import Base

class EnergyReading(Base):
    __tablename__ = "energy_readings"

    id              = Column(Integer, primary_key=True, index=True)
    timestamp       = Column(DateTime, default=datetime.utcnow, index=True)
    production_kw   = Column(Float, nullable=False)
    consumption_kw  = Column(Float, nullable=False)
    battery_percent = Column(Float, nullable=False)
    grid_export_kw  = Column(Float, nullable=False)

class OptimizerLog(Base):
    __tablename__ = "optimizer_log"

    id          = Column(Integer, primary_key=True, index=True)
    timestamp   = Column(DateTime, default=datetime.utcnow, index=True)
    action      = Column(String, nullable=False)
    savings_inr = Column(Float)
    savings_kwh = Column(Float)
    reason      = Column(String)
    confidence  = Column(Integer)

class PredictionLog(Base):
    __tablename__ = "prediction_log"

    id                   = Column(Integer, primary_key=True, index=True)
    timestamp            = Column(DateTime, default=datetime.utcnow)
    location             = Column(String)
    panel_size_kw        = Column(Float)
    total_predicted_kwh  = Column(Float)
    peak_hour            = Column(String)