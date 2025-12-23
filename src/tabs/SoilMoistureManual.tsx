import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useEffect, useMemo, useState } from "react";
import { THEME } from "../utils/theme";

const SEASONS = [
  { id: 1, name: "Kharif" },
  { id: 2, name: "Rabi" },
  { id: 3, name: "Summer" },
  { id: 4, name: "Annual" },
];

type SoilMoistureReading = {
  soil_moisture_id: number;
  reading_date: string;
  sensor1_dry?: number | null;
  sensor1_wet?: number | null;
  sensor2_dry?: number | null;
  sensor2_wet?: number | null;
  sensor1_percent?: number | null;
  sensor2_percent?: number | null;
  created_at: string;
};

type FarmerRecord = {
  crop_registration_id: string;
  farmer_name: string;
  farmer_mobile: string;
  crop_name: string;
  plot_area: number | null;
  season: string | null;
  season_year: string | null;
  surveyor_name: string;
  surveyor_id: number;
  village_name: string;
  block_name: string;
  district_name: string;
  soil_moisture: string;
};

type FlattenedReading = {
  crop_registration_id: string;
  farmer_name: string;
  farmer_mobile: string;
  crop_name: string;
  plot_area: number | null;
  season: string | null;
  season_year: string | null;
  surveyor_name: string;
  surveyor_id: number;
  village_name: string;
  block_name: string;
  district_name: string;
  soil_moisture_id: number;
  reading_date: string;
  sensor1_dry?: number | null;
  sensor1_wet?: number | null;
  sensor2_dry?: number | null;
  sensor2_wet?: number | null;
  sensor1_percent: number | null;
  sensor2_percent: number | null;
  created_at: string;
};

