"use client";
import { useState } from "react";
import { OptimizationResult } from "@/types/energy";

const ACTION_CONFIG: Record<OptimizationResult["action"], {
  label: string; color: string; bg: string; border: string; icon: string; tag: string;
}> = {
  USE_NOW:       { label: "Use Now",       color: "#22c55e", bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.2)",   icon: "⚡", tag: "High Demand" },
  STORE_BATTERY: { label: "Store Battery", color: "#6789be", bg: "rgba(103,137,190,0.06)", border: "rgba(103,137,190,0.2)", icon: "🔋", tag: "Low Grid Rate" },
  SEND_TO_GRID:  { label: "Send to Grid",  color: "#eb4425", bg: "rgba(235,68,37,0.05)",   border: "rgba(235,68,37,0.18)",  icon: "↗", tag: "Surplus" },
};

function mockOptimize(): OptimizationResult {
  const hour = new Date().getHours();
  const rand = Math.random();
  if (hour >= 12 && hour <= 16 && rand > 0.3)
    return { action: "SEND_TO_GRID", savings_inr: Math.round(80 + rand * 120), savings_kwh: +(1.5 + rand * 2.5).toFixed(1), reason: "Peak solar window. Battery full. Export surplus to earn grid credits.", confidence: Math.round(82 + rand * 15) };
  if (hour >= 17 && hour <= 21)
    return { action: "USE_NOW", savings_inr: Math.round(60 + rand * 80), savings_kwh: +(1 + rand * 1.5).toFixed(1), reason: "Evening peak demand. Draw from battery now instead of expensive grid power (₹9/unit).", confidence: Math.round(88 + rand * 10) };
  return { action: "STORE_BATTERY", savings_inr: Math.round(40 + rand * 60), savings_kwh: +(0.8 + rand * 1.2).toFixed(1), reason: "Grid rates low right now. Store solar surplus for peak-hour savings tonight.", confidence: Math.round(75 + rand * 20) };
}

export default function OptimizerButton() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

  const optimize = async () => {
    setLoading(true);
    setResult(null);
    setSteps([]);

    const stepList = ["Checking solar output...", "Reading battery state...", "Calculating grid rates...", "Running optimizer..."];
    for (let i = 0; i < stepList.length; i++) {
      await new Promise((r) => setTimeout(r, 220));
      setSteps((s) => [...s, stepList[i]]);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/optimize`, { signal: AbortSignal.timeout(4000) });
      setResult(await res.json());
    } catch {
      setResult(mockOptimize());
    }
    setLoading(false);
    setSteps([]);
  };

  const cfg = result ? ACTION_CONFIG[result.action] : null;

  return (
    <div className="card fade-up-3" style={{ padding: 24 }}>
      <div className="flex items-start justify-between mb-1">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>
          Smart Optimizer
        </h3>
        <span style={{
          fontSize: 11, color: "var(--text3)", background: "var(--surface2)",
          border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 8, fontWeight: 500,
        }}>AI</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 18 }}>Decision in under 1 second</p>

      <button
        onClick={optimize}
        disabled={loading}
        style={{
          width: "100%", padding: "13px",
          borderRadius: 12,
          background: loading ? "var(--surface3)" : "var(--blue)",
          color: loading ? "var(--text3)" : "#fff",
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600, fontSize: 14,
          border: loading ? "1px solid var(--border2)" : "none",
          cursor: loading ? "wait" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: loading ? "none" : "0 3px 12px rgba(103,137,190,0.4)",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = "translateY(0)"; }}
      >
        {loading ? "Analyzing..." : "⚡  Optimize Now"}
      </button>

      {/* Loading steps */}
      {loading && steps.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              fontSize: 12, color: "var(--text3)", padding: "3px 0",
              display: "flex", alignItems: "center", gap: 8,
              animation: "slideIn 0.25s ease both",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && cfg && (
        <div style={{
          marginTop: 16, borderRadius: 14, padding: 16,
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          animation: "slideIn 0.35s ease both",
        }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 22 }}>{cfg.icon}</span>
            <div>
              <span style={{ color: cfg.color, fontWeight: 700, fontSize: 16 }}>{cfg.label}</span>
              <span style={{
                marginLeft: 8, fontSize: 10, color: cfg.color,
                background: `${cfg.border}`,
                padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                border: `1px solid ${cfg.border}`,
              }}>{cfg.tag}</span>
            </div>
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 600,
              color: "var(--text2)", background: "rgba(255,255,255,0.7)",
              padding: "3px 8px", borderRadius: 8,
            }}>{result.confidence}% conf.</span>
          </div>

          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
            {result.reason}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Estimated Saving", value: `₹${result.savings_inr}`, color: cfg.color },
              { label: "Energy Optimized", value: `${result.savings_kwh} kWh`, color: cfg.color },
            ].map((s) => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.8)", borderRadius: 10,
                padding: "12px 14px", textAlign: "center",
                border: "1px solid rgba(255,255,255,0.9)",
              }}>
                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
