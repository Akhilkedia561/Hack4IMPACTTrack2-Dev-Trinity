"use client";
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { EnergyReading } from "@/types/energy";

interface Props { history: EnergyReading[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(103,137,190,0.15)",
      borderRadius: 14, padding: "12px 16px",
      boxShadow: "0 8px 32px rgba(103,137,190,0.18)",
      fontSize: 13, fontFamily: "'Outfit', sans-serif",
      minWidth: 160,
    }}>
      <p style={{ color: "var(--text3)", marginBottom: 8, fontSize: 11, fontWeight: 500 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--text2)", fontSize: 12, flex: 1 }}>{p.name}</span>
          <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>
            {p.value} {p.dataKey === "Battery" ? "%" : "kW"}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }: any) => (
  <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 12, paddingLeft: 8 }}>
    {payload?.map((p: any) => (
      <div key={p.value} style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 24, height: 3, background: p.color, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>{p.value}</span>
      </div>
    ))}
  </div>
);

export default function EnergyChart({ history }: Props) {
  const data = history.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    Production: +r.production_kw.toFixed(2),
    Consumption: +r.consumption_kw.toFixed(2),
    Battery: +r.battery_percent.toFixed(1),
  }));

  const maxKw = Math.max(...data.map((d) => Math.max(d.Production, d.Consumption)), 10);

  return (
    <div style={{
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.95)",
      borderRadius: 20,
      boxShadow: "0 2px 16px rgba(103,137,190,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
      padding: "24px 24px 16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
            Real-Time Energy Flow
          </h3>
          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>Updated every 5 seconds</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mini stat pills */}
          {data.length > 0 && [
            { label: "Now", value: `${data[data.length - 1]?.Production ?? 0} kW`, color: "#e6a817", bg: "rgba(230,168,23,0.1)" },
            { label: "Load", value: `${data[data.length - 1]?.Consumption ?? 0} kW`, color: "#6789be", bg: "rgba(103,137,190,0.1)" },
          ].map((s) => (
            <div key={s.label} style={{
              padding: "5px 12px", borderRadius: 20,
              background: s.bg, border: `1px solid ${s.bg.replace('0.1', '0.2')}`,
            }}>
              <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label} </span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 20, padding: "5px 12px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulseDot 1.5s infinite" }} />
            <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>Live</span>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>
          Collecting data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e6a817" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#e6a817" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="consFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6789be" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#6789be" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="battFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(103,137,190,0.07)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fill: "var(--text3)", fontSize: 11, fontFamily: "'Outfit'" }}
              axisLine={false} tickLine={false}
              interval={Math.floor(data.length / 6)}
            />

            {/* Left Y: kW */}
            <YAxis
              yAxisId="kw"
              domain={[0, Math.ceil(maxKw * 1.3)]}
              tick={{ fill: "var(--text3)", fontSize: 11, fontFamily: "'Outfit'" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `${v}kW`}
              width={40}
            />

            {/* Right Y: % battery */}
            <YAxis
              yAxisId="pct"
              orientation="right"
              domain={[0, 110]}
              tick={{ fill: "#22c55e", fontSize: 11, fontFamily: "'Outfit'", opacity: 0.6 }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />

            {/* Production area */}
            <Area
              yAxisId="kw"
              type="monotone"
              dataKey="Production"
              stroke="#e6a817"
              strokeWidth={2.5}
              fill="url(#prodFill)"
              dot={false}
              activeDot={{ r: 5, fill: "#e6a817", strokeWidth: 0 }}
            />

            {/* Consumption line */}
            <Area
              yAxisId="kw"
              type="monotone"
              dataKey="Consumption"
              stroke="#6789be"
              strokeWidth={2}
              fill="url(#consFill)"
              dot={false}
              strokeDasharray="6 3"
              activeDot={{ r: 4, fill: "#6789be", strokeWidth: 0 }}
            />

            {/* Battery on right axis */}
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="Battery"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <style>{`@keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
