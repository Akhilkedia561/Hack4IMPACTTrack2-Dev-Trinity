"use client";
import { useState, useEffect, useRef } from "react";
import { EnergyNode } from "@/types/energy";

const NODES: EnergyNode[] = [
  { id: "bbsr",  name: "Bhubaneswar Solar Farm",  lat: 20.2961, lng: 85.8245, type: "solar",    value: 8.4,  status: "active"  },
  { id: "ctk",   name: "Cuttack Battery Hub",      lat: 20.4625, lng: 85.8830, type: "battery",  value: 78,   status: "active"  },
  { id: "rkl",   name: "Rourkela Grid Node",        lat: 22.2604, lng: 84.8536, type: "grid",     value: 12.1, status: "active"  },
  { id: "puri",  name: "Puri Coastal Solar",        lat: 19.8135, lng: 85.8312, type: "solar",    value: 6.2,  status: "active"  },
  { id: "smb",   name: "Sambalpur Consumer",        lat: 21.4669, lng: 83.9756, type: "consumer", value: 4.8,  status: "idle"    },
  { id: "bhm",   name: "Berhampur Solar",           lat: 19.3150, lng: 84.7941, type: "solar",    value: 5.9,  status: "active"  },
  { id: "krl",   name: "Koraput Battery",           lat: 18.8120, lng: 82.7097, type: "battery",  value: 32,   status: "warning" },
  { id: "ang",   name: "Angul Industrial Grid",     lat: 20.8380, lng: 85.1010, type: "grid",     value: 18.5, status: "active"  },
  { id: "blgr",  name: "Balangir Solar Park",       lat: 20.7108, lng: 83.4842, type: "solar",    value: 7.1,  status: "active"  },
  { id: "kndml", name: "Kandhamal Heatwave Zone",   lat: 20.1167, lng: 84.2333, type: "consumer", value: 9.2,  status: "warning" },
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

const FLOWS: [string, string][] = [
  ["bbsr","ctk"],["ctk","ang"],["ang","rkl"],
  ["puri","bbsr"],["bhm","puri"],["smb","rkl"],
  ["blgr","smb"],["kndml","bbsr"],["krl","kndml"],
];

function makeIcon(L: any, node: EnergyNode, live: number) {
  const m = TYPE_META[node.type];
  const isWarn = node.status === "warning";
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div style="position:relative;width:0;height:0;cursor:pointer;">
        <div style="
          position:absolute;width:40px;height:40px;border-radius:50%;
          background:${m.color}22;border:1.5px solid ${m.color}44;
          top:-20px;left:-20px;
          animation:agPulse ${isWarn ? "1s" : "2.8s"} ease-out infinite;
        "></div>
        <div style="
          position:absolute;width:22px;height:22px;border-radius:50%;
          background:${m.color};border:3px solid white;
          box-shadow:0 0 12px ${m.color}99,0 2px 8px rgba(0,0,0,0.2);
          top:-11px;left:-11px;
          ${isWarn ? "animation:agWarn 0.9s infinite;" : ""}
        "></div>
        <div style="
          position:absolute;top:-38px;left:50%;transform:translateX(-50%);
          background:white;border:1.5px solid ${m.color}66;
          border-radius:6px;padding:2px 7px;
          font-size:11px;font-weight:700;color:${m.color};
          white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.1);
          font-family:Outfit,sans-serif;
        ">${live}${m.unit}</div>
      </div>
    `,
  });
}

export default function OdishaMap() {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers     = useRef<Record<string, any>>({});
  const polylines   = useRef<any[]>([]);

  const [selected,   setSelected]   = useState<EnergyNode | null>(null);
  const [liveValues, setLiveValues] = useState<Record<string, number>>(
    Object.fromEntries(NODES.map((n) => [n.id, n.value]))
  );

  // Live value ticker
  useEffect(() => {
    const id = setInterval(() => {
      setLiveValues((prev) => {
        const next: Record<string, number> = {};
        NODES.forEach((n) => {
          next[n.id] = +(prev[n.id] + (Math.random() - 0.5) * n.value * 0.08).toFixed(1);
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Bootstrap Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      // Fix broken default icon paths from webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      if ((mapRef.current as any)._leaflet_id) {
  (mapRef.current as any)._leaflet_id = null;
}

      const map = L.map(mapRef.current!, {
        center:           [20.5, 84.2],
        zoom:             7,
        zoomControl:      true,
        scrollWheelZoom:  true,
        attributionControl: false,
      });

      // OSM tiles with subtle styling
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        opacity: 0.88,
      }).addTo(map);

      // Attribution in corner
      L.control.attribution({ prefix: "© OpenStreetMap", position: "bottomright" }).addTo(map);

      mapInstance.current = map;

      // Flow polylines
      FLOWS.forEach(([aid, bid]) => {
        const a = NODES.find((n) => n.id === aid)!;
        const b = NODES.find((n) => n.id === bid)!;
        const warn = a.status === "warning" || b.status === "warning";
        const pl = L.polyline([[a.lat, a.lng],[b.lat, b.lng]], {
          color:     warn ? "#eb442577" : "#6789be66",
          weight:    warn ? 2.5 : 1.8,
          dashArray: "7 6",
        }).addTo(map);
        polylines.current.push(pl);
      });

      // Node markers
      NODES.forEach((node) => {
        const live = node.value;
        const icon = makeIcon(L, node, live);
        const marker = L.marker([node.lat, node.lng], { icon, zIndexOffset: 500 })
          .addTo(map)
          .on("click", () => setSelected((p) => (p?.id === node.id ? null : node)));
        markers.current[node.id] = marker;
      });
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update marker icons on every live tick
  useEffect(() => {
    if (!mapInstance.current) return;
    import("leaflet").then((L) => {
      NODES.forEach((node) => {
        const m = markers.current[node.id];
        if (m) m.setIcon(makeIcon(L, node, liveValues[node.id] ?? node.value));
      });
    });
  }, [liveValues]);

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
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#eb4425", flexShrink: 0, animation: "agWarn 0.9s infinite" }} />
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

        {/* ── Leaflet Map Card ── */}
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

          {/* The actual Leaflet map div */}
          <div ref={mapRef} style={{ height: 460, width: "100%" }} />
        </div>

        {/* ── Side panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

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
                <div key={n.id}
                  onClick={() => setSelected(selected?.id === n.id ? null : n)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 10, marginBottom: 3,
                    background: selected?.id === n.id ? `${m.color}12` : "transparent",
                    border: selected?.id === n.id ? `1px solid ${m.color}25` : "1px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (selected?.id !== n.id) (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
                  onMouseLeave={(e) => { if (selected?.id !== n.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
                    {n.status !== "idle" && (
                      <div style={{
                        position: "absolute", inset: -3, borderRadius: "50%",
                        background: s.color + "28",
                        animation: `agPulse ${n.status === "warning" ? "1s" : "2.5s"} ease-out infinite`,
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
          { label: "Total Solar",  value: `${NODES.filter(n=>n.type==="solar").reduce((s,n)=>s+(liveValues[n.id]??n.value),0).toFixed(1)} kW`, color: "#e6a817" },
          { label: "Grid Active",  value: `${NODES.filter(n=>n.type==="grid"&&n.status==="active").length}/${NODES.filter(n=>n.type==="grid").length} nodes`, color: "#6789be" },
          { label: "Avg Battery",  value: `${Math.round(NODES.filter(n=>n.type==="battery").reduce((s,n)=>s+(liveValues[n.id]??n.value),0)/NODES.filter(n=>n.type==="battery").length)}%`, color: "#22c55e" },
          { label: "Alerts",       value: `${NODES.filter(n=>n.status==="warning").length} warnings`, color: "#eb4425" },
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
        @keyframes agPulse { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.6);opacity:0} }
        @keyframes agWarn  { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes slideIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }

        .leaflet-container { font-family: Outfit, sans-serif !important; }
        .leaflet-tile-pane  { filter: saturate(0.75) brightness(1.02); }
        .leaflet-control-zoom {
          border: 1px solid var(--border) !important;
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(103,137,190,0.15) !important;
        }
        .leaflet-control-zoom a { color: var(--text2) !important; }
        .leaflet-control-zoom a:hover { background: #eef2f8 !important; }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.7) !important;
          backdrop-filter: blur(6px);
          border-radius: 6px 0 0 0 !important;
        }
      `}</style>
    </div>
  );
}
