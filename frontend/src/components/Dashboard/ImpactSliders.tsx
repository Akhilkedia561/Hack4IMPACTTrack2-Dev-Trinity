"use client";
import { useState, useEffect } from "react";
import { ImpactScenario } from "@/types/energy";

export default function ImpactSliders() {
  const [cloudy, setCloudy] = useState(0);
  const [heat, setHeat] = useState(0);
  const [scenario, setScenario] = useState<ImpactScenario | null>(null);

  useEffect(() => {
    const production = +(8.5 * (1 - (cloudy / 100) * 0.85)).toFixed(2);
    const consumption = +(5.2 * (1 + (heat / 100) * 0.4)).toFixed(2);
    const surplus = Math.max(0, production - consumption);
    setScenario({
      cloudy_factor: cloudy / 100, heat_factor: heat / 100,
      production_kw: production, consumption_kw: consumption,
      carbon_saved_kg: +(production * 0.82).toFixed(2),
      money_saved_inr: Math.round(surplus * 7.5 + production * 2.5),
    });
  }, [cloudy, heat]);

  const alert = cloudy > 60 && heat > 60 ? { msg: "Battery-first mode recommended", color: "#eb4425", bg: "rgba(235,68,37,0.06)", border: "rgba(235,68,37,0.18)" }
    : heat > 70 ? { msg: "Pre-cool before 2 PM to reduce peak load", color: "#e6a817", bg: "rgba(230,168,23,0.08)", border: "rgba(230,168,23,0.2)" }
    : cloudy > 70 ? { msg: "Minimise non-essential loads 12–4 PM", color: "#6789be", bg: "var(--blue-bg)", border: "var(--border2)" }
    : null;

  const tiles = scenario ? [
    { label: "Production",  value: `${scenario.production_kw} kW`,   color: "#e6a817", bg: "rgba(230,168,23,0.08)" },
    { label: "Consumption", value: `${scenario.consumption_kw} kW`,  color: "#6789be", bg: "var(--blue-bg)" },
    { label: "CO₂ Saved",   value: `${scenario.carbon_saved_kg} kg`, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
    { label: "₹ Saved",     value: `₹${scenario.money_saved_inr}`,   color: "#eb4425", bg: "rgba(235,68,37,0.06)" },
  ] : [];

  return (
    <div className="card fade-up-4" style={{ padding: 24 }}>
      <div className="flex items-start justify-between mb-1">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>
          Impact Calculator
        </h3>
        <span style={{
          fontSize: 11, color: "var(--text3)", background: "var(--surface2)",
          border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 8, fontWeight: 500,
        }}>Scenario</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 22 }}>Simulate weather conditions</p>

      {/* Cloudy slider */}
      <div style={{ marginBottom: 22 }}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 16 }}>☁️</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Cloudy Day</span>
          </div>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "var(--blue)",
            background: "var(--blue-bg)", padding: "2px 10px", borderRadius: 8, minWidth: 44, textAlign: "center",
          }}>{cloudy}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={cloudy} onChange={(e) => setCloudy(+e.target.value)} />
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 10, color: "var(--text3)" }}>Clear sky</span>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>Heavy overcast</span>
        </div>
      </div>

      {/* Heat slider */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 16 }}>🌡️</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Heatwave</span>
          </div>
          <span style={{
            fontSize: 13, fontWeight: 700, color: heat > 60 ? "#eb4425" : "#e6a817",
            background: heat > 60 ? "rgba(235,68,37,0.08)" : "rgba(230,168,23,0.1)",
            padding: "2px 10px", borderRadius: 8, minWidth: 44, textAlign: "center",
          }}>{heat}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={heat} onChange={(e) => setHeat(+e.target.value)} />
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 10, color: "var(--text3)" }}>Normal 28°C</span>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>Extreme 44°C</span>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{
          marginBottom: 16, padding: "10px 14px", borderRadius: 10,
          background: alert.bg, border: `1px solid ${alert.border}`,
          fontSize: 12, color: alert.color, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
          animation: "slideIn 0.25s ease both",
        }}>
          <span>⚠</span>{alert.msg}
        </div>
      )}

      {/* Result tiles */}
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {tiles.map((t) => (
            <div key={t.label} style={{
              background: t.bg, borderRadius: 12, padding: "12px 14px", textAlign: "center",
              transition: "all 0.2s ease",
            }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5, fontWeight: 500 }}>{t.label}</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: t.color, letterSpacing: "-0.03em" }}>{t.value}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
