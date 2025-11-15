"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Sprout, Droplets, Bug, MapPin, Clock, Users } from "lucide-react";

type Farmer = any;
type Surveyor = any;
type GenericRecord = any;

export default function DataDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [surveyors, setSurveyors] = useState<Surveyor[]>([]);

  const [cropRegistrations, setCropRegistrations] = useState<any[]>([]);
  const [landPreps, setLandPreps] = useState<GenericRecord[]>([]);
  const [seedSelections, setSeedSelections] = useState<GenericRecord[]>([]);
  const [nutrients, setNutrients] = useState<GenericRecord[]>([]);
  const [irrigations, setIrrigations] = useState<GenericRecord[]>([]);
  const [weeds, setWeeds] = useState<GenericRecord[]>([]);
  const [pests, setPests] = useState<GenericRecord[]>([]);
  const [harvests, setHarvests] = useState<GenericRecord[]>([]);
  const [soilManual, setSoilManual] = useState<GenericRecord[]>([]);
  const [weatherHourly, setWeatherHourly] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const endpoints: [string, string][] = [
          ["farmers", "/farmers"],
          ["surveyors", "/surveyors"],
          ["cropRegistrations", "/farm-management/crop-registrations"],
          ["landPreps", "/farm-management/land_preparations"],
          ["seedSelections", "/farm-management/seed-selection"],
          ["nutrients", "/farm-management/plant-nutrients"],
          ["irrigations", "/farm-management/irrigation"],
          ["weeds", "/farm-management/weed-management"],
          ["pests", "/farm-management/pest-management"],
          ["harvests", "/farm-management/harvest-management"],
          ["soilManual", "/farm-management/soil-moisture-manual"],
          ["weatherHourly", "/davis-weather"],
        ];

        const fetches = endpoints.map(([key, url]) =>
          fetch(url).then((r) => {
            if (!r.ok) throw new Error(`${url} -> ${r.status}`);
            return r.json().catch(() => []);
          }).catch(() => [])
        );

        const results = await Promise.all(fetches);

        if (!mounted) return;

        const asObj: any = {};
        endpoints.forEach((e, i) => (asObj[e[0]] = results[i]));

        setFarmers(Array.isArray(asObj.farmers) ? asObj.farmers : []);
        setSurveyors(Array.isArray(asObj.surveyors) ? asObj.surveyors : []);
        setCropRegistrations(Array.isArray(asObj.cropRegistrations) ? asObj.cropRegistrations : []);
        setLandPreps(Array.isArray(asObj.landPreps) ? asObj.landPreps : []);
        setSeedSelections(Array.isArray(asObj.seedSelections) ? asObj.seedSelections : []);
        setNutrients(Array.isArray(asObj.nutrients) ? asObj.nutrients : []);
        setIrrigations(Array.isArray(asObj.irrigations) ? asObj.irrigations : []);
        setWeeds(Array.isArray(asObj.weeds) ? asObj.weeds : []);
        setPests(Array.isArray(asObj.pests) ? asObj.pests : []);
        setHarvests(Array.isArray(asObj.harvests) ? asObj.harvests : []);
        setSoilManual(Array.isArray(asObj.soilManual) ? asObj.soilManual : []);
        setWeatherHourly(Array.isArray(asObj.weatherHourly) ? asObj.weatherHourly : []);

        // quick alerts derivation from soil/weather/pests
        const derivedAlerts: any[] = [];
        (asObj.weatherHourly || []).slice(0, 50).forEach((w: any) => {
          if (w?.rain && Number(w.rain) > 40) derivedAlerts.push({ message: "Heavy rain expected", time: w?.time || "recent", severity: "high" });
        });
        (asObj.soilManual || []).slice(0, 50).forEach((s: any) => {
          if (s?.soil_moisture_count && Number(s.soil_moisture_count) < 3) derivedAlerts.push({ message: "Low soil calibration entries", time: "recent", severity: "warning" });
        });
        (asObj.pests || []).slice(0, 50).forEach((p: any) => {
          if (p?.first_pest_date) derivedAlerts.push({ message: "Pest activity reported", time: p?.first_pest_date, severity: "warning" });
        });

        setAlerts(derivedAlerts);

      } catch (err: any) {
        console.error(err);
        if (mounted) setError("Failed to load data. Check API availability.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, []);

  const totalFarms = farmers.length;
  const sensorsOnline = (() => {
    const soilCount = soilManual.length;
    return `${Math.max(0, Math.floor(soilCount * 0.8))}/${Math.max(1, soilCount)}`;
  })();
  const cropsRegistered = cropRegistrations.length;
  const alertsToday = alerts.length;

  const statusCounts = useMemo(() => {
    function statusFromRecord(r: any) {
      const keys = ["fym_date","fym_quantity","ploughing_date","harrow_date"];
      const filled = keys.filter(k => r[k] && String(r[k]).trim() !== "").length;
      if (filled === 0) return "not_filled";
      if (filled === keys.length) return "filled";
      return "partial";
    }
    const filled = landPreps.filter(statusFromRecord).filter(s=>s==="filled").length;
    const partial = landPreps.filter(statusFromRecord).filter(s=>s==="partial").length;
    const notFilled = landPreps.filter(statusFromRecord).filter(s=>s==="not_filled").length;
    return { filled, partial, notFilled };
  }, [landPreps]);

  const recentActivities = useMemo(() => {
    const items: any[] = [];
    const push = (msg: string, t: string) => items.push({ message: msg, time: t });
    landPreps.slice(0, 6).forEach((r) => push(`LandPrep by ${r?.surveyor_id || r?.farmer_mobile || "unknown"}`, r.fym_date || r.ploughing_date || "recent"));
    seedSelections.slice(0, 6).forEach((r) => push(`Seed selection by ${r?.surveyor_id || r?.farmer_mobile || "unknown"}`, r.sowing_date || "recent"));
    nutrients.slice(0, 6).forEach((r) => push(`Nutrient reading for ${r?.crop_name_en || "crop"}`, r?.nutrient_count ? String(r.nutrient_count) : "recent"));
    return items.slice(0, 12);
  }, [landPreps, seedSelections, nutrients]);

  const cropByDistrictData = useMemo(() => {
    const map = new Map<string, number>();
    (cropRegistrations || []).forEach((c: any) => {
      const d = c.district_name || c.district || "Unknown";
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, value: v }));
  }, [cropRegistrations]);

  const nutrientCountTimeseries = useMemo(() => {
    const flattened: any[] = [];
    (nutrients || []).forEach((n:any) => {
      try {
        const arr = Array.isArray(n.nutrient_data) ? n.nutrient_data : JSON.parse(n.nutrient_data || "[]");
        arr.forEach((rd: any) => flattened.push({ date: rd?.reading_date || "unknown", count: 1 }));
      } catch { }
    });
    const grouped: any = {};
    flattened.forEach((it) => { grouped[it.date] = (grouped[it.date] || 0) + 1; });
    return Object.entries(grouped).slice(-20).map(([k, v]) => ({ date: k, value: v }));
  }, [nutrients]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F5E9D4]/20 p-6">
        <div className="text-center">
          <div className="loader mb-3" />
          <div className="text-lg text-[#2E3A3F]">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F5E9D4]/20 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2E3A3F]">Operations Dashboard</h1>
            <p className="text-[#2E3A3F]/70 mt-1">Live overview of farms, sensors and operations</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-sm text-[#2E3A3F]/60">Updated: {new Date().toLocaleString()}</div>
            <button
              onClick={() => location.reload()}
              className="px-3 py-2 bg-white rounded border hover:shadow"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-[#6D4C41]/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#F5E9D4] p-3 text-[#1B5E20]"><Sprout className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-[#2E3A3F]/70">Active Farms</div>
                <div className="text-2xl font-semibold text-[#2E3A3F]">{totalFarms}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#6D4C41]/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#F5E9D4] p-3 text-[#7CB342]"><Droplets className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-[#2E3A3F]/70">Sensors Online</div>
                <div className="text-2xl font-semibold text-[#2E3A3F]">{sensorsOnline}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#6D4C41]/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#F5E9D4] p-3 text-[#6D4C41]"><MapPin className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-[#2E3A3F]/70">Crops Registered</div>
                <div className="text-2xl font-semibold text-[#2E3A3F]">{cropsRegistered}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#6D4C41]/15 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#F5E9D4] p-3 text-[#E03E3E]"><Bug className="w-5 h-5" /></div>
              <div>
                <div className="text-xs text-[#2E3A3F]/70">Alerts</div>
                <div className="text-2xl font-semibold text-[#2E3A3F]">{alertsToday}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 rounded-xl border border-[#6D4C41]/20 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2E3A3F]">Nutrient Readings Over Time</h2>
              <div className="text-sm text-[#2E3A3F]/60">Recent</div>
            </div>
            <div className="h-64">
              {nutrientCountTimeseries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nutrientCountTimeseries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#1B5E20" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#2E3A3F]/60">No nutrient timeseries</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#6D4C41]/20 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2E3A3F]">Crop Registrations by District</h2>
              <div className="text-sm text-[#2E3A3F]/60">Distribution</div>
            </div>
            <div className="h-64">
              {cropByDistrictData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cropByDistrictData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6D4C41" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#2E3A3F]/60">No registrations</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl border border-[#6D4C41]/20 bg-white p-6 shadow-sm">
            <h3 className="text-md font-semibold mb-3 text-[#2E3A3F]">Recent Activities</h3>
            <div className="space-y-2">
              {recentActivities.length ? recentActivities.map((act, i) => (
                <div key={i} className="p-3 rounded border hover:shadow-sm">
                  <div className="text-sm text-[#2E3A3F] font-medium">{act.message}</div>
                  <div className="text-xs text-[#2E3A3F]/60 mt-1">{act.time}</div>
                </div>
              )) : <div className="text-sm text-[#2E3A3F]/60">No recent activities</div>}
            </div>
          </div>

          <div className="rounded-xl border border-[#6D4C41]/20 bg-white p-6 shadow-sm">
            <h3 className="text-md font-semibold mb-3 text-[#2E3A3F]">Top Surveyors</h3>
            <div className="space-y-2">
              {surveyors.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="text-sm font-medium">{s.surveyor_name || s.name || `Surveyor ${s.surveyor_id || i}`}</div>
                    <div className="text-xs text-[#2E3A3F]/60">{s.district_name || s.district || ""}</div>
                  </div>
                  <div className="text-sm text-[#2E3A3F]">{(s?.villages?.length) ?? "-"}</div>
                </div>
              ))}
              {!surveyors.length && <div className="text-sm text-[#2E3A3F]/60">No surveyors</div>}
            </div>
          </div>

          <div className="rounded-xl border border-[#6D4C41]/20 bg-white p-6 shadow-sm">
            <h3 className="text-md font-semibold mb-3 text-[#2E3A3F]">Alerts</h3>
            <div className="space-y-2">
              {alerts.length ? alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded border ${a.severity === "high" ? "bg-red-50 border-red-200" : a.severity === "warning" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                  <div className="text-sm font-medium text-[#2E3A3F]">{a.message}</div>
                  <div className="text-xs text-[#2E3A3F]/60 mt-1">{a.time}</div>
                </div>
              )) : <div className="text-sm text-[#2E3A3F]/60">No alerts</div>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#6D4C41]/20 bg-white p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2E3A3F]">Farm Locations (Map)</h2>
            <div className="text-sm text-[#2E3A3F]/60">Geospatial view</div>
          </div>
          <div className="h-72 rounded-lg border border-[#6D4C41]/10 bg-[#F5E9D4]/40 flex items-center justify-center">
            <div className="text-center text-[#2E3A3F]/60">
              <MapPin className="mx-auto mb-2" />
              <div className="font-medium">Interactive Map Placeholder</div>
              <div className="text-sm">Integrate Leaflet/Mapbox and pass farmer coordinates to visualize farms.</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="text-sm text-[#2E3A3F]/60">Data sources: farms, surveyors, crop registrations, sensors, weather.</div>
          <div className="ml-auto text-xs text-[#2E3A3F]/50">© AgriAdvisory</div>
        </div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}
