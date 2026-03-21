"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface Appliance {
  id: string;
  name: string;
  watt: number;
  duration: number;
  icon: string;
}

interface ScheduledSlot {
  appliance: Appliance;
  hour: number;
  endHour: number;
  surplusKw: number;
  savingsInr: number;
  status: "upcoming" | "running" | "done" | "unavailable";
}

interface LiveReading {
  production_kw: number;
  consumption_kw: number;
  battery_percent: number;
}

const APPLIANCES: Appliance[] = [
  { id: "wash",    name: "Washing Machine", watt: 2000, duration: 1, icon: "🫧" },
  { id: "ac",      name: "AC (1.5 ton)",    watt: 1800, duration: 3, icon: "❄️" },
  { id: "pump",    name: "Water Pump",      watt: 750,  duration: 1, icon: "💧" },
  { id: "ev",      name: "EV Charger",      watt: 3300, duration: 4, icon: "🔌" },
  { id: "geyser",  name: "Geyser",          watt: 2000, duration: 1, icon: "🚿" },
  { id: "grinder", name: "Mixer/Grinder",   watt: 750,  duration: 1, icon: "⚙️" },
];

const PEAK_HOURS   = [18, 19, 20];
const AVG_RATE_INR = 6.5;
const BASE_LOAD_KW = 1.2;

