"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/ui/Navbar";
import LiveMetrics from "@/components/Dashboard/LiveMetrics";
import EnergyChart from "@/components/Dashboard/EnergyChart";
import OptimizerButton from "@/components/Dashboard/OptimizerButton";
import ImpactSliders from "@/components/Dashboard/ImpactSliders";
import PredictionPanel from "@/components/Prediction/PredictionPanel";
import { EnergyReading } from "@/types/energy";

const OdishaMap = dynamic(() => import("@/components/Map/OdishaMap"), { ssr: false });

let _battery = 60;
function mockReading(): EnergyReading {
  const hour = new Date().getHours();
  const solarFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const production = +(4 + solarFactor * 5.5 + (Math.random() - 0.5) * 0.4).toFixed(2);
  const consumption = +(2.5 + Math.random() * 3 + (hour >= 18 && hour <= 22 ? 2 : 0)).toFixed(2);
  const surplus = production - consumption;
  _battery = Math.min(100, Math.max(5, _battery + surplus * 0.3));
  return {
    timestamp: new Date().toISOString(),
    production_kw: production,
    consumption_kw: consumption,
    battery_percent: +_battery.toFixed(1),
    grid_export_kw: Math.max(0, +(surplus - 1).toFixed(2)),
  };
}

type Tab = "dashboard" | "prediction" | "map";

export default function ClientDashboard() {
  const [current, setCurrent] = useState<EnergyReading | null>(null);
  const [history, setHistory] = useState<EnergyReading[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carbonTotal = history.reduce((s, r) => s + r.production_kw * (5 / 3600), 0) * 0.82;
  const moneyTotal  = history.reduce((s, r) => s + r.production_kw * (5 / 3600) * 7.5, 0);

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
    const startMock = () => {
      const tick = () => {
        const r = mockReading();
        setCurrent(r);
        setHistory((h) => [...h.slice(-59), r]);
      };
      tick();
      mockRef.current = setInterval(tick, 5000);
    };
    if (WS_URL) {
      try {
        wsRef.current = new WebSocket(WS_URL);
        wsRef.current.onopen = () => setWsConnected(true);
        wsRef.current.onmessage = (e) => {
          const reading: EnergyReading = JSON.parse(e.data);
          setCurrent(reading);
          setHistory((h) => [...h.slice(-59), reading]);
        };
        wsRef.current.onerror = () => { setWsConnected(false); startMock(); };
        wsRef.current.onclose = () => setWsConnected(false);
      } catch { startMock(); }
    } else {
      startMock();
    }
    return () => {
      wsRef.current?.close();
      if (mockRef.current) clearInterval(mockRef.current);
    };
  }, []);

  const PAGE_TITLES: Record<Tab, { title: string; sub: string }> = {
    dashboard:  { title: "Energy Dashboard",        sub: "Real-time solar production, consumption & AI optimization" },
    prediction: { title: "Solar Prediction Engine", sub: "24-hour forecast using live weather data from Open-Meteo" },
    map:        { title: "Odisha Grid Map",          sub: "Energy nodes and live flow across Odisha" },
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as Tab)}
        wsConnected={wsConnected}
      />

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 1.5rem 3rem" }}>
        {/* Page header */}
        <div style={{ marginBottom: "1.5rem" }} className="fade-up">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>
            {PAGE_TITLES[activeTab].title}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>
            {PAGE_TITLES[activeTab].sub}
          </p>
        </div>

        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <LiveMetrics data={current} carbonTotal={carbonTotal} moneyTotal={moneyTotal} history={history} />
            <EnergyChart history={history} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OptimizerButton />
              <ImpactSliders />
            </div>
          </div>
        )}
        {activeTab === "prediction" && <PredictionPanel />}
        {activeTab === "map" && <OdishaMap />}
      </div>
    </main>
  );
}