function maskSurveyorId(v: any): string {
  if (!v) return "—";
  const s = String(v);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function maskName(v: string): string {
  if (!v) return "—";
  const parts = v.trim().split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}

function maskMobile(v: any): string {
  if (!v) return "—";
  const s = String(v);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function calculatePercent(dry: number | null | undefined, wet: number | null | undefined): number | null {
  if (!dry || dry === 0 || !wet) return null;
  return ((wet - dry) / dry) * 100;
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

export default function SoilMoistureManualTable() {
  const [rawData, setRawData] = useState<FarmerRecord[]>([]);
  const [data, setData] = useState<FlattenedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FlattenedReading | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    soil_moisture_id: 0,
    sensor1_dry: 0,
    sensor1_wet: 0,
    sensor2_dry: 0,
    sensor2_wet: 0,
  });

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSeasonId, setExportSeasonId] = useState(1);
  const [exportSeasonYear, setExportSeasonYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const columnHelper = createColumnHelper<FlattenedReading>();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor("farmer_name", {
        header: "Farmer",
        cell: info => maskName(info.getValue()),
      }),
      columnHelper.accessor("crop_name", { header: "Crop" }),
      columnHelper.accessor("plot_area", {
        header: "Plot Area",
        cell: info => {
          const v = info.getValue();
          return v != null ? v : "—";
        }
      }),
      columnHelper.accessor("season", {
        header: "Season",
        cell: info => info.getValue() || "—"
      }),
      columnHelper.accessor("season_year", {
        header: "Season Year",
        cell: info => info.getValue() || "—"
      }),
      columnHelper.accessor("district_name", { header: "District" }),
      columnHelper.accessor("block_name", { header: "Block" }),
      columnHelper.accessor("village_name", { header: "Village" }),
      columnHelper.accessor("reading_date", { header: "Reading Date" }),
      columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
      columnHelper.accessor("surveyor_id", {
        header: "Surveyor ID",
        cell: info => maskSurveyorId(info.getValue()),
      }),
      columnHelper.accessor("farmer_mobile", {
        header: "Mobile",
        cell: info => maskMobile(info.getValue()),
      }),
      columnHelper.accessor("sensor1_percent", {
        header: "Sensor 1 (%)",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("sensor2_percent", {
        header: "Sensor 2 (%)",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("sensor1_dry", {
        header: "S1 Dry",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("sensor1_wet", {
        header: "S1 Wet",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("sensor2_dry", {
        header: "S2 Dry",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("sensor2_wet", {
        header: "S2 Wet",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("crop_registration_id", { header: "Crop Reg ID" }),
      columnHelper.accessor("soil_moisture_id", { header: "Reading ID" }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button className={THEME.buttons.primary} onClick={() => setSelected(row.original)}>
            View
          </button>
        ),
      }),
    ];
  }, []);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: true,
    crop_name: true,
    plot_area: true,
    season: true,
    season_year: true,
    district_name: true,
    block_name: true,
    village_name: true,
    reading_date: true,
    actions: true,
    surveyor_name: false,
    surveyor_id: false,
    farmer_mobile: false,
    sensor1_percent: false,
    sensor2_percent: false,
    sensor1_dry: false,
    sensor1_wet: false,
    sensor2_dry: false,
    sensor2_wet: false,
    crop_registration_id: false,
    soil_moisture_id: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/soil_moisture/dashboard/get_all_records", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        setRawData(Array.isArray(json) ? json : []);

        const flattened: FlattenedReading[] = [];
        json.forEach((farmer: FarmerRecord) => {
          try {
            const readings: SoilMoistureReading[] = JSON.parse(farmer.soil_moisture);
            readings.forEach(reading => {
              const s1Percent = reading.sensor1_percent ?? calculatePercent(reading.sensor1_dry, reading.sensor1_wet);
              const s2Percent = reading.sensor2_percent ?? calculatePercent(reading.sensor2_dry, reading.sensor2_wet);

              flattened.push({
                crop_registration_id: farmer.crop_registration_id,
                farmer_name: farmer.farmer_name,
                farmer_mobile: farmer.farmer_mobile,
                crop_name: farmer.crop_name,
                plot_area: farmer.plot_area,
                season: farmer.season,
                season_year: farmer.season_year,
                surveyor_name: farmer.surveyor_name,
                surveyor_id: farmer.surveyor_id,
                village_name: farmer.village_name,
                block_name: farmer.block_name,
                district_name: farmer.district_name,
                soil_moisture_id: reading.soil_moisture_id,
                reading_date: reading.reading_date,
                sensor1_dry: reading.sensor1_dry,
                sensor1_wet: reading.sensor1_wet,
                sensor2_dry: reading.sensor2_dry,
                sensor2_wet: reading.sensor2_wet,
                sensor1_percent: s1Percent,
                sensor2_percent: s2Percent,
                created_at: reading.created_at,
              });
            });
          } catch (e) {
            console.error("Failed to parse soil_moisture for farmer:", farmer.farmer_name, e);
          }
        });

        setData(flattened);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const uniqueDistricts = useMemo(
    () => [...new Set(data.map(d => d.district_name))].filter(Boolean).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return [...new Set(
      data
        .filter(r => !districtFilter || r.district_name === districtFilter)
        .map(r => r.block_name)
    )].filter(Boolean).sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return [...new Set(
      data
        .filter(r => !districtFilter || r.district_name === districtFilter)
        .filter(r => !blockFilter || r.block_name === blockFilter)
        .map(r => r.village_name)
    )].filter(Boolean).sort();
  }, [data, districtFilter, blockFilter]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const finalData = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();

    const filtered = data.filter(r => {
      if (districtFilter && r.district_name !== districtFilter) return false;
      if (blockFilter && r.block_name !== blockFilter) return false;
      if (villageFilter && r.village_name !== villageFilter) return false;

      return JSON.stringify(r).toLowerCase().includes(q);
    });

    const latestByFarmer = new Map<string, FlattenedReading>();
    filtered.forEach(reading => {
      const existing = latestByFarmer.get(reading.crop_registration_id);
      if (!existing || new Date(reading.reading_date) > new Date(existing.reading_date)) {
        latestByFarmer.set(reading.crop_registration_id, reading);
      }
    });

    return Array.from(latestByFarmer.values());
  }, [data, globalFilter, districtFilter, blockFilter, villageFilter]);

  const table = useReactTable({
    data: finalData,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function exportCSV() {
    setShowExportModal(true);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `/api/soil_moisture/dashboard/get_export_data?season_id=${exportSeasonId}&season_year=${exportSeasonYear}`;

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Export failed");

      const exportData = await res.json();

      if (!Array.isArray(exportData) || exportData.length === 0) {
        alert("No data available for export");
        return;
      }

      const headers = Object.keys(exportData[0]);

      const rows = exportData.map(row =>
        headers.map(h => {
          const v = row[h];
          if (v == null) return "";
          const s = String(v);
          if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
      );

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url2 = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url2;
      a.download = `soil_moisture_${SEASONS.find(s => s.id === exportSeasonId)?.name}_${exportSeasonYear}.csv`;
      a.click();
      URL.revokeObjectURL(url2);

      setShowExportModal(false);
    } catch (error) {
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }

  async function saveRecord(readingId: number) {
    if (!editForm.soil_moisture_id) return;

    setIsSaving(true);
    try {
      const currentReading = data.find(r => r.soil_moisture_id === readingId);
      if (!currentReading) return;

      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/soil_moisture/dashboard/update/${readingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            reading_date: currentReading.reading_date,
            sensor1_dry: editForm.sensor1_dry ?? 0,
            sensor1_wet: editForm.sensor1_wet ?? 0,
            sensor2_dry: editForm.sensor2_dry ?? 0,
            sensor2_wet: editForm.sensor2_wet ?? 0,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      const s1Percent = calculatePercent(editForm.sensor1_dry, editForm.sensor1_wet);
      const s2Percent = calculatePercent(editForm.sensor2_dry, editForm.sensor2_wet);

      const updatedRecord = {
        ...currentReading,
        sensor1_dry: editForm.sensor1_dry,
        sensor1_wet: editForm.sensor1_wet,
        sensor2_dry: editForm.sensor2_dry,
        sensor2_wet: editForm.sensor2_wet,
        sensor1_percent: s1Percent,
        sensor2_percent: s2Percent,
      };

      if (selected?.soil_moisture_id === readingId) {
        setSelected(updatedRecord);
      }

      setData(prev =>
        prev.map(item =>
          item.soil_moisture_id === readingId ? updatedRecord : item
        )
      );

      setEditingId(null);
      alert("Successfully updated soil moisture reading");
    } catch (error) {
      alert("Failed to update soil moisture reading");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export
          </button>

          <details className="relative">
            <summary className="px-4 py-2 bg-gray-700 text-white rounded cursor-pointer">
              View Additional Data
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg p-3 max-h-72 overflow-auto z-50">
              {table.getAllLeafColumns().map(col => (
                <label key={col.id} className="flex items-center gap-2 mb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                  />
                  {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                </label>
              ))}
            </div>
          </details>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10"
              placeholder="Search..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10"
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10"
              disabled={!districtFilter}
              value={blockFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map(b => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded px-3 h-10"
              disabled={!blockFilter}
              value={villageFilter}
              onChange={e => setVillageFilter(e.target.value)}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end text-sm text-gray-700 mt-4">
          Showing {finalData.length} farmers (latest entries only)
        </div>
      </div>

      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className={THEME.table.theadText}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && " ▲"}
                    {header.column.getIsSorted() === "desc" && " ▼"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`${idx % 2 === 0 ? THEME.table.rowEven : THEME.table.rowOdd} ${THEME.table.rowHover}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className={THEME.table.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 items-center mt-4">
        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span>
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white w-[900px] max-h-[95vh] rounded-lg shadow-xl p-5 overflow-y-auto my-8">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-3 border-b">
              <h2 className="text-lg font-semibold">All Soil Moisture Readings</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => {
                  setSelected(null);
                  setEditingId(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Farmer & Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field name="Farmer Name" value={maskName(selected.farmer_name)} />
                  <Field name="Mobile" value={maskMobile(selected.farmer_mobile)} />
                  <Field name="Village" value={selected.village_name} />
                  <Field name="Block" value={selected.block_name} />
                  <Field name="District" value={selected.district_name} />
                  <Field name="Crop" value={selected.crop_name} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Surveyor</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field name="Surveyor Name" value={selected.surveyor_name} />
                  <Field name="Surveyor ID" value={maskSurveyorId(selected.surveyor_id)} />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-md font-semibold mb-3">Soil Moisture Readings History</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold">Date</th>
                      <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold">ID</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">S1 Dry</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">S1 Wet</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold bg-blue-50">S1 %</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">S2 Dry</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">S2 Wet</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold bg-blue-50">S2 %</th>
                      <th className="px-3 py-2 text-center border-b border-gray-200 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data
                      .filter(r => r.crop_registration_id === selected.crop_registration_id)
                      .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
                      .map((reading, idx) => {
                        const isEditing = editingId === reading.soil_moisture_id;
                        return (
                          <tr
                            key={reading.soil_moisture_id}
                            className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${reading.soil_moisture_id === selected.soil_moisture_id ? "ring-2 ring-blue-500" : ""}`}
                          >
                            <td className="px-3 py-2 border-b border-gray-200">{reading.reading_date}</td>
                            <td className="px-3 py-2 border-b border-gray-200">{reading.soil_moisture_id}</td>

                            {isEditing ? (
                              <>
                                <td className="px-2 py-2 border-b border-gray-200">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.sensor1_dry}
                                    onChange={e => setEditForm({ ...editForm, sensor1_dry: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-1 py-1 border rounded text-xs text-right"
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-200">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.sensor1_wet}
                                    onChange={e => setEditForm({ ...editForm, sensor1_wet: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-1 py-1 border rounded text-xs text-right"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right border-b border-gray-200 bg-blue-50 font-semibold text-xs">
                                  {editForm.sensor1_dry > 0 ? `${(((editForm.sensor1_wet - editForm.sensor1_dry) / editForm.sensor1_dry) * 100).toFixed(2)}%` : "—"}
                                </td>
                                <td className="px-2 py-2 border-b border-gray-200">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.sensor2_dry}
                                    onChange={e => setEditForm({ ...editForm, sensor2_dry: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-1 py-1 border rounded text-xs text-right"
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-200">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.sensor2_wet}
                                    onChange={e => setEditForm({ ...editForm, sensor2_wet: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-1 py-1 border rounded text-xs text-right"
                                  />
                                </td>
                                <td className="px-3 py-2 text-right border-b border-gray-200 bg-blue-50 font-semibold text-xs">
                                  {editForm.sensor2_dry > 0 ? `${(((editForm.sensor2_wet - editForm.sensor2_dry) / editForm.sensor2_dry) * 100).toFixed(2)}%` : "—"}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-3 py-2 text-right border-b border-gray-200">
                                  {reading.sensor1_dry != null ? reading.sensor1_dry.toFixed(2) : "—"}
                                </td>
                                <td className="px-3 py-2 text-right border-b border-gray-200">
                                  {reading.sensor1_wet != null ? reading.sensor1_wet.toFixed(2) : "—"}
                                </td>
                                <td className="px-3 py-2 text-right border-b border-gray-200 bg-blue-50 font-semibold">
                                  {reading.sensor1_percent != null ? `${reading.sensor1_percent.toFixed(2)}%` : "—"}
                                </td>
                                <td className="px-3 py-2 text-right border-b border-gray-200">
                                  {reading.sensor2_dry != null ? reading.sensor2_dry.toFixed(2) : "—"}
                                </td>
                                <td className="px-3 py-2 text-right border-b border-gray-200">
                                  {reading.sensor2_wet != null ? reading.sensor2_wet.toFixed(2) : "—"}
                                </td>
                                <td className="px-3 py-2 text-right border-b border-gray-200 bg-blue-50 font-semibold">
                                  {reading.sensor2_percent != null ? `${reading.sensor2_percent.toFixed(2)}%` : "—"}
                                </td>
                              </>
                            )}

                            <td className="px-3 py-2 border-b border-gray-200 text-center">
                              {isEditing ? (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => saveRecord(reading.soil_moisture_id)}
                                    disabled={isSaving}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {isSaving ? "..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    disabled={isSaving}
                                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditForm({
                                      soil_moisture_id: reading.soil_moisture_id,
                                      sensor1_dry: reading.sensor1_dry ?? 0,
                                      sensor1_wet: reading.sensor1_wet ?? 0,
                                      sensor2_dry: reading.sensor2_dry ?? 0,
                                      sensor2_wet: reading.sensor2_wet ?? 0,
                                    });
                                    setEditingId(reading.soil_moisture_id);
                                  }}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[450px] rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Export Data</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setShowExportModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Season</label>
                <select
                  className="border rounded px-3 h-10"
                  value={exportSeasonId}
                  onChange={e => setExportSeasonId(Number(e.target.value))}
                >
                  {SEASONS.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Season Year</label>
                <input
                  type="number"
                  className="border rounded px-3 h-10"
                  value={exportSeasonYear}
                  onChange={e => setExportSeasonYear(Number(e.target.value))}
                  min="2000"
                  max="2100"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isExporting ? "Exporting..." : "Export"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
