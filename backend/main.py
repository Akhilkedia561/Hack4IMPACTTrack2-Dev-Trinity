import asyncio
import math
import random
from datetime import datetime
from typing import Optional

import httpx
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from dotenv import load_dotenv

from database import engine, AsyncSessionLocal, Base
from models import EnergyReading, OptimizerLog, PredictionLog
from schemas import OptimizerResult, PredictionResult, StatsResult

load_dotenv()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="AdaptGrid AI", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup: create tables ────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
    print("🚀 AdaptGrid AI backend running")

# ── State ─────────────────────────────────────────────────────────────────────
_battery: float = 60.0
_connected: list[WebSocket] = []

# ── Solar helpers ─────────────────────────────────────────────────────────────
def solar_factor(hour: int) -> float:
    return max(0.0, math.sin(((hour - 6) / 12) * math.pi))

def generate_reading() -> dict:
    global _battery
    hour        = datetime.now().hour
    sf          = solar_factor(hour)
    production  = round(4 + sf * 5.5 + random.uniform(-0.3, 0.3), 2)
    evening     = 2.0 if 18 <= hour <= 22 else 0.0
    consumption = round(2.5 + random.uniform(0, 3) + evening, 2)
    surplus     = production - consumption
    _battery    = min(100.0, max(5.0, _battery + surplus * 0.3))
    return {
        "timestamp":       datetime.now().isoformat(),
        "production_kw":   production,
        "consumption_kw":  consumption,
        "battery_percent": round(_battery, 1),
        "grid_export_kw":  round(max(0.0, surplus - 1), 2),
    }

def compute_solar_kwh(irr: float, cloud: float, temp: float, panel: float) -> float:
    return round(
        panel * (1 - (cloud / 100) * 0.75)
              * (1 - max(0, temp - 25) * 0.004)
              * 0.78
              * (irr / 1000),
        2
    )

# ── Save reading to DB ────────────────────────────────────────────────────────
async def save_reading(data: dict):
    try:
        async with AsyncSessionLocal() as session:
            session.add(EnergyReading(
                timestamp=       datetime.fromisoformat(data["timestamp"]),
                production_kw=   data["production_kw"],
                consumption_kw=  data["consumption_kw"],
                battery_percent= data["battery_percent"],
                grid_export_kw=  data["grid_export_kw"],
            ))
            await session.commit()
    except Exception as e:
        print(f"⚠ DB write error: {e}")

# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/energy")
async def websocket_energy(ws: WebSocket):
    await ws.accept()
    _connected.append(ws)
    print(f"🔌 Client connected — {len(_connected)} active")
    try:
        while True:
            data = generate_reading()
            await ws.send_json(data)
            await save_reading(data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        _connected.remove(ws)
        print(f"🔌 Disconnected — {len(_connected)} active")
    except Exception:
        if ws in _connected:
            _connected.remove(ws)

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status":  "ok",
        "service": "AdaptGrid AI",
        "version": "1.0.0",
        "docs":    "/docs",
    }

# ── Latest reading ────────────────────────────────────────────────────────────
@app.get("/reading")
def get_reading():
    return generate_reading()

# ── History from DB ───────────────────────────────────────────────────────────
@app.get("/history")
async def get_history(limit: int = 60):
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                text("SELECT * FROM energy_readings ORDER BY timestamp DESC LIMIT :limit"),
                {"limit": limit}
            )
            return [dict(r) for r in result.mappings().all()]
    except Exception as e:
        return {"error": str(e)}

# ── Optimize ──────────────────────────────────────────────────────────────────
@app.get("/optimize")
async def optimize():
    global _battery
    hour        = datetime.now().hour
    sf          = solar_factor(hour)
    production  = 4 + sf * 5.5
    evening     = 2.0 if 18 <= hour <= 22 else 0.0
    consumption = 2.5 + evening
    surplus     = production - consumption

    if surplus > 1.5 and _battery > 80:
        action, conf = "SEND_TO_GRID", 88
        savings_inr  = round(surplus * 8.5)
        savings_kwh  = round(surplus, 1)
        reason       = f"Battery {round(_battery)}% full + {round(surplus,1)} kW surplus. Export earns ₹8.5/unit."
    elif surplus > 0 and _battery < 80:
        action, conf = "STORE_BATTERY", 85
        savings_inr  = round(surplus * 7.5)
        savings_kwh  = round(surplus, 1)
        reason       = f"Battery at {round(_battery)}%. Storing {round(surplus,1)} kW avoids ₹9/unit grid cost tonight."
    elif consumption > production and _battery > 20:
        deficit      = consumption - production
        action, conf = "USE_NOW", 92
        savings_inr  = round(deficit * 9.0)
        savings_kwh  = round(deficit, 1)
        reason       = f"Demand exceeds solar by {round(deficit,1)} kW. Battery discharge saves ₹9/unit vs grid."
    else:
        action, conf = "STORE_BATTERY", 75
        savings_inr  = round(abs(surplus) * 6.0)
        savings_kwh  = round(abs(surplus), 1)
        reason       = "Low solar period. Conserving battery for evening peak (6–10 PM)."

    try:
        async with AsyncSessionLocal() as session:
            session.add(OptimizerLog(
                timestamp=   datetime.utcnow(),
                action=      action,
                savings_inr= savings_inr,
                savings_kwh= savings_kwh,
                reason=      reason,
                confidence=  conf,
            ))
            await session.commit()
    except Exception as e:
        print(f"⚠ Optimizer log error: {e}")

    return {
        "action":      action,
        "savings_inr": savings_inr,
        "savings_kwh": savings_kwh,
        "reason":      reason,
        "confidence":  conf,
    }

