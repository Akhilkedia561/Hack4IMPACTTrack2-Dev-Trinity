export interface EnergyReading {
  timestamp: string;
  production_kw: number;
  consumption_kw: number;
  battery_percent: number;
  grid_export_kw: number;
}

export interface PredictionHour {
  hour: string;
  predicted_kwh: number;
  actual_kwh: number | null;
  cloud_cover: number;
  temperature: number;
}

export interface PredictionResult {
  location: string;
  panel_size_kw: number;
  hours: PredictionHour[];
  total_predicted_kwh: number;
  peak_hour: string;
}

export interface OptimizationResult {
  action: "USE_NOW" | "STORE_BATTERY" | "SEND_TO_GRID";
  savings_inr: number;
  savings_kwh: number;
  reason: string;
  confidence: number;
}

export interface ImpactScenario {
  cloudy_factor: number;
  heat_factor: number;
  production_kw: number;
  consumption_kw: number;
  carbon_saved_kg: number;
  money_saved_inr: number;
}

export interface EnergyNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "solar" | "battery" | "grid" | "consumer";
  value: number;
  status: "active" | "idle" | "warning";
}