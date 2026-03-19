"use client";
import { useState, useEffect } from "react";

type Tab = "dashboard" | "prediction" | "map";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  wsConnected: boolean;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "prediction", label: "Analytics", icon: "⊞" },
  { id: "map", label: "Grid Map", icon: "◎" },
];

export default function Navbar({ activeTab, onTabChange, wsConnected }: Props) {
  const [time, setTime] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <>
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        padding: scrolled ? "10px 0" : "16px 0",
        transition: "padding 0.3s ease",
        pointerEvents: "none",
        background: "transparent",
      }}>
        <nav style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(30, 38, 50, 0.80)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: 60,
          padding: "5px 5px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.09)",
          pointerEvents: "all",
          transition: "box-shadow 0.3s ease",
          gap: 2,
        }}>

          {/* Logo */}
          <div style={{
            width: 44, height: 44, borderRadius: 40,
            background: "#e6a817",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginRight: 6, flexShrink: 0,
            boxShadow: "0 2px 14px rgba(230,168,23,0.55)",
            cursor: "pointer",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(18deg) scale(1.1)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(230,168,23,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "rotate(0deg) scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 14px rgba(230,168,23,0.55)";
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" fill="#1a1a1a"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121"
                stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          {/* Tabs */}
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => onTabChange(t.id)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 20px",
                borderRadius: 40,
                background: active ? "rgba(255,255,255,0.11)" : "transparent",
                border: active ? "1px solid rgba(255,255,255,0.10)" : "1px solid transparent",
                color: active ? "#ffffff" : "rgba(255,255,255,0.45)",
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                fontFamily: "'Outfit', sans-serif",
                cursor: "pointer",
                letterSpacing: "-0.01em",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
              }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: 15 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}

          {/* Separator */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 2 }}>

            {/* Live ping */}
            <div title={wsConnected ? "WebSocket live" : "Simulated"} style={{
              width: 36, height: 36, borderRadius: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", cursor: "default",
            }}>
              <span style={{
                position: "absolute",
                width: 14, height: 14, borderRadius: "50%",
                background: wsConnected ? "#22c55e" : "#e6a817",
                opacity: 0.3,
                animation: "navPing 1.6s ease-out infinite",
              }} />
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: wsConnected ? "#22c55e" : "#e6a817",
                display: "block", position: "relative", zIndex: 1,
              }} />
            </div>

            {/* Time */}
            <div style={{
              padding: "6px 12px", borderRadius: 40,
              color: "rgba(255,255,255,0.38)",
              fontSize: 12.5,
              fontFamily: "'Outfit', sans-serif",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.03em",
            }}>
              {time}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setDark((d) => !d)}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: 36, height: 36, borderRadius: 40,
                background: dark ? "rgba(230,168,23,0.25)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 16,
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = dark ? "rgba(230,168,23,0.25)" : "rgba(255,255,255,0.08)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>

            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: 40,
              background: "linear-gradient(135deg, #6789be 0%, #3d5a8a 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              border: "2px solid rgba(255,255,255,0.14)",
              cursor: "pointer",
              transition: "border-color 0.2s, transform 0.2s",
              flexShrink: 0,
              letterSpacing: "0.02em",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)";
                e.currentTarget.style.transform = "scale(1.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >AG</div>

          </div>
        </nav>
      </div>

      <style>{`
        @keyframes navPing {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
    </>
  );
}