function fmtHour(h: number) {
  if (h < 0) return "—";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${ampm}`;
}

function buildForecastFromLive(liveProduction: number, currentHour: number): number[] {
  return Array.from({ length: 24 }, (_, h) => {
    const factor = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
    const currentFactor = Math.max(0.01, Math.sin(((currentHour - 6) / 12) * Math.PI));
    const peak = currentFactor > 0 ? liveProduction / currentFactor : liveProduction;
    return +(factor * Math.min(peak, 10) + (Math.random() * 0.15)).toFixed(2);
  });
}

function getSlotStatus(hour: number, endHour: number, currentHour: number): ScheduledSlot["status"] {
  if (hour < 0) return "unavailable";
  if (currentHour >= hour && currentHour < endHour) return "running";
  if (currentHour >= endHour) return "done";
  return "upcoming";
}

function buildSchedule(forecast: number[], currentHour: number): ScheduledSlot[] {
  const hourly = forecast.map((prod, h) => ({
    h, surplus: prod - BASE_LOAD_KW, isPeak: PEAK_HOURS.includes(h),
  }));
  const goodHours = [...hourly]
    .filter(h => h.surplus > 0.5 && !h.isPeak)
    .sort((a, b) => b.surplus - a.surplus);

  const usedHours = new Set<number>();
  return APPLIANCES.map(app => {
    const match = goodHours.find(slot => {
      for (let d = 0; d < app.duration; d++) {
        if (usedHours.has(slot.h + d)) return false;
        if (PEAK_HOURS.includes(slot.h + d)) return false;
        if (!forecast[slot.h + d] || forecast[slot.h + d] - BASE_LOAD_KW < 0.3) return false;
      }
      return true;
    });
    if (match) {
      for (let d = 0; d < app.duration; d++) usedHours.add(match.h + d);
      return {
        appliance: app,
        hour: match.h, endHour: match.h + app.duration,
        surplusKw: +match.surplus.toFixed(1),
        savingsInr: +((app.watt / 1000) * app.duration * AVG_RATE_INR).toFixed(1),
        status: getSlotStatus(match.h, match.h + app.duration, currentHour),
      } as ScheduledSlot;
    }
    return { appliance: app, hour: -1, endHour: -1, surplusKw: 0, savingsInr: 0, status: "unavailable" as const };
  });
}

const STATUS_META: Record<ScheduledSlot["status"], { bg: string; border: string; badgeBg: string; badgeColor: string; dot: string; label: string }> = {
  running:     { bg: "rgba(230,168,23,0.08)",  border: "rgba(230,168,23,0.3)",  badgeBg: "rgba(230,168,23,0.15)",  badgeColor: "#e6a817", dot: "#e6a817", label: "RUNNING NOW" },
  upcoming:    { bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.25)",  badgeBg: "rgba(34,197,94,0.12)",   badgeColor: "#22c55e", dot: "#22c55e", label: "UPCOMING"    },
  done:        { bg: "rgba(103,137,190,0.07)", border: "rgba(103,137,190,0.2)", badgeBg: "rgba(103,137,190,0.12)", badgeColor: "#6789be", dot: "#6789be", label: "DONE"        },
  unavailable: { bg: "var(--surface2,rgba(0,0,0,0.03))", border: "var(--border,rgba(0,0,0,0.1))", badgeBg: "var(--surface2,rgba(0,0,0,0.05))", badgeColor: "var(--text3,#999)", dot: "var(--text3,#999)", label: "LOW SOLAR" },
};

export default function ApplianceScheduler({
  liveReading,
  city = "Bhubaneswar",
}: {
  liveReading?: LiveReading;
  city?: string;
}) {
  const [schedule,    setSchedule]    = useState<ScheduledSlot[]>([]);
  const [forecast,    setForecast]    = useState<number[]>([]);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const prevProdRef   = useRef<number>(0);
  const scheduleBuilt = useRef(false);

  const rebuildSchedule = useCallback((prodKw: number, hour: number) => {
    const fc = buildForecastFromLive(prodKw, hour);
    setForecast(fc);
    setSchedule(buildSchedule(fc, hour));
    setLastRefresh(new Date());
    scheduleBuilt.current = true;
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    setCurrentHour(hour);
    const prod  = liveReading?.production_kw ?? 6.5;
    const delta = Math.abs(prod - prevProdRef.current);
    if (delta > 0.5 || !scheduleBuilt.current) {
      prevProdRef.current = prod;
      rebuildSchedule(prod, hour);
    }
  }, [liveReading?.production_kw, rebuildSchedule]);

  useEffect(() => {
    const id = setInterval(() => {
      const hour = new Date().getHours();
      setCurrentHour(hour);
      setSchedule(prev => prev.map(s => ({
        ...s,
        status: s.hour >= 0 ? getSlotStatus(s.hour, s.endHour, hour) : "unavailable",
      })));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const scheduled   = schedule.filter(s => s.status !== "unavailable");
  const unavailable = schedule.filter(s => s.status === "unavailable");
  const totalSavings = scheduled.reduce((sum, s) => sum + s.savingsInr, 0);
  const peakHour    = forecast.length ? forecast.indexOf(Math.max(...forecast)) : 12;
  const liveNow     = liveReading?.production_kw ?? 0;
  const surplusNow  = Math.max(0, liveNow - (liveReading?.consumption_kw ?? BASE_LOAD_KW));

  return (
    <div style={{
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(20px)",
      border: "1px solid var(--border, rgba(0,0,0,0.1))",
      borderRadius: 20,
      padding: 24,
      fontFamily: "Outfit, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🗓</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Smart Appliance Scheduler</p>
          </div>
          <p style={{ fontSize: 11, color: "var(--text3)" }}>
            {city} · TPCODL tariff-aware · Peak solar {fmtHour(peakHour)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            background: surplusNow > 0 ? "rgba(34,197,94,0.1)" : "rgba(235,68,37,0.08)",
            border: `1px solid ${surplusNow > 0 ? "rgba(34,197,94,0.3)" : "rgba(235,68,37,0.25)"}`,
            borderRadius: 30, padding: "5px 12px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: surplusNow > 0 ? "#22c55e" : "#eb4425", animation: "asPulse 2s infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: surplusNow > 0 ? "#22c55e" : "#eb4425", fontWeight: 600 }}>
              {surplusNow > 0 ? `+${surplusNow.toFixed(1)} kW surplus` : "No surplus"}
            </span>
          </div>

          <div style={{
            background: "rgba(230,168,23,0.08)",
            border: "1px solid rgba(230,168,23,0.25)",
            borderRadius: 14, padding: "8px 16px", textAlign: "center",
          }}>
            <p style={{ fontSize: 9, color: "var(--text3)", marginBottom: 2 }}>TODAY'S SAVINGS</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#e6a817", letterSpacing: "-0.03em", lineHeight: 1 }}>
              ₹{totalSavings.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* ── 24hr forecast bar ── */}
      <div style={{
        background: "var(--surface2, rgba(0,0,0,0.03))",
        border: "1px solid var(--border, rgba(0,0,0,0.08))",
        borderRadius: 14, padding: "14px 14px 10px", marginBottom: 16,
      }}>
        <p style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 10 }}>
          24-HR SOLAR FORECAST + SCHEDULE
        </p>
        <div style={{ display: "flex", height: 44, gap: 2, alignItems: "flex-end" }}>
          {forecast.map((kw, h) => {
            const slot      = scheduled.find(s => h >= s.hour && h < s.endHour);
            const isPeak    = PEAK_HOURS.includes(h);
            const isCurrent = h === currentHour;
            const barH      = Math.max(3, (kw / 10) * 44);
            const bg = isPeak
              ? "rgba(235,68,37,0.45)"
              : slot?.status === "running"  ? "#e6a817"
              : slot?.status === "upcoming" ? "#22c55e"
              : slot?.status === "done"     ? "rgba(103,137,190,0.5)"
              : "rgba(103,137,190,0.25)";
            return (
              <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: 44, position: "relative" }}>
                {isCurrent && (
                  <div style={{ position: "absolute", top: 0, width: 2, height: "100%", background: "var(--text, #333)", opacity: 0.3, borderRadius: 1 }} />
                )}
                <div style={{ width: "100%", height: barH, borderRadius: "3px 3px 0 0", background: bg, transition: "height 0.4s ease" }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          {["12A","3A","6A","9A","12P","3P","6P","9P","12A"].map((l, i) => (
            <span key={i} style={{ fontSize: 9, color: "var(--text3)" }}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
          {[
            { color: "#22c55e",                    label: "Scheduled" },
            { color: "#e6a817",                    label: "Running now" },
            { color: "rgba(103,137,190,0.5)",      label: "Solar" },
            { color: "rgba(235,68,37,0.5)",        label: "Peak tariff" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 10, color: "var(--text3)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Peak tariff warning ── */}
      <div style={{
        marginBottom: 16, padding: "10px 14px",
        background: "rgba(235,68,37,0.06)",
        border: "1px solid rgba(235,68,37,0.2)",
        borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#eb4425", animation: "asWarn 0.9s infinite", flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "#eb4425", fontWeight: 600 }}>
          Avoid 6:00 PM – 9:00 PM · TPCODL peak slab ₹7.5/unit
        </p>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#eb4425", opacity: 0.7 }}>
          {PEAK_HOURS.includes(currentHour) ? "⚠ ACTIVE NOW" : `${fmtHour(PEAK_HOURS[0])} – ${fmtHour(PEAK_HOURS[PEAK_HOURS.length - 1] + 1)}`}
        </div>
      </div>

      {/* ── Scheduled appliances ── */}
      <p style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 10 }}>
        RECOMMENDED SCHEDULE
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {scheduled.map(slot => {
          const st     = STATUS_META[slot.status];
          const isOpen = expanded === slot.appliance.id;
          const kwhUsed = (slot.appliance.watt / 1000) * slot.appliance.duration;

          return (
            <div
              key={slot.appliance.id}
              onClick={() => setExpanded(isOpen ? null : slot.appliance.id)}
              style={{
                borderRadius: 14, overflow: "hidden",
                background: st.bg,
                border: `1px solid ${st.border}`,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                {/* Icon */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <span style={{ fontSize: 22 }}>{slot.appliance.icon}</span>
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 8, height: 8, borderRadius: "50%",
                    background: st.dot,
                    border: "1.5px solid var(--bg, #fff)",
                    animation: slot.status === "running" ? "asPulse 1.2s infinite" : "none",
                  }} />
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{slot.appliance.name}</p>
                  <p style={{ fontSize: 11, color: "var(--text3)" }}>{slot.appliance.watt}W · {slot.appliance.duration}hr</p>
                </div>

                {/* Time */}
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmtHour(slot.hour)}</p>
                  <p style={{ fontSize: 10, color: "var(--text3)" }}>→ {fmtHour(slot.endHour)}</p>
                </div>

                {/* Savings */}
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#e6a817" }}>₹{slot.savingsInr}</p>
                  <p style={{ fontSize: 10, color: "var(--text3)" }}>saved</p>
                </div>

                {/* Badge */}
                <div style={{
                  background: st.badgeBg,
                  border: `1px solid ${st.border}`,
                  borderRadius: 20, padding: "3px 10px", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: st.badgeColor, letterSpacing: "0.05em" }}>
                    {st.label}
                  </span>
                </div>

                <span style={{ fontSize: 10, color: "var(--text3)", marginLeft: 2 }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${st.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
                    {[
                      { label: "Solar surplus", value: `${slot.surplusKw} kW`,            color: "#6789be" },
                      { label: "Energy used",   value: `${kwhUsed.toFixed(1)} kWh`,       color: "#e6a817" },
                      { label: "Bill saving",   value: `₹${slot.savingsInr}`,              color: "#22c55e" },
                      { label: "CO₂ avoided",  value: `${(kwhUsed * 0.82).toFixed(2)} kg`, color: "#9aaabe" },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: `${s.color}12`,
                        border: `1px solid ${s.color}30`,
                        borderRadius: 10, padding: "10px 12px",
                      }}>
                        <p style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>{s.label}</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 10, lineHeight: 1.6 }}>
                    💡 Solar surplus at {fmtHour(slot.hour)} is {slot.surplusKw} kW —
                    enough to fully power this appliance from solar, avoiding ₹{slot.savingsInr} in TPCODL grid charges.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Unavailable ── */}
      {unavailable.length > 0 && (
        <>
          <p style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, letterSpacing: "0.08em", margin: "16px 0 10px" }}>
            INSUFFICIENT SOLAR TODAY
          </p>
          {unavailable.map(slot => (
            <div key={slot.appliance.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", borderRadius: 12, marginBottom: 6,
              background: "var(--surface2, rgba(0,0,0,0.03))",
              border: "1px solid var(--border, rgba(0,0,0,0.08))",
              opacity: 0.55,
            }}>
              <span style={{ fontSize: 20 }}>{slot.appliance.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{slot.appliance.name}</p>
                <p style={{ fontSize: 11, color: "var(--text3)" }}>{slot.appliance.watt}W</p>
              </div>
              <p style={{ fontSize: 11, color: "var(--text3)" }}>Use at off-peak night rate</p>
            </div>
          ))}
        </>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 10, color: "var(--text3)" }}>
          Updated · {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <button
          onClick={() => rebuildSchedule(liveReading?.production_kw ?? 6.5, new Date().getHours())}
          style={{
            background: "var(--surface2, rgba(0,0,0,0.04))",
            border: "1px solid var(--border, rgba(0,0,0,0.1))",
            borderRadius: 8, padding: "5px 12px",
            fontSize: 11, color: "var(--text2, #555)",
            cursor: "pointer", fontFamily: "Outfit, sans-serif",
          }}
        >
          ↺ Refresh
        </button>
      </div>

      <style>{`
        @keyframes asPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes asWarn  { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>
    </div>
  );
}
