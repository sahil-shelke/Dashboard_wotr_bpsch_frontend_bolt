"use client";

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

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

// Convert "10/29/25 12:00 AM" → "2025-10-29"
function formatReadingTime(rt: string) {
  try {
    const datePart = rt.split(" ")[0]; // "10/29/25"
    const [m, d, y] = datePart.split("/");

    const fullYear = Number(y) < 50 ? `20${y}` : `19${y}`;

    return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  } catch {
    return "";
  }
}

const DEFAULT_END = new Date();
const DEFAULT_START = new Date(DEFAULT_END);
DEFAULT_START.setDate(DEFAULT_END.getDate() - 20);

// colors
const COLORS = [
  "#1B5E20", "#2E7D32", "#388E3C", "#43A047", "#66BB6A",
  "#7CB342", "#9CCC65", "#A5D6A7", "#0288D1", "#1565C0",
  "#6A1B9A", "#8E24AA", "#E65100", "#FB8C00", "#D84315",
];

export default function Dashboard(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<any | null>(null);

  const [startDate, setStartDate] = useState(fmt(DEFAULT_START));
  const [endDate, setEndDate] = useState(fmt(DEFAULT_END));

  const [soilReadings, setSoilReadings] = useState<any[]>([]);
  const [temperature, setTemperature] = useState<any[]>([]);
  const [farmSummary, setFarmSummary] = useState<any[]>([]);

  const [mode, setMode] = useState<"sensor" | "farm">("sensor");

  const [visibleSensors, setVisibleSensors] = useState<Record<string, boolean>>({});
  const [visibleFarms, setVisibleFarms] = useState<Record<string, boolean>>({});

  // ------------------------------------------------------------
  // Load villages initially
  // ------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/villages/soil-moisture-villages")
      .then(res => res.json())
      .then(data => {
        setVillages(data);
        if (data.length > 0) setSelectedVillage(data[0]);
      })
      .catch(() => setError("Failed to load villages"))
      .finally(() => setLoading(false));
  }, []);

  // ------------------------------------------------------------
  // Fetch soil readings + temperature + summary
  // ------------------------------------------------------------
  useEffect(() => {
    if (!selectedVillage) return;

    const villageCode = selectedVillage.village_code;

    setLoading(true);
    setError(null);

    Promise.all([
      fetch(
        `http://localhost:5000/api/farm-management/soil-moisture-sensor?start_date=${startDate}&end_date=${endDate}&zone_id=${encodeURIComponent(
          selectedVillage.zone_id
        )}`
      )
        .then(r => r.json())
        .catch(() => []),

      fetch(
        `http://localhost:5000/api/farm-management/davis-weather-v_code?start_date=${startDate}&end_date=${endDate}&village_code=${encodeURIComponent(
          villageCode
        )}`
      )
        .then(r => r.json())
        .catch(() => []),

      fetch(
        `http://localhost:5000/api/farm-management/farm-summary?village_code=${encodeURIComponent(
          villageCode
        )}`
      )
        .then(r => r.json())
        .catch(() => []),
    ])
      .then(([soilRes, tempRes, summaryRes]) => {
        setSoilReadings(Array.isArray(soilRes) ? soilRes : []);

        // --------------------------
        // FIX: Use reading_time
        // --------------------------
        setTemperature(
          Array.isArray(tempRes)
            ? tempRes.map((item) => ({
                date: item.reading_time
                  ? formatReadingTime(item.reading_time)
                  : (item.date ??
                    item.date_time?.split("T")[0] ??
                    ""),
                value: Number(item.temp_c ?? item.temp ?? 0),
              }))
            : []
        );

        setFarmSummary(Array.isArray(summaryRes) ? summaryRes : []);
      })
      .catch(() => setError("Failed fetching data"))
      .finally(() => setLoading(false));
  }, [selectedVillage, startDate, endDate]);

  // ------------------------------------------------------------
  // Extract sensor IDs
  // ------------------------------------------------------------
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

  // Initialize visibility toggles
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

  // farmer → sensors mapping
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
                      isAnimationActive={false}
                      position={undefined}
                      cursor={{ strokeDasharray: "3 3" }}
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

        {/* TEMPERATURE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="text-md font-semibold mb-3">Temperature</h3>

            <div style={{ height: 180 }}>
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

                    {/* FINAL tooltip fix */}
                    <Tooltip
                      isAnimationActive={false}
                      position={undefined}
                      allowEscapeViewBox={{ x: true, y: true }}
                      cursor={{ strokeDasharray: "3 3" }}
                    />

                    <Line
                      dataKey="value"
                      name="°C"
                      stroke="#E65100"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="text-md font-semibold mb-3">Farm Summary</h3>

            {farmSummary.length === 0 ? (
              <div className="text-gray-500">No summary data</div>
            ) : (
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left">Farmer</th>
                    <th className="border p-2 text-left">Sensors</th>
                  </tr>
                </thead>
                <tbody>
                  {farmerNames.map(farmer => (
                    <tr key={farmer}>
                      <td className="border p-2">{farmer}</td>
                      <td className="border p-2">
                        {(farmerToSensors[farmer] ?? []).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
    </div>
  );
}
