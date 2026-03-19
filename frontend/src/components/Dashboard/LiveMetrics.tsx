"use client";
import { useEffect, useRef } from "react";
import { EnergyReading } from "@/types/energy";

interface Props {
  data: EnergyReading | null;
  carbonTotal: number;
  moneyTotal: number;
  history: EnergyReading[];
}

function Sparkline({ values, color, fill }: { values: number[]; color: string; fill: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || values.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.offsetWidth * window.devicePixelRatio;
    const h = canvas.offsetHeight * window.devicePixelRatio;
    canvas.width = w; canvas.height = h;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    ctx.clearRect(0, 0, cw, ch);
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const pts = values.map((v, i) => ({
      x: (i / (values.length - 1)) * cw,
      y: ch - ((v - min) / range) * (ch - 8) - 4,
    }));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, ch);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, ch);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.beginPath();
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
  }, [values, color, fill]);
  return <canvas ref={ref} style={{ display: "block", width: "100%", height: 44 }} />;
}

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || values.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.offsetWidth * window.devicePixelRatio;
    const h = canvas.offsetHeight * window.devicePixelRatio;
    canvas.width = w; canvas.height = h;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    ctx.clearRect(0, 0, cw, ch);
    const max = Math.max(...values) || 1;
    const gap = cw / values.length;
    const barW = gap * 0.55;
    values.forEach((v, i) => {
      const barH = Math.max(2, (v / max) * (ch - 4));
      const x = i * gap + gap * 0.225;
      const y = ch - barH;
      const grad = ctx.createLinearGradient(0, y, 0, ch);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "30");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 3);
      ctx.fill();
    });
  }, [values, color]);
  return <canvas ref={ref} style={{ display: "block", width: "100%", height: 48 }} />;
}

function CandleChart({ history }: { history: EnergyReading[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.offsetWidth * window.devicePixelRatio;
    const h = canvas.offsetHeight * window.devicePixelRatio;
    canvas.width = w; canvas.height = h;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    ctx.clearRect(0, 0, cw, ch);
    const vals = history.map((r) => r.production_kw);
    const max = Math.max(...vals) || 1;
    const gap = cw / vals.length;
    const barW = Math.max(3, gap * 0.55);
    vals.forEach((v, i) => {
      const prev = i > 0 ? vals[i - 1] : v;
      const isUp = v >= prev;
      const color = isUp ? "#22c55e" : "#eb4425";
      const barH = Math.max(2, (v / max) * (ch - 8));
      const x = i * gap + (gap - barW) / 2;
      const y = ch - barH;
      ctx.strokeStyle = color + "99";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + barW / 2, Math.max(0, y - 3));
      ctx.lineTo(x + barW / 2, y);
      ctx.stroke();
      const grad = ctx.createLinearGradient(0, y, 0, ch);
      grad.addColorStop(0, color + "dd");
      grad.addColorStop(1, color + "30");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 3);
      ctx.fill();
    });
  }, [history]);
  return <canvas ref={ref} style={{ display: "block", width: "100%", height: 60 }} />;
}

