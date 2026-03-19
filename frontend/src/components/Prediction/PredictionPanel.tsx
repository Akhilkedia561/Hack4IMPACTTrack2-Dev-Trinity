"use client";
import { useState, useRef, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PredictionResult } from "@/types/energy";

const LOCATIONS = [
  { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, tag: "Capital" },
  { name: "Cuttack",     lat: 20.4625, lng: 85.8830, tag: "Twin city" },
  { name: "Rourkela",    lat: 22.2604, lng: 84.8536, tag: "Steel city" },
  { name: "Sambalpur",   lat: 21.4669, lng: 83.9756, tag: "West Odisha" },
  { name: "Puri",        lat: 19.8135, lng: 85.8312, tag: "Coastal" },
  { name: "Berhampur",   lat: 19.3150, lng: 84.7941, tag: "South Odisha" },
];

function computeSolarKwh(irr: number, cloud: number, temp: number, panel: number) {
  return +(panel * (1 - (cloud / 100) * 0.75) * (1 - Math.max(0, temp - 25) * 0.004) * 0.78 * (irr / 1000)).toFixed(2);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(103,137,190,0.15)", borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 8px 24px rgba(103,137,190,0.18)",
      fontFamily: "'Outfit', sans-serif", fontSize: 12,
    }}>
      <p style={{ color: "var(--text3)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "var(--text2)" }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: "var(--text)", marginLeft: "auto", paddingLeft: 12 }}>
            {p.value}{p.name === "Temp" ? "°C" : " kWh"}
          </span>
        </div>
      ))}
    </div>
  );
};

// Animated counter
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    const dur = 800;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(+(start + (end - start) * eased).toFixed(2));
      if (p < 1) requestAnimationFrame(step);
      else prev.current = end;
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display}{suffix}</>;
}

