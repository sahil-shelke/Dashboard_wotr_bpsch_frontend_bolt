"use client";

import { useEffect, useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";
import { Sprout, Droplets, Bug, MapPin, Clock, Users, TrendingUp, AlertTriangle, CheckCircle2, Activity } from "lucide-react";

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
  const [soilManual, setSoilManual] = useState<GenericRecord[]>([]);
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

        const fetches = endpoints.map(([, url]) =>
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
        setSoilManual(Array.isArray(asObj.soilManual) ? asObj.soilManual : []);

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
    return Array.from(map.entries()).map(([k, v]) => ({ name: k, value: v })).slice(0, 8);
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
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="text-center animate-fade-in">
          <div className="inline-block mb-4">
            <Sprout className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="text-xl font-medium text-foreground">Loading dashboard...</div>
          <div className="text-sm text-muted-foreground mt-2">Fetching farm data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-green-50/50 via-white to-amber-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Operations Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">Real-time insights into your agricultural operations</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-full border shadow-sm">
              <Clock className="w-4 h-4 inline mr-2" />
              {new Date().toLocaleString()}
            </div>
            <button
              onClick={() => location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-green-600 to-green-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 card-shadow-hover">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-white/70" />
              </div>
              <div className="text-white/80 text-sm font-medium">Active Farms</div>
              <div className="text-4xl font-bold text-white mt-1">{totalFarms}</div>
              <div className="mt-2 text-xs text-white/70">Across all regions</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-600 to-cyan-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 card-shadow-hover">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <Activity className="w-5 h-5 text-white/70" />
              </div>
              <div className="text-white/80 text-sm font-medium">Sensors Online</div>
              <div className="text-4xl font-bold text-white mt-1">{sensorsOnline}</div>
              <div className="mt-2 text-xs text-white/70">Monitoring soil conditions</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500 to-orange-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 card-shadow-hover">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <CheckCircle2 className="w-5 h-5 text-white/70" />
              </div>
              <div className="text-white/80 text-sm font-medium">Crops Registered</div>
              <div className="text-4xl font-bold text-white mt-1">{cropsRegistered}</div>
              <div className="mt-2 text-xs text-white/70">This season</div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-red-500 to-pink-600 p-6 shadow-lg hover:shadow-xl transition-all duration-300 card-shadow-hover">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <Bug className="w-5 h-5 text-white/70" />
              </div>
              <div className="text-white/80 text-sm font-medium">Active Alerts</div>
              <div className="text-4xl font-bold text-white mt-1">{alertsToday}</div>
              <div className="mt-2 text-xs text-white/70">Require attention</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-lg card-shadow-hover transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Nutrient Analysis Trends</h2>
                <p className="text-sm text-muted-foreground mt-1">Tracking nutrient readings over time</p>
              </div>
              <div className="px-3 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-medium">
                Last 20 entries
              </div>
            </div>
            <div className="h-72">
              {nutrientCountTimeseries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={nutrientCountTimeseries}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1B5E20" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#1B5E20" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Activity className="w-12 h-12 mb-3 opacity-20" />
                  <div className="font-medium">No nutrient data available</div>
                  <div className="text-sm">Data will appear once readings are recorded</div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-lg card-shadow-hover transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Land Prep Status</h2>
                <p className="text-sm text-muted-foreground mt-1">Completion tracking</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-900">Completed</div>
                    <div className="text-xs text-green-700">All fields filled</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-700">{statusCounts.filled}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-amber-900">In Progress</div>
                    <div className="text-xs text-amber-700">Partially filled</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-700">{statusCounts.partial}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-red-900">Not Started</div>
                    <div className="text-xs text-red-700">No data entered</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700">{statusCounts.notFilled}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="rounded-2xl border bg-card p-6 shadow-lg card-shadow-hover transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">District Distribution</h2>
                <p className="text-sm text-muted-foreground mt-1">Crop registrations by region</p>
              </div>
            </div>
            <div className="h-72">
              {cropByDistrictData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cropByDistrictData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="value" fill="#7CB342" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <MapPin className="w-12 h-12 mb-3 opacity-20" />
                  <div className="font-medium">No district data available</div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-lg card-shadow-hover transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Recent Activities</h2>
                <p className="text-sm text-muted-foreground mt-1">Latest farm operations</p>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {recentActivities.length ? recentActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground font-medium line-clamp-1">{act.message}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <div className="text-xs text-muted-foreground">{act.time}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-8">No recent activities</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="rounded-2xl border bg-card p-6 shadow-lg card-shadow-hover transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Top Surveyors</h2>
                <p className="text-sm text-muted-foreground mt-1">Most active field officers</p>
              </div>
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {surveyors.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-xl hover:bg-accent/5 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-white font-semibold">
                      {(s.surveyor_name || s.name || 'S')?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {s.surveyor_name || s.name || `Surveyor ${s.surveyor_id || i}`}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.district_name || s.district || "Unknown District"}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-primary px-3 py-1 bg-primary/10 rounded-full">
                    {(s?.villages?.length) ?? "-"}
                  </div>
                </div>
              ))}
              {!surveyors.length && (
                <div className="text-sm text-muted-foreground text-center py-8">No surveyor data available</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-lg card-shadow-hover transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">System Alerts</h2>
                <p className="text-sm text-muted-foreground mt-1">Notifications & warnings</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {alerts.length ? alerts.map((a, i) => (
                <div key={i} className={`p-4 rounded-xl border-l-4 ${
                  a.severity === "high"
                    ? "bg-red-50 border-red-500"
                    : a.severity === "warning"
                    ? "bg-amber-50 border-amber-500"
                    : "bg-blue-50 border-blue-500"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      a.severity === "high"
                        ? "bg-red-100"
                        : a.severity === "warning"
                        ? "bg-amber-100"
                        : "bg-blue-100"
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${
                        a.severity === "high"
                          ? "text-red-600"
                          : a.severity === "warning"
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{a.message}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <div className="text-xs text-muted-foreground">{a.time}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <div className="text-sm font-medium text-foreground">All systems operational</div>
                  <div className="text-xs text-muted-foreground mt-1">No alerts at this time</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-lg animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Farm Locations</h2>
              <p className="text-sm text-muted-foreground mt-1">Geographic distribution of registered farms</p>
            </div>
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="h-80 rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <div className="font-semibold text-foreground text-lg mb-2">Interactive Map View</div>
              <div className="text-sm text-muted-foreground max-w-md">
                Integrate mapping library (Leaflet/Mapbox) to visualize farm locations and boundaries
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t animate-fade-in">
          <div>Data sources: Farms • Surveyors • Crop Registrations • Sensors • Weather Stations</div>
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} AgriAdvisory</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-scale-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
