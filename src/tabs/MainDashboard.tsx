

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
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<any | null>(null);

  const [mapDistrict, setMapDistrict] = useState<string>("");
  const [mapBlock, setMapBlock] = useState<string>("");
  const [mapVillage, setMapVillage] = useState<any | null>(null);
  const [selectedFarmerVillage, setSelectedFarmerVillage] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(fmt(DEFAULT_START));
  const [endDate, setEndDate] = useState(fmt(DEFAULT_END));

  const [soilReadings, setSoilReadings] = useState<any[]>([]);
  const [rawSoilData, setRawSoilData] = useState<any[]>([]);
  const [temperature, setTemperature] = useState<any[]>([]);
  const [rawTemperatureData, setRawTemperatureData] = useState<any[]>([]);
  const [rainfall, setRainfall] = useState<any[]>([]);

  const [mode, setMode] = useState<"sensor" | "farm">("sensor");

  const [visibleSensors, setVisibleSensors] = useState<Record<string, boolean>>({});
  const [visibleFarms, setVisibleFarms] = useState<Record<string, boolean>>({});

  // Load all villages
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    fetch("/api/location_dashboard/soil-moisture-villages", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setVillages(data);
        const ahilyanagar = data.find((v: any) => v.d_name === "Ahilyanagar");
        if (ahilyanagar) {
          setSelectedDistrict("Ahilyanagar");
        }
      })
      .catch(() => setError("Failed to load villages"))
      .finally(() => setLoading(false));
  }, []);

  // Get unique districts
  const districts = useMemo(() => {
    const unique = new Set<string>();
    villages.forEach(v => unique.add(v.d_name));
    return Array.from(unique).sort();
  }, [villages]);

  // Get blocks for selected district
  const blocks = useMemo(() => {
    if (!selectedDistrict) return [];
    const unique = new Set<string>();
    villages
      .filter(v => v.d_name === selectedDistrict)
      .forEach(v => unique.add(v.b_name));
    return Array.from(unique).sort();
  }, [villages, selectedDistrict]);

  // Get villages for selected block
  const filteredVillages = useMemo(() => {
    if (!selectedDistrict || !selectedBlock) return [];
    return villages.filter(
      v => v.d_name === selectedDistrict && v.b_name === selectedBlock
    );
  }, [villages, selectedDistrict, selectedBlock]);

  // MAP FILTERS
  const mapBlocks = useMemo(() => {
    if (!mapDistrict) return [];
    const unique = new Set<string>();
    villages
      .filter(v => v.d_name === mapDistrict)
      .forEach(v => unique.add(v.b_name));
    return Array.from(unique).sort();
  }, [villages, mapDistrict]);

  const mapFilteredVillages = useMemo(() => {
    if (!mapDistrict || !mapBlock) return [];
    return villages.filter(
      v => v.d_name === mapDistrict && v.b_name === mapBlock
    );
  }, [villages, mapDistrict, mapBlock]);

  // Update block when district changes
  useEffect(() => {
    if (selectedDistrict && blocks.length > 0) {
      if (!blocks.includes(selectedBlock)) {
        setSelectedBlock(blocks[0]);
      }
    } else if (!selectedDistrict) {
      setSelectedBlock("");
    }
  }, [selectedDistrict, blocks]);

  // Update village when block changes
  useEffect(() => {
    if (selectedBlock && filteredVillages.length > 0) {
      if (!filteredVillages.find(v => v.village_code === selectedVillage?.village_code)) {
        setSelectedVillage(filteredVillages[0]);
      }
    } else if (!selectedBlock) {
      setSelectedVillage(null);
    }
  }, [selectedBlock, filteredVillages]);

  // MAP: Update block when district changes
  useEffect(() => {
    if (mapDistrict && mapBlocks.length > 0) {
      if (!mapBlocks.includes(mapBlock)) {
        setMapBlock(mapBlocks[0]);
      }
    } else if (!mapDistrict) {
      setMapBlock("");
    }
  }, [mapDistrict, mapBlocks]);

  // MAP: Update village when block changes
  useEffect(() => {
    if (mapBlock && mapFilteredVillages.length > 0) {
      if (!mapFilteredVillages.find(v => v.village_code === mapVillage?.village_code)) {
        setMapVillage(mapFilteredVillages[0]);
      }
    } else if (!mapBlock) {
      setMapVillage(null);
    }
  }, [mapBlock, mapFilteredVillages]);

  // MAP: Sync village code with selectedFarmerVillage
  useEffect(() => {
    if (mapVillage) {
      setSelectedFarmerVillage(mapVillage.village_code);
    } else {
      setSelectedFarmerVillage(null);
    }
  }, [mapVillage]);

  // Fetch soil, temperature, rainfall
  useEffect(() => {
    if (!selectedVillage) return;

    const villageCode = selectedVillage.village_code;

    setLoading(true);
    setError(null);

const token = localStorage.getItem("authToken");

Promise.all([
  fetch(
    `/api/soil_moisture/dashboard/soil-moisture-sensor?start_date=${startDate}&end_date=${endDate}&zone_id=${encodeURIComponent(
      selectedVillage.zone_id
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  ).then(r => r.json()),

  fetch(
    `/api/location_dashboard/davis-weather-v_code?start_date=${startDate}&end_date=${endDate}&village_code=${encodeURIComponent(
      villageCode
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  ).then(r => r.json()),
])

      .then(([soilRes, tempRes]) => {
        const soilData = Array.isArray(soilRes) ? soilRes : [];
        setSoilReadings(soilData);
        setRawSoilData(soilData);

        // -------------------------------
        // TEMPERATURE (with timestamp)
        // -------------------------------
        const tempData = Array.isArray(tempRes) ? tempRes : [];
        setRawTemperatureData(tempData);
        setTemperature(
          tempData.map((item) => {
            const raw = item.reading_time || item.date_time || "";
            const dateOnly = raw ? raw.split("T")[0] : "";

            return {
              date: dateOnly,            // for X-axis
              value: Number(item.temp_c ?? item.temp ?? 0),
              timestamp: raw,            // full for tooltip
            };
          })
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

  // Export temperature data as CSV (same format as DavisWeather.tsx)
  function exportTemperatureCSV() {
    if (!rawTemperatureData || rawTemperatureData.length === 0) {
      alert("No temperature data to export");
      return;
    }

    const headers = [
      "station_name",
      "reading_time",
      "temp_c",
      "high_temp_c",
      "low_temp_c",
      "humidity_percent",
      "dew_point_c",
      "wet_bulb_c",
      "wind_speed_kmph",
      "wind_direction_deg",
      "high_wind_speed_kmph",
      "high_wind_direction_deg",
      "rain_mm",
      "rain_rate_mm_per_hr",
      "solar_rad_w_per_m2",
      "high_solar_rad_w_per_m2",
      "et_mm",
      "barometer_hpa"
    ];

    const csvRows = rawTemperatureData.map(row => {
      const values = [
        row.station_name || "",
        row.reading_time || row.date_time || "",
        row.temp_c ?? row.temp ?? "",
        row.high_temp_c ?? "",
        row.low_temp_c ?? "",
        row.humidity_percent ?? "",
        row.dew_point_c ?? "",
        row.wet_bulb_c ?? "",
        row.wind_speed_kmph ?? "",
        row.wind_direction_deg ?? "",
        row.high_wind_speed_kmph ?? "",
        row.high_wind_direction_deg ?? "",
        row.rain_mm ?? "",
        row.rain_rate_mm_per_hr ?? "",
        row.solar_rad_w_per_m2 ?? "",
        row.high_solar_rad_w_per_m2 ?? "",
        row.et_mm ?? "",
        row.barometer_hpa ?? ""
      ];

      return values.map(v => {
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}`;
        }
        return s;
      }).join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `temperature_${selectedVillage?.village_code || 'data'}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export soil moisture data as CSV (same format as SoilMoistureSensor.tsx)
  function exportSoilCSV() {
    if (!rawSoilData || rawSoilData.length === 0) {
      alert("No soil moisture data to export");
      return;
    }

    const headers = [
      "farmer_name",
      "sensor1_name",
      "sensor1_value",
      "sensor2_name",
      "sensor2_value",
      "zone_id",
      "district_name",
      "block_name",
      "village_name",
      "date",
      "time"
    ];

    const csvRows = rawSoilData.map(row => {
      const values = [
        row.farmer_name || "",
        row.sensor1_name || "",
        row.sensor1_value || "",
        row.sensor2_name || "",
        row.sensor2_value || "",
        row.zone_id || selectedVillage?.zone_id || "",
        row.district_name || selectedDistrict || "",
        row.block_name || selectedBlock || "",
        row.village_name || selectedVillage?.v_name || "",
        row.date || "",
        row.time || ""
      ];

      return values.map(v => {
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}`;
        }
        return s;
      }).join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soil_moisture_live_${selectedVillage?.zone_id || 'data'}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/10 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2E3A3F] mb-6">
          Data Collection Dashboard
        </h1>


        {/* MAP SECTION */}
        <div className="bg-white rounded-xl border p-4 shadow-sm mb-6">
          <h3 className="text-md font-semibold mb-4">Geographic View - Farmer Plots</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-600 block mb-1">District</label>
              <select
                value={mapDistrict}
                onChange={e => setMapDistrict(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select District</option>
                {districts.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Block</label>
              <select
                value={mapBlock}
                onChange={e => setMapBlock(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={!mapDistrict}
              >
                <option value="">Select Block</option>
                {mapBlocks.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Village</label>
              <select
                value={mapVillage?.village_code ?? ""}
                onChange={e =>
                  setMapVillage(
                    mapFilteredVillages.find(v => v.village_code === e.target.value) || null
                  )
                }
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={!mapBlock}
              >
                <option value="">Select Village</option>
                {mapFilteredVillages.map(v => (
                  <option key={v.village_code} value={v.village_code}>
                    {v.v_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <VillageMapComponent height="500px" villageCode={selectedFarmerVillage} />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl border p-4 shadow-sm mb-6">
          <h3 className="text-md font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-gray-600 block mb-1">District</label>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {districts.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Block</label>
              <select
                value={selectedBlock}
                onChange={e => setSelectedBlock(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={!selectedDistrict}
              >
                {blocks.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">Village</label>
              <select
                value={selectedVillage?.v_name ?? ""}
                onChange={e =>
                  setSelectedVillage(
                    filteredVillages.find(v => v.v_name === e.target.value) || null
                  )
                }
                className="w-full border rounded px-3 py-2 text-sm"
                disabled={!selectedBlock}
              >
                {filteredVillages.map(v => (
                  <option key={v.village_code} value={v.v_name}>
                    {v.v_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">From</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">To</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600">Mode:</label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  checked={mode === "sensor"}
                  onChange={() => setMode("sensor")}
                />
                Sensor
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  checked={mode === "farm"}
                  onChange={() => setMode("farm")}
                />
                Farm
              </label>
            </div>

            <button
              className="ml-auto px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium"
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 20);
                setStartDate(fmt(start));
                setEndDate(fmt(end));
              }}
            >
              Reset Dates
            </button>
          </div>
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Soil Moisture</h3>
              <button
                onClick={exportSoilCSV}
                className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
              >
                Export CSV
              </button>
            </div>

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

        {/* TEMPERATURE & RAINFALL - WRAPPER CARD */}
        <div className="bg-white rounded-xl border p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold">Weather Data</h3>
            <button
              onClick={exportTemperatureCSV}
              className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
            >
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TEMPERATURE */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-gray-700">Temperature</h4>
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
            <div>
              <h4 className="text-sm font-medium mb-3 text-gray-700">Rainfall</h4>
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
        </div>

        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
    </div>
  );
}
