"use client";
import { useState, useEffect } from "react";
import { EnergyNode } from "@/types/energy";

const NODES: EnergyNode[] = [
  { id: "bbsr",  name: "Bhubaneswar Solar Farm",    lat: 20.2961, lng: 85.8245, type: "solar",    value: 8.4,  status: "active"  },
  { id: "ctk",   name: "Cuttack Battery Hub",        lat: 20.4625, lng: 85.8830, type: "battery",  value: 78,   status: "active"  },
  { id: "rkl",   name: "Rourkela Grid Node",          lat: 22.2604, lng: 84.8536, type: "grid",     value: 12.1, status: "active"  },
  { id: "puri",  name: "Puri Coastal Solar",          lat: 19.8135, lng: 85.8312, type: "solar",    value: 6.2,  status: "active"  },
  { id: "smb",   name: "Sambalpur Consumer",          lat: 21.4669, lng: 83.9756, type: "consumer", value: 4.8,  status: "idle"    },
  { id: "bhm",   name: "Berhampur Solar",             lat: 19.3150, lng: 84.7941, type: "solar",    value: 5.9,  status: "active"  },
  { id: "krl",   name: "Koraput Battery",             lat: 18.8120, lng: 82.7097, type: "battery",  value: 32,   status: "warning" },
  { id: "ang",   name: "Angul Industrial Grid",       lat: 20.8380, lng: 85.1010, type: "grid",     value: 18.5, status: "active"  },
  { id: "blgr",  name: "Balangir Solar Park",         lat: 20.7108, lng: 83.4842, type: "solar",    value: 7.1,  status: "active"  },
  { id: "kndml", name: "Kandhamal Heatwave Zone",     lat: 20.1167, lng: 84.2333, type: "consumer", value: 9.2,  status: "warning" },
];

const TYPE_META = {
  solar:    { color: "#e6a817", label: "Solar",    unit: "kW" },
  battery:  { color: "#22c55e", label: "Battery",  unit: "%" },
  grid:     { color: "#6789be", label: "Grid",     unit: "kW" },
  consumer: { color: "#eb4425", label: "Consumer", unit: "kW" },
};

const STATUS_META = {
  active:  { color: "#22c55e", label: "Active"  },
  idle:    { color: "#9aaabe", label: "Idle"    },
  warning: { color: "#eb4425", label: "Warning" },
};

// Convert lat/lng to pixel position within Odisha bounding box
// Odisha approx: lat 17.8–22.6, lng 81.3–87.5
const LAT_MIN = 17.8, LAT_MAX = 22.6;
const LNG_MIN = 81.3, LNG_MAX = 87.5;

function toPercent(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100;
  return { x, y };
}

