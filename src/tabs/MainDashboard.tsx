

import React, { useEffect, useMemo, useState, type JSX } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import VillageMapComponent from "../components/VillageMapComponent";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

// Convert "10/29/25 12:00 AM" → "2025-10-29"
function formatReadingTime(rt: string) {
  try {
    const datePart = rt.split(" ")[0];
    const [m, d, y] = datePart.split("/");

    const fullYear = Number(y) < 50 ? `20${y}` : `19${y}`;

    return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  } catch {
    return "";
  }
}

// Convert full datetime → "MM/DD/YY hh:mm AM"
function formatFullTimestamp(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return ts;
  }
}

const DEFAULT_END = new Date();
const DEFAULT_START = new Date(DEFAULT_END);
DEFAULT_START.setDate(DEFAULT_END.getDate() - 20);

const COLORS = [
  "#1B5E20", "#2E7D32", "#388E3C", "#43A047", "#66BB6A",
  "#7CB342", "#9CCC65", "#A5D6A7", "#0288D1", "#1565C0",
  "#6A1B9A", "#8E24AA", "#E65100", "#FB8C00", "#D84315",
];

const VILLAGES = [
  { name: "Jaulke (Bk.)", code: "555805" },
  { name: "Kadim Shahapur", code: "549372" },
  { name: "Khadki", code: "547380" },
  { name: "Massa (Kh.)", code: "561312" },
  { name: "Kiraksal", code: "563429" },
  { name: "Vaijubabhulgaon", code: "557953" },
  { name: "Ninavi", code: "551112" },
];