# ── Optimizer history ─────────────────────────────────────────────────────────
@app.get("/optimize/history")
async def optimizer_history(limit: int = 20):
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                text("SELECT * FROM optimizer_log ORDER BY timestamp DESC LIMIT :limit"),
                {"limit": limit}
            )
            return [dict(r) for r in result.mappings().all()]
    except Exception as e:
        return {"error": str(e)}

# ── 24h Prediction ────────────────────────────────────────────────────────────
@app.get("/predict")
async def predict(lat: float, lng: float, panel_kw: float = 5.0):
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude":      lat,
                "longitude":     lng,
                "hourly":        "temperature_2m,cloudcover,shortwave_radiation",
                "forecast_days": 1,
                "timezone":      "Asia/Kolkata",
            }
        )
        resp.raise_for_status()
        w = resp.json()

    times     = w["hourly"]["time"]
    temps     = w["hourly"]["temperature_2m"]
    clouds    = w["hourly"]["cloudcover"]
    radiation = w["hourly"]["shortwave_radiation"]

    X = np.array([[radiation[i], clouds[i], temps[i]] for i in range(len(times))])
    y = np.array([compute_solar_kwh(radiation[i], clouds[i], temps[i], panel_kw) for i in range(len(times))])

    from sklearn.linear_model import LinearRegression
    model = LinearRegression()
    model.fit(X, y)
    preds = model.predict(X)

    hours = [
        {
            "hour":          t.split("T")[1][:5],
            "predicted_kwh": round(float(preds[i]), 2),
            "actual_kwh":    None,
            "cloud_cover":   clouds[i],
            "temperature":   round(temps[i]),
        }
        for i, t in enumerate(times)
    ]

    total = round(sum(h["predicted_kwh"] for h in hours), 2)
    peak  = max(hours, key=lambda h: h["predicted_kwh"])

    try:
        async with AsyncSessionLocal() as session:
            session.add(PredictionLog(
                location=            f"{lat},{lng}",
                panel_size_kw=       panel_kw,
                total_predicted_kwh= total,
                peak_hour=           peak["hour"],
            ))
            await session.commit()
    except Exception as e:
        print(f"⚠ Prediction log error: {e}")

    return {
        "location":            f"{lat},{lng}",
        "panel_size_kw":       panel_kw,
        "hours":               hours,
        "total_predicted_kwh": total,
        "peak_hour":           peak["hour"],
    }

# ── Stats summary ─────────────────────────────────────────────────────────────
@app.get("/stats")
async def stats():
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("""
                SELECT
                    COUNT(*)                     AS total_readings,
                    COALESCE(AVG(production_kw),  0) AS avg_production,
                    COALESCE(AVG(consumption_kw), 0) AS avg_consumption,
                    COALESCE(AVG(battery_percent),0) AS avg_battery,
                    COALESCE(SUM(production_kw * 5.0/3600), 0) AS total_kwh,
                    MIN(timestamp) AS first_reading,
                    MAX(timestamp) AS last_reading
                FROM energy_readings
            """))
            row = dict(result.mappings().one())
            return {
                "total_readings":  row["total_readings"],
                "avg_production":  round(float(row["avg_production"]),  2),
                "avg_consumption": round(float(row["avg_consumption"]), 2),
                "avg_battery":     round(float(row["avg_battery"]),     1),
                "total_kwh":       round(float(row["total_kwh"]),       3),
                "session_start":   str(row["first_reading"]),
                "last_reading":    str(row["last_reading"]),
            }
    except Exception as e:
        return {"error": str(e)}