export default function OdishaMap() {
  const [selected, setSelected] = useState<EnergyNode | null>(null);
  const [liveValues, setLiveValues] = useState<Record<string, number>>({});
  const [tooltip, setTooltip] = useState<{ node: EnergyNode; x: number; y: number } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const updates: Record<string, number> = {};
      NODES.forEach((n) => {
        updates[n.id] = +(n.value + (Math.random() - 0.5) * n.value * 0.08).toFixed(1);
      });
      setLiveValues(updates);
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const FLOWS: [string, string][] = [
    ["bbsr","ctk"],["ctk","ang"],["ang","rkl"],
    ["puri","bbsr"],["bhm","puri"],["smb","rkl"],
    ["blgr","smb"],["kndml","bbsr"],["krl","kndml"],
  ];

  const alertNodes = NODES.filter((n) => n.status === "warning");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Alert banner */}
      {alertNodes.length > 0 && (
        <div style={{
          background: "rgba(235,68,37,0.08)", border: "1px solid rgba(235,68,37,0.25)",
          borderRadius: 14, padding: "11px 18px",
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#eb4425", flexShrink: 0, animation: "warnBlink 0.9s infinite" }} />
          <span style={{ fontSize: 13, color: "#eb4425", fontWeight: 600 }}>
            {alertNodes.length} node{alertNodes.length > 1 ? "s" : ""} need attention:
          </span>
          {alertNodes.map((n) => (
            <span key={n.id} onClick={() => setSelected(n)} style={{
              fontSize: 12, color: "#eb4425",
              background: "rgba(235,68,37,0.1)", border: "1px solid rgba(235,68,37,0.2)",
              padding: "3px 10px", borderRadius: 20, fontWeight: 500, cursor: "pointer",
            }}>{n.name}</span>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 12 }}>

        {/* ── SVG Map ── */}
        <div style={{
          background: "#fff", border: "1px solid var(--border)",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 2px 16px rgba(103,137,190,0.10)",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderBottom: "1px solid var(--border)",
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Odisha Energy Grid</p>
              <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{NODES.length} nodes · live simulation</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {Object.entries(TYPE_META).map(([type, m]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
                  <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 500 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map area */}
          <div style={{ position: "relative", background: "#f0f4f9", height: 460 }}>

            {/* Background map image via OpenStreetMap static */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://tile.openstreetmap.org/7/92/59.png"
              alt=""
              style={{ display: "none" }}
            />

            {/* Odisha outline SVG background */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }}
            >
              <rect width="100" height="100" fill="#6789be" />
            </svg>

            {/* Grid lines */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {[20,40,60,80].map((v) => (
                <g key={v}>
                  <line x1={v} y1={0} x2={v} y2={100} stroke="rgba(103,137,190,0.08)" strokeWidth="0.3" />
                  <line x1={0} y1={v} x2={100} y2={v} stroke="rgba(103,137,190,0.08)" strokeWidth="0.3" />
                </g>
              ))}
            </svg>

            {/* Flow lines */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs>
                <marker id="arrowBlue" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <circle cx="2" cy="2" r="1.2" fill="#6789be88" />
                </marker>
                <marker id="arrowRed" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <circle cx="2" cy="2" r="1.2" fill="#eb442588" />
                </marker>
              </defs>
              {FLOWS.map(([aid, bid]) => {
                const a = NODES.find((n) => n.id === aid)!;
                const b = NODES.find((n) => n.id === bid)!;
                const pa = toPercent(a.lat, a.lng);
                const pb = toPercent(b.lat, b.lng);
                const isWarn = a.status === "warning" || b.status === "warning";
                return (
                  <line key={`${aid}-${bid}`}
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={isWarn ? "#eb442555" : "#6789be44"}
                    strokeWidth={isWarn ? "0.6" : "0.4"}
                    strokeDasharray="2 2"
                    markerEnd={isWarn ? "url(#arrowRed)" : "url(#arrowBlue)"}
                  />
                );
              })}
            </svg>

            {/* Node markers */}
            {NODES.map((node) => {
              const m = TYPE_META[node.type];
              const s = STATUS_META[node.status];
              const pos = toPercent(node.lat, node.lng);
              const live = liveValues[node.id] ?? node.value;
              const isWarn = node.status === "warning";
              const isSelected = selected?.id === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelected(isSelected ? null : node)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                    const nx = e.currentTarget.getBoundingClientRect();
                    setTooltip({ node, x: nx.left - rect.left, y: nx.top - rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    position: "absolute",
                    left: `${pos.x}%`, top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer", zIndex: isSelected ? 20 : 10,
                  }}
                >
                  {/* Outer pulse */}
                  <div style={{
                    position: "absolute", inset: -10, borderRadius: "50%",
                    background: `${isWarn ? "#eb4425" : m.color}18`,
                    border: `1px solid ${isWarn ? "#eb4425" : m.color}33`,
                    animation: `mapPulse ${isWarn ? "1s" : "2.8s"} ease-out infinite`,
                  }} />
                  {/* Middle ring */}
                  <div style={{
                    position: "absolute", inset: -5, borderRadius: "50%",
                    background: `${m.color}15`,
                    border: `1.5px solid ${m.color}55`,
                  }} />
                  {/* Core */}
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: m.color,
                    border: isSelected ? `3px solid #fff` : `2px solid ${m.color}cc`,
                    boxShadow: `0 0 ${isSelected ? 16 : 8}px ${m.color}${isSelected ? "cc" : "77"}`,
                    position: "relative", zIndex: 2,
                    transform: isSelected ? "scale(1.3)" : "scale(1)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    animation: isWarn ? "warnBlink 0.9s infinite" : "none",
                  }} />
                  {/* Live value label */}
                  <div style={{
                    position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)",
                    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                    border: `1px solid ${m.color}44`,
                    borderRadius: 6, padding: "1px 6px",
                    fontSize: 10, fontWeight: 700, color: m.color,
                    whiteSpace: "nowrap", pointerEvents: "none",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                    transition: "opacity 0.3s",
                  }}>
                    {live}{m.unit}
                  </div>
                </div>
              );
            })}

            {/* Hover tooltip */}
            {tooltip && (
              <div style={{
                position: "absolute",
                left: tooltip.x + 20, top: tooltip.y - 10,
                background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
                border: "1px solid var(--border2)", borderRadius: 12,
                padding: "10px 14px", zIndex: 100, pointerEvents: "none",
                boxShadow: "0 8px 24px rgba(103,137,190,0.18)",
                minWidth: 160, animation: "fadeUp 0.15s ease both",
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{tooltip.node.name}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 6,
                    background: `${TYPE_META[tooltip.node.type].color}15`,
                    color: TYPE_META[tooltip.node.type].color, fontWeight: 600,
                  }}>{TYPE_META[tooltip.node.type].label}</span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 6,
                    background: `${STATUS_META[tooltip.node.status].color}15`,
                    color: STATUS_META[tooltip.node.status].color, fontWeight: 600,
                  }}>{STATUS_META[tooltip.node.status].label}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: TYPE_META[tooltip.node.type].color, marginTop: 6 }}>
                  {liveValues[tooltip.node.id] ?? tooltip.node.value} {TYPE_META[tooltip.node.type].unit}
                </p>
              </div>
            )}

            {/* City labels */}
            {NODES.map((node) => {
              const pos = toPercent(node.lat, node.lng);
              return (
                <div key={`label-${node.id}`} style={{
                  position: "absolute",
                  left: `${pos.x}%`, top: `${pos.y + 3.5}%`,
                  transform: "translateX(-50%)",
                  fontSize: 9.5, color: "var(--text3)", fontWeight: 500,
                  whiteSpace: "nowrap", pointerEvents: "none",
                  textShadow: "0 1px 3px rgba(255,255,255,0.9)",
                }}>
                  {node.name.split(" ")[0]}
                </div>
              );
            })}

            {/* Compass */}
            <div style={{
              position: "absolute", bottom: 16, right: 16,
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
              border: "1px solid var(--border2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "var(--text2)",
            }}>N↑</div>

            {/* Scale legend */}
            <div style={{
              position: "absolute", bottom: 16, left: 16,
              background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
              border: "1px solid var(--border)", borderRadius: 8,
              padding: "6px 10px", fontSize: 10, color: "var(--text3)",
            }}>
              Odisha State Grid · Approx scale
            </div>
          </div>
        </div>

        {/* ── Side panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Selected node */}
          {selected ? (
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)",
              border: "1px solid var(--border2)", borderRadius: 16, padding: "16px",
              animation: "slideIn 0.25s ease both",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: TYPE_META[selected.type].color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{selected.name}</span>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  width: 22, height: 22, borderRadius: "50%", background: "var(--surface2)",
                  border: "none", cursor: "pointer", fontSize: 11, color: "var(--text3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "Type",   value: TYPE_META[selected.type].label,    color: TYPE_META[selected.type].color },
                  { label: "Status", value: STATUS_META[selected.status].label, color: STATUS_META[selected.status].color },
                ].map((s) => (
                  <div key={s.label} style={{ background: `${s.color}12`, borderRadius: 10, padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: `${TYPE_META[selected.type].color}10`,
                border: `1px solid ${TYPE_META[selected.type].color}30`,
                borderRadius: 10, padding: "14px", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 500, marginBottom: 4 }}>LIVE OUTPUT</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: TYPE_META[selected.type].color, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {liveValues[selected.id] ?? selected.value}
                  <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{TYPE_META[selected.type].unit}</span>
                </div>
              </div>

              {selected.status === "warning" && (
                <div style={{
                  marginTop: 10, padding: "10px 12px", borderRadius: 10,
                  background: "rgba(235,68,37,0.07)", border: "1px solid rgba(235,68,37,0.2)",
                  fontSize: 12, color: "#eb4425", fontWeight: 500,
                }}>⚠ Attention required — check connection or battery levels</div>
              )}
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)",
              border: "1px solid var(--border)", borderRadius: 16,
              padding: "20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>◎</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>Select a node</p>
              <p style={{ fontSize: 11, color: "var(--text3)" }}>Click any marker on the map</p>
            </div>
          )}

          {/* Node list */}
          <div style={{
            background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)",
            border: "1px solid var(--border)", borderRadius: 16,
            padding: "14px", overflowY: "auto", maxHeight: 360,
          }}>
            <p style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, letterSpacing: "0.04em", marginBottom: 10 }}>ALL NODES</p>
            {NODES.map((n) => {
              const m = TYPE_META[n.type];
              const s = STATUS_META[n.status];
              const live = liveValues[n.id] ?? n.value;
              return (
                <div key={n.id} onClick={() => setSelected(selected?.id === n.id ? null : n)} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 10, marginBottom: 3,
                  background: selected?.id === n.id ? `${m.color}12` : "transparent",
                  border: selected?.id === n.id ? `1px solid ${m.color}25` : "1px solid transparent",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { if (selected?.id !== n.id) e.currentTarget.style.background = "var(--surface2)"; }}
                  onMouseLeave={(e) => { if (selected?.id !== n.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
                    {n.status !== "idle" && (
                      <div style={{
                        position: "absolute", inset: -3, borderRadius: "50%",
                        background: s.color + "28",
                        animation: `mapPulse ${n.status === "warning" ? "1s" : "2.5s"} ease-out infinite`,
                      }} />
                    )}
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: m.color, position: "relative" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</p>
                    <p style={{ fontSize: 10, color: "var(--text3)" }}>{m.label}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{live}</div>
                    <div style={{ fontSize: 10, color: s.color, fontWeight: 500 }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Total Solar",       value: `${NODES.filter(n=>n.type==="solar").reduce((s,n)=>s+(liveValues[n.id]??n.value),0).toFixed(1)} kW`, color: "#e6a817" },
          { label: "Grid Active",       value: `${NODES.filter(n=>n.type==="grid"&&n.status==="active").length}/${NODES.filter(n=>n.type==="grid").length} nodes`, color: "#6789be" },
          { label: "Avg Battery",       value: `${Math.round(NODES.filter(n=>n.type==="battery").reduce((s,n)=>s+(liveValues[n.id]??n.value),0)/NODES.filter(n=>n.type==="battery").length)}%`, color: "#22c55e" },
          { label: "Alerts",            value: `${NODES.filter(n=>n.status==="warning").length} warnings`, color: "#eb4425" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)",
            border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px",
            boxShadow: "0 1px 6px rgba(103,137,190,0.07)",
          }}>
            <p style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.03em" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes mapPulse  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.4);opacity:0} }
        @keyframes warnBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