function BatteryArc({ percent }: { percent: number }) {
  const r = 34, cx = 50, cy = 52;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const angle = startAngle + (endAngle - startAngle) * (Math.min(100, percent) / 100);
  const toXY = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const bg1 = toXY(startAngle), bg2 = toXY(endAngle), fg2 = toXY(angle);
  const bigArc = angle - startAngle > Math.PI ? 1 : 0;
  const color = percent > 60 ? "#22c55e" : percent > 30 ? "#e6a817" : "#eb4425";
  return (
    <svg width="100" height="80" viewBox="0 0 100 80" style={{ overflow: "visible" }}>
      <path d={`M ${bg1.x} ${bg1.y} A ${r} ${r} 0 1 1 ${bg2.x} ${bg2.y}`}
        fill="none" stroke="rgba(103,137,190,0.12)" strokeWidth="8" strokeLinecap="round" />
      {percent > 0 && (
        <path d={`M ${bg1.x} ${bg1.y} A ${r} ${r} 0 ${bigArc} 1 ${fg2.x} ${fg2.y}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      )}
      <text x="50" y="56" textAnchor="middle" fill={color}
        style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
        {percent.toFixed(0)}%
      </text>
    </svg>
  );
}

export default function LiveMetrics({ data, carbonTotal, moneyTotal, history }: Props) {
  const prod = data?.production_kw ?? 0;
  const cons = data?.consumption_kw ?? 0;
  const batt = data?.battery_percent ?? 0;
  const exp  = data?.grid_export_kw ?? 0;

  const prodH = history.map((r) => r.production_kw);
  const consH = history.map((r) => r.consumption_kw);
  const expH  = history.map((r) => r.grid_export_kw);

  const glass = (): React.CSSProperties => ({
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.95)",
    borderRadius: 20,
    boxShadow: "0 2px 16px rgba(103,137,190,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
    overflow: "hidden",
    position: "relative",
    transition: "transform 0.22s ease, box-shadow 0.22s ease",
    cursor: "default",
  });

  const hover = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(-3px)";
      e.currentTarget.style.boxShadow = "0 8px 32px rgba(103,137,190,0.18), inset 0 1px 0 rgba(255,255,255,0.9)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 16px rgba(103,137,190,0.10), inset 0 1px 0 rgba(255,255,255,0.9)";
    },
  };

  const Lbl = ({ t }: { t: string }) => (
    <p style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, letterSpacing: "0.04em", marginBottom: 4 }}>
      {t.toUpperCase()}
    </p>
  );

  const Num = ({ v, u, c }: { v: string | number; u: string; c: string }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
      <span style={{ fontSize: 32, fontWeight: 800, color: c, lineHeight: 1, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
        {typeof v === "number" ? v.toFixed(v >= 10 ? 1 : 2) : v}
      </span>
      <span style={{ fontSize: 13, color: "var(--text3)" }}>{u}</span>
    </div>
  );

  const Dot = ({ c }: { c: string }) => (
    <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 0 4px ${c}28` }} />
  );

  const Corner = ({ c }: { c: string }) => (
    <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 20px 0 80px", background: c, pointerEvents: "none" }} />
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>

      {/* Solar Production — wide with candle chart */}
      <div className="fade-up" style={{ ...glass(), gridColumn: "span 5", padding: "20px 22px 16px" }} {...hover}>
        <Dot c="#e6a817" />
        <Corner c="rgba(230,168,23,0.06)" />
        <Lbl t="Solar Production" />
        <Num v={prod} u="kW" c="#e6a817" />
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>Peak window 11 AM – 3 PM</p>
        {history.length > 1
          ? <CandleChart history={history} />
          : <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 11 }}>Collecting data...</div>
        }
        <div className="flex justify-between" style={{ marginTop: 6 }}>
          <span style={{ fontSize: 10, color: "#22c55e" }}>↑ rising</span>
          <span style={{ fontSize: 10, color: "#eb4425" }}>↓ falling</span>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>last {history.length} pts</span>
        </div>
      </div>

      {/* Consumption — medium with sparkline */}
      <div className="fade-up-1" style={{ ...glass(), gridColumn: "span 4", padding: "20px 22px 16px" }} {...hover}>
        <Dot c="#6789be" />
        <Corner c="rgba(103,137,190,0.06)" />
        <Lbl t="Consumption" />
        <Num v={cons} u="kW" c="#6789be" />
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>Normal range</p>
        <Sparkline
          values={consH.length > 3 ? consH : [2.1, 2.8, 2.4, 3.1, 2.6, 3.3, cons]}
          color="#6789be" fill="rgba(103,137,190,0.10)"
        />
      </div>

      {/* Battery arc — compact */}
      <div className="fade-up-2" style={{ ...glass(), gridColumn: "span 3", padding: "20px 22px 16px", display: "flex", flexDirection: "column", alignItems: "center" }} {...hover}>
        <p style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, letterSpacing: "0.04em", alignSelf: "flex-start", marginBottom: 6 }}>BATTERY</p>
        <BatteryArc percent={batt} />
        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, textAlign: "center" }}>
          {batt > 60 ? "↑ Charging" : batt > 30 ? "Normal" : "⚠ Low"}
        </p>
      </div>

      {/* Grid Export — bar chart */}
      <div className="fade-up-3" style={{ ...glass(), gridColumn: "span 3", padding: "20px 22px 16px" }} {...hover}>
        <Dot c="#eb4425" />
        <Corner c="rgba(235,68,37,0.05)" />
        <Lbl t="Grid Export" />
        <Num v={exp} u="kW" c="#eb4425" />
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>Earning credits</p>
        <MiniBar
          values={expH.length > 3 ? expH : [0.1, 0.5, 0.2, 0.9, 0.4, 1.1, exp]}
          color="#eb4425"
        />
      </div>

      {/* CO2 saved — sparkline */}
      <div className="fade-up-4" style={{ ...glass(), gridColumn: "span 4", padding: "20px 22px 16px" }} {...hover}>
        <Dot c="#22c55e" />
        <Corner c="rgba(34,197,94,0.05)" />
        <Lbl t="CO₂ Saved Today" />
        <Num v={carbonTotal.toFixed(2)} u="kg" c="#22c55e" />
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>Clean energy impact</p>
        <Sparkline
          values={prodH.length > 3 ? prodH.map((v) => v * 0.82) : [0.4, 1.0, 0.8, 1.5, 1.2, 1.9]}
          color="#22c55e" fill="rgba(34,197,94,0.10)"
        />
      </div>

      {/* Savings — progress bar */}
      <div className="fade-up-5" style={{
        ...glass(), gridColumn: "span 5", padding: "20px 22px 18px",
        background: "linear-gradient(135deg, rgba(230,168,23,0.10) 0%, rgba(255,255,255,0.82) 55%)",
      }} {...hover}>
        <Corner c="rgba(230,168,23,0.08)" />
        <Lbl t="Saved Today" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#e6a817", lineHeight: 1, letterSpacing: "-0.05em" }}>
            ₹{Math.round(moneyTotal)}
          </span>
        </div>
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14 }}>vs grid rate ₹9/unit</p>
        <div style={{ background: "rgba(230,168,23,0.15)", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 6 }}>
          <div style={{
            height: "100%", borderRadius: 6,
            background: "linear-gradient(90deg, #e6a817 0%, #fbbf24 100%)",
            width: `${Math.min(100, (moneyTotal / 500) * 100)}%`,
            transition: "width 1s ease",
            boxShadow: "0 0 8px rgba(230,168,23,0.4)",
          }} />
        </div>
        <div className="flex justify-between">
          <span style={{ fontSize: 10, color: "var(--text3)" }}>₹0</span>
          <span style={{ fontSize: 10, color: "#e6a817", fontWeight: 600 }}>
            {Math.round((moneyTotal / 500) * 100)}% of daily goal
          </span>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>₹500</span>
        </div>
      </div>

    </div>
  );
}