export default function Dashboard(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<any | null>(null);
  const [selectedFarmerVillage, setSelectedFarmerVillage] = useState<string | null>(VILLAGES[0].code);

  const [startDate, setStartDate] = useState(fmt(DEFAULT_START));
  const [endDate, setEndDate] = useState(fmt(DEFAULT_END));

  const [soilReadings, setSoilReadings] = useState<any[]>([]);
  const [temperature, setTemperature] = useState<any[]>([]);
  const [rainfall, setRainfall] = useState<any[]>([]);

  const [mode, setMode] = useState<"sensor" | "farm">("sensor");

  const [visibleSensors, setVisibleSensors] = useState<Record<string, boolean>>({});
  const [visibleFarms, setVisibleFarms] = useState<Record<string, boolean>>({});

  // Load all villages
  useEffect(() => {
    setLoading(true);
    fetch("/api/villages/soil-moisture-villages")
      .then(res => res.json())
      .then(data => {
        setVillages(data);
        if (data.length > 0) setSelectedVillage(data[0]);
      })
      .catch(() => setError("Failed to load villages"))
      .finally(() => setLoading(false));
  }, []);

  // Fetch soil, temperature, rainfall
  useEffect(() => {
    if (!selectedVillage) return;

    const villageCode = selectedVillage.village_code;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(
        `/api/farm-management/soil-moisture-sensor?start_date=${startDate}&end_date=${endDate}&zone_id=${encodeURIComponent(
          selectedVillage.zone_id
        )}`
      )
        .then(r => r.json())
        .catch(() => []),

      fetch(
        `/api/farm-management/davis-weather-v_code?start_date=${startDate}&end_date=${endDate}&village_code=${encodeURIComponent(
          villageCode
        )}`
      )
        .then(r => r.json())
        .catch(() => []),
    ])
      .then(([soilRes, tempRes]) => {
        setSoilReadings(Array.isArray(soilRes) ? soilRes : []);

        // -------------------------------
        // TEMPERATURE (with timestamp)
        // -------------------------------
        setTemperature(
          Array.isArray(tempRes)
            ? tempRes.map((item) => {
                const raw = item.reading_time || item.date_time || "";
                const dateOnly = raw ? raw.split("T")[0] : "";

                return {
                  date: dateOnly,            // for X-axis
                  value: Number(item.temp_c ?? item.temp ?? 0),
                  timestamp: raw,            // full for tooltip
                };
              })
            : []
        );

        // -------------------------------
        // RAINFALL (with timestamp)
        // -------------------------------
        setRainfall(
          Array.isArray(tempRes)
            ? tempRes.map((item) => {
                const raw = item.reading_time || item.date_time || "";
                const dateOnly = raw ? raw.split("T")[0] : "";

                return {
                  date: dateOnly,            // for X-axis
                  value: Number(item.rain_mm ?? 0),
                  timestamp: raw,            // full for tooltip
                };
              })
            : []
        );
      })
      .catch(() => setError("Failed fetching data"))
      .finally(() => setLoading(false));
  }, [selectedVillage, startDate, endDate]);

  // Sensor IDs
  const sensorIds = useMemo(() => {
    const s = new Set<string>();
    soilReadings.forEach(row => {
      Object.keys(row).forEach(k => {
        if (/^sensor\d+_name$/.test(k) && row[k]) s.add(row[k]);
      });
    });
    return Array.from(s).sort();
  }, [soilReadings]);

  // Map sensor → farmer
  const sensorToFarmer = useMemo(() => {
    const m = new Map<string, string>();
    soilReadings.forEach(row => {
      const farmer = row.farmer_name ?? "Unknown Farmer";
      Object.keys(row).forEach(k => {
        const mm = k.match(/^sensor(\d+)_name$/);
        if (mm && row[k]) m.set(row[k], farmer);
      });
    });
    return m;
  }, [soilReadings]);

  // Farmers list
  const farmerNames = useMemo(() => {
    const arr: string[] = [];
    const seen = new Set<string>();
    soilReadings.forEach(r => {
      const farmer = r.farmer_name ?? "Unknown Farmer";
      if (!seen.has(farmer)) {
        seen.add(farmer);
        arr.push(farmer);
      }
    });
    return arr;
  }, [soilReadings]);

  // Init visibility
  useEffect(() => {
    const obj: Record<string, boolean> = {};
    sensorIds.forEach(id => (obj[id] = true));
    setVisibleSensors(obj);
  }, [sensorIds.join("|")]);

  useEffect(() => {
    const obj: Record<string, boolean> = {};
    farmerNames.forEach(f => (obj[f] = true));
    setVisibleFarms(obj);
  }, [farmerNames.join("|")]);

  // Farmer → sensors
  const farmerToSensors = useMemo(() => {
    const m = new Map<string, Set<string>>();
    soilReadings.forEach(row => {
      const farmer = row.farmer_name ?? "Unknown Farmer";
      if (!m.has(farmer)) m.set(farmer, new Set());
      const set = m.get(farmer)!;

      Object.keys(row).forEach(k => {
        const mm = k.match(/^sensor(\d+)_name$/);
        if (mm && row[k]) set.add(row[k]);
      });
    });

    const out: Record<string, string[]> = {};
    m.forEach((set, farmer) => (out[farmer] = Array.from(set)));
    return out;
  }, [soilReadings]);

  // Merge soil sensor series
  const mergedSensorSeries = useMemo(() => {
    const map = new Map<string, any>();

    soilReadings.forEach(row => {
      const dateKey =
        row.date ??
        row.date_time?.split("T")[0] ??
        row.reading_time ??
        "";

      if (!dateKey) return;

      if (!map.has(dateKey)) map.set(dateKey, { date: dateKey });

      const entry = map.get(dateKey);

      Object.keys(row).forEach(k => {
        const mm = k.match(/^sensor(\d+)_name$/);
        if (mm) {
          const idx = mm[1];
          const sensor = row[k];
          const val = Number(row[`sensor${idx}_value`]);
          if (sensor && !Number.isNaN(val)) entry[sensor] = val;
        }
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [soilReadings]);

  // Active sensors
  const activeSensorIds = useMemo(() => {
    if (mode === "sensor") {
      return sensorIds.filter(id => visibleSensors[id]);
    }

    const included = new Set<string>();
    Object.entries(visibleFarms).forEach(([farmer, vis]) => {
      if (!vis) return;
      const sensors = farmerToSensors[farmer] ?? [];
      sensors.forEach(s => included.add(s));
    });

    return Array.from(included).filter(id => visibleSensors[id]);
  }, [mode, visibleSensors, visibleFarms, farmerToSensors, sensorIds]);

  const toggleSensor = (id: string) =>
    setVisibleSensors(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleFarm = (farmer: string) =>
    setVisibleFarms(prev => ({ ...prev, [farmer]: !prev[farmer] }));

  const colorFor = (i: number) => COLORS[i % COLORS.length];

  const getFarmerForSensor = (s: string) =>
    sensorToFarmer.get(s) ?? "Unknown Farmer";

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/10 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2E3A3F] mb-6">
          Operations Dashboard
        </h1>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="text-xs text-gray-600">Village</label>
            <select
              value={selectedVillage?.v_name ?? ""}
              onChange={e =>
                setSelectedVillage(
                  villages.find(v => v.v_name === e.target.value)
                )
              }
              className="border rounded px-3 py-2 ml-2"
            >
              {villages.map(v => (
                <option key={v.village_code} value={v.v_name}>
                  {v.v_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600">From</label>
            <input
              type="date"
              className="border rounded px-2 py-2 ml-2"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">To</label>
            <input
              type="date"
              className="border rounded px-2 py-2 ml-2"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>

          <div className="flex items-center gap-3 ml-4">
            <label className="text-xs text-gray-600">Mode</label>
            <label>
              <input
                type="radio"
                checked={mode === "sensor"}
                onChange={() => setMode("sensor")}
              />
              Sensor
            </label>
            <label>
              <input
                type="radio"
                checked={mode === "farm"}
                onChange={() => setMode("farm")}
              />
              Farm
            </label>
          </div>

          <button
            className="ml-auto px-3 py-2 border rounded bg-white"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 20);
              setStartDate(fmt(start));
              setEndDate(fmt(end));
            }}
          >
            Reset
          </button>
        </div>

        {/* SIDEBAR + CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Visibility</h3>

            {mode === "sensor" ? (
              <>
                <div className="text-xs text-gray-600 mb-2">Sensors</div>
                <div className="max-h-64 overflow-auto">
                  {sensorIds.map((id, i) => (
                    <label
                      key={id}
                      className="flex items-center gap-2 text-sm mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={!!visibleSensors[id]}
                        onChange={() => toggleSensor(id)}
                      />
                      <span style={{ color: colorFor(i) }}>{id}</span>
                      <span className="text-xs text-gray-500">
                        — {getFarmerForSensor(id)}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-gray-600 mb-2">Farms</div>
                <div className="max-h-64 overflow-auto">
                  {farmerNames.map((farmer, i) => (
                    <label
                      key={farmer}
                      className="flex items-center gap-2 text-sm mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={!!visibleFarms[farmer]}
                        onChange={() => toggleFarm(farmer)}
                      />
                      <span style={{ color: colorFor(i) }}>{farmer}</span>
                      <span className="text-xs text-gray-500">
                        — {(farmerToSensors[farmer] ?? []).length} sensors
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* SOIL CHART */}
          <div className="lg:col-span-3 bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="text-md font-semibold mb-3">Soil Moisture</h3>

            <div style={{ height: 400 }}>
              {mergedSensorSeries.length === 0 ? (
                <div className="flex w-full h-full items-center justify-center text-gray-500">
                  No readings
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mergedSensorSeries}
                    key={mergedSensorSeries.length}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />

                    <Tooltip
                      wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      labelStyle={{
                        fontWeight: 600,
                        fontSize: "14px",
                        marginBottom: "4px",
                      }}
                      cursor={false}
                      isAnimationActive={false}
                    />

                    <Legend />

                    {sensorIds.map((sensor, i) => {
                      if (!activeSensorIds.includes(sensor)) return null;
                      const farmer = getFarmerForSensor(sensor);
                      return (
                        <Line
                          key={sensor}
                          dataKey={sensor}
                          name={`${farmer} — ${sensor}`}
                          stroke={colorFor(i)}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* TEMPERATURE & RAINFALL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* TEMPERATURE */}
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="text-md font-semibold mb-3">Temperature</h3>

            <div style={{ height: 250 }}>
              {temperature.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No temperature data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temperature} key={temperature.length}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />

                    {/* HOURWISE TOOLTIP */}
                    <Tooltip
                      wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]?.payload?.timestamp) {
                          return formatFullTimestamp(payload[0].payload.timestamp);
                        }
                        return value;
                      }}
                      itemStyle={{
                        fontSize: "14px",
                        color: "#E65100",
                        fontWeight: 700,
                      }}
                      formatter={(value: any) => [`${value}°C`, "Temperature"]}
                      cursor={false}
                      isAnimationActive={false}
                    />

                    <Line
                      dataKey="value"
                      name="Temperature"
                      stroke="#E65100"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* RAINFALL */}
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="text-md font-semibold mb-3">Rainfall</h3>

            <div style={{ height: 250 }}>
              {rainfall.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No rainfall data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rainfall} key={rainfall.length}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />

                    {/* HOURWISE TOOLTIP */}
                    <Tooltip
                      wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      labelFormatter={(value, payload) => {
                        if (payload && payload[0]?.payload?.timestamp) {
                          return formatFullTimestamp(payload[0].payload.timestamp);
                        }
                        return value;
                      }}
                      itemStyle={{
                        fontSize: "14px",
                        color: "#0288D1",
                        fontWeight: 700,
                      }}
                      formatter={(value: any) => [`${value} mm`, "Rainfall"]}
                      cursor={false}
                      isAnimationActive={false}
                    />

                    <Line
                      dataKey="value"
                      name="Rainfall"
                      stroke="#0288D1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* MAP SECTION */}
        <div className="bg-white rounded-xl border p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold">Geographic View - Farmer Plots</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="farmer-village-select" className="text-sm font-medium text-gray-700">
                Select Village:
              </label>
              <select
                id="farmer-village-select"
                value={selectedFarmerVillage || ""}
                onChange={(e) => setSelectedFarmerVillage(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VILLAGES.map((village) => (
                  <option key={village.code} value={village.code}>
                    {village.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <VillageMapComponent height="500px" villageCode={selectedFarmerVillage} />
        </div>

        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
    </div>
  );
}