export default function PredictionPanel() {
  const [city, setCity] = useState(LOCATIONS[0]);
  const [panelKw, setPanelKw] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const [loadStep, setLoadStep] = useState(0);

  const STEPS = [
    "Connecting to Open-Meteo API...",
    "Fetching weather forecast...",
    "Running solar model...",
    "Calculating predictions...",
  ];

  const predict = async () => {
    setLoading(true); setResult(null); setError(""); setLoadStep(0);
    const interval = setInterval(() => setLoadStep((s) => Math.min(s + 1, STEPS.length - 1)), 600);
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(city.lat));
      url.searchParams.set("longitude", String(city.lng));
      url.searchParams.set("hourly", "temperature_2m,cloudcover,shortwave_radiation");
      url.searchParams.set("forecast_days", "1");
      url.searchParams.set("timezone", "Asia/Kolkata");
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("API failed");
      const w = await res.json();
      const hours = w.hourly.time.map((t: string, i: number) => ({
        hour: t.split("T")[1].slice(0, 5),
        predicted_kwh: computeSolarKwh(w.hourly.shortwave_radiation[i], w.hourly.cloudcover[i], w.hourly.temperature_2m[i], panelKw),
        actual_kwh: null,
        cloud_cover: w.hourly.cloudcover[i],
        temperature: Math.round(w.hourly.temperature_2m[i]),
      }));
      const total = +hours.reduce((s: number, h: any) => s + h.predicted_kwh, 0).toFixed(2);
      const peak = hours.reduce((b: any, h: any) => h.predicted_kwh > b.predicted_kwh ? h : b);
      setResult({ location: city.name, panel_size_kw: panelKw, hours, total_predicted_kwh: total, peak_hour: peak.hour });
    } catch { setError("Could not fetch weather. Check your connection."); }
    clearInterval(interval);
    setLoading(false);
  };

  const peakHours = result?.hours.filter((h) => h.predicted_kwh > (result.total_predicted_kwh / 24) * 1.5) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Controls card ── */}
      <div style={{
        background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.95)",
        borderRadius: 20, padding: "24px 28px",
        boxShadow: "0 2px 16px rgba(103,137,190,0.10)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
              Solar Prediction Engine
            </h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
              AI forecast using real weather data · Open-Meteo API
            </p>
          </div>
          <div style={{
            padding: "5px 12px", borderRadius: 20,
            background: "rgba(103,137,190,0.1)", border: "1px solid rgba(103,137,190,0.2)",
            fontSize: 11, color: "var(--blue)", fontWeight: 600,
          }}>scikit-learn · Linear Regression</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "end" }}>

          {/* City selector */}
          <div>
            <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
              LOCATION
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {LOCATIONS.map((l) => (
                <button key={l.name} onClick={() => setCity(l)} style={{
                  padding: "8px 10px", borderRadius: 10,
                  background: city.name === l.name ? "var(--blue)" : "var(--surface2)",
                  border: city.name === l.name ? "none" : "1px solid var(--border2)",
                  color: city.name === l.name ? "#fff" : "var(--text2)",
                  fontSize: 12, fontWeight: city.name === l.name ? 600 : 400,
                  fontFamily: "'Outfit', sans-serif",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.18s ease",
                }}>
                  <div style={{ fontWeight: city.name === l.name ? 600 : 500 }}>{l.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{l.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel size */}
          <div>
            <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
              PANEL SIZE
            </label>
            <div style={{
              background: "var(--surface2)", border: "1px solid var(--border2)",
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>Capacity</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--blue)", letterSpacing: "-0.03em" }}>
                  {panelKw} <span style={{ fontSize: 12, fontWeight: 400 }}>kW</span>
                </span>
              </div>
              <input type="range" min={1} max={20} step={0.5} value={panelKw}
                onChange={(e) => setPanelKw(+e.target.value)} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "var(--text3)" }}>1 kW (home)</span>
                <span style={{ fontSize: 10, color: "var(--text3)" }}>20 kW (society)</span>
              </div>
            </div>
          </div>

          {/* Predict button */}
          <button onClick={predict} disabled={loading} style={{
            padding: "14px 28px", borderRadius: 12,
            background: loading ? "var(--surface3)" : "var(--blue)",
            color: loading ? "var(--text3)" : "#fff",
            fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14,
            border: "none", cursor: loading ? "wait" : "pointer",
            boxShadow: loading ? "none" : "0 3px 16px rgba(103,137,190,0.45)",
            transition: "all 0.2s ease", whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(103,137,190,0.55)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = loading ? "none" : "0 3px 16px rgba(103,137,190,0.45)"; }}
          >
            {loading ? "Predicting..." : "⚡ Predict Now"}
          </button>
        </div>

        {/* Loading steps */}
        {loading && (
          <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)" }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "4px 0",
                opacity: i <= loadStep ? 1 : 0.3, transition: "opacity 0.3s",
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: i < loadStep ? "var(--blue)" : i === loadStep ? "var(--blue)" : "var(--border2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: "#fff",
                  animation: i === loadStep ? "spin 1s linear infinite" : "none",
                }}>
                  {i < loadStep ? "✓" : i === loadStep ? "↻" : ""}
                </div>
                <span style={{ fontSize: 12, color: i <= loadStep ? "var(--text)" : "var(--text3)", fontWeight: i === loadStep ? 600 : 400 }}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(235,68,37,0.06)", border: "1px solid rgba(235,68,37,0.2)", color: "#eb4425", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {result && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, animation: "fadeUp 0.4s ease both" }}>
            {[
              { label: "Total Output", value: result.total_predicted_kwh, unit: " kWh", color: "#e6a817", bg: "rgba(230,168,23,0.08)", icon: "⚡" },
              { label: "Peak Hour", value: result.peak_hour, unit: "", color: "var(--blue)", bg: "rgba(103,137,190,0.08)", icon: "📈", isString: true },
              { label: "Est. Savings", value: +(result.total_predicted_kwh * 7.5).toFixed(0), unit: " ₹", color: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: "💰" },
              { label: "CO₂ Avoided", value: +(result.total_predicted_kwh * 0.82).toFixed(2), unit: " kg", color: "#6789be", bg: "rgba(103,137,190,0.08)", icon: "🌿" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.95)", borderRadius: 16,
                padding: "18px 20px",
                boxShadow: "0 2px 12px rgba(103,137,190,0.08)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(103,137,190,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(103,137,190,0.08)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, letterSpacing: "0.04em" }}>{s.label.toUpperCase()}</p>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.04em", marginTop: 6, lineHeight: 1 }}>
                  {s.isString ? s.value : <Counter value={s.value as number} suffix={s.unit} />}
                </p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{
            background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.95)", borderRadius: 20,
            padding: "24px 24px 16px",
            boxShadow: "0 2px 16px rgba(103,137,190,0.10)",
            animation: "fadeUp 0.5s 0.1s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                  24-Hour Solar Forecast · {result.location}
                </h3>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                  {result.panel_size_kw} kW system · {peakHours.length} peak hours today
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(230,168,23,0.1)", border: "1px solid rgba(230,168,23,0.2)", fontSize: 11, color: "#e6a817", fontWeight: 600 }}>
                  ▣ Solar kWh
                </div>
                <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(235,68,37,0.08)", border: "1px solid rgba(235,68,37,0.18)", fontSize: 11, color: "#eb4425", fontWeight: 600 }}>
                  — Temp °C
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={result.hours} margin={{ top: 4, right: 20, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e6a817" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#e6a817" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(103,137,190,0.07)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "'Outfit'" }}
                  tickFormatter={(v) => v.slice(0, 2) + "h"} axisLine={false} tickLine={false} interval={2} />
                <YAxis yAxisId="kwh" tick={{ fill: "var(--text3)", fontSize: 10, fontFamily: "'Outfit'" }}
                  axisLine={false} tickLine={false} tickFormatter={(v) => `${v}kWh`} width={44} />
                <YAxis yAxisId="temp" orientation="right"
                  tick={{ fill: "#eb4425", fontSize: 10, fontFamily: "'Outfit'", opacity: 0.6 }}
                  axisLine={false} tickLine={false} tickFormatter={(v) => `${v}°`} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="kwh" dataKey="predicted_kwh" name="Solar" fill="url(#solarGrad)"
                  radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temp"
                  stroke="#eb4425" strokeWidth={2} dot={false} opacity={0.6} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Hour heatmap strip */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 500 }}>HOURLY INTENSITY</p>
              <div style={{ display: "flex", gap: 2 }}>
                {result.hours.map((h) => {
                  const max = Math.max(...result.hours.map((x) => x.predicted_kwh));
                  const intensity = max > 0 ? h.predicted_kwh / max : 0;
                  return (
                    <div key={h.hour} title={`${h.hour}: ${h.predicted_kwh} kWh`} style={{
                      flex: 1, height: 12, borderRadius: 3,
                      background: `rgba(230,168,23,${0.08 + intensity * 0.85})`,
                      transition: "transform 0.15s",
                      cursor: "default",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scaleY(1.5)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scaleY(1)"; }}
                    />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--text3)" }}>12 AM</span>
                <span style={{ fontSize: 10, color: "var(--text3)" }}>12 PM</span>
                <span style={{ fontSize: 10, color: "var(--text3)" }}>11 PM</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div style={{
          background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.9)", borderRadius: 20,
          padding: "60px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>☀</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>
            Ready to predict
          </p>
          <p style={{ fontSize: 13, color: "var(--text3)" }}>
            Select a city, set your panel size, and click Predict Now
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
