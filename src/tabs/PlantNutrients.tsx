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

type PlantNutrientReading = {
  plant_nutrient_id: number;
  reading_date: string;
  spad1: number;
  spad2: number;
  spad3: number;
  spad4: number;
  spad5: number;
  nitrogen1: number;
  nitrogen2: number;
  nitrogen3: number;
  nitrogen4: number;
  nitrogen5: number;
  reading_location_1: string;
  reading_location_2: string;
  reading_location_3: string;
  reading_location_4: string;
  reading_location_5: string;
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
  plant_nutrients: string;
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
  plant_nutrient_id: number;
  reading_date: string;
  spad1: number;
  spad2: number;
  spad3: number;
  spad4: number;
  spad5: number;
  nitrogen1: number;
  nitrogen2: number;
  nitrogen3: number;
  nitrogen4: number;
  nitrogen5: number;
  reading_location_1: string;
  reading_location_2: string;
  reading_location_3: string;
  reading_location_4: string;
  reading_location_5: string;
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

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

export default function PlantNutrientsTable() {
  const [rawData, setRawData] = useState<FarmerRecord[]>([]);
  const [data, setData] = useState<FlattenedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FlattenedReading | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    plant_nutrient_id: 0,
    reading_date: "",
    spad1: 0,
    spad2: 0,
    spad3: 0,
    spad4: 0,
    spad5: 0,
    nitrogen1: 0,
    nitrogen2: 0,
    nitrogen3: 0,
    nitrogen4: 0,
    nitrogen5: 0,
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
      columnHelper.accessor("spad1", { header: "SPAD 1" }),
      columnHelper.accessor("spad2", { header: "SPAD 2" }),
      columnHelper.accessor("spad3", { header: "SPAD 3" }),
      columnHelper.accessor("spad4", { header: "SPAD 4" }),
      columnHelper.accessor("spad5", { header: "SPAD 5" }),
      columnHelper.accessor("nitrogen1", { header: "N1" }),
      columnHelper.accessor("nitrogen2", { header: "N2" }),
      columnHelper.accessor("nitrogen3", { header: "N3" }),
      columnHelper.accessor("nitrogen4", { header: "N4" }),
      columnHelper.accessor("nitrogen5", { header: "N5" }),
      columnHelper.accessor("crop_registration_id", { header: "Crop Reg ID" }),
      columnHelper.accessor("plant_nutrient_id", { header: "Reading ID" }),
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
    spad1: false,
    spad2: false,
    spad3: false,
    spad4: false,
    spad5: false,
    nitrogen1: false,
    nitrogen2: false,
    nitrogen3: false,
    nitrogen4: false,
    nitrogen5: false,
    crop_registration_id: false,
    plant_nutrient_id: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/plant_nutrient/dashboard/get_all_records", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        setRawData(Array.isArray(json) ? json : []);

        const flattened: FlattenedReading[] = [];
        json.forEach((farmer: FarmerRecord) => {
          try {
            const readings: PlantNutrientReading[] = JSON.parse(farmer.plant_nutrients);
            readings.forEach(reading => {
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
                plant_nutrient_id: reading.plant_nutrient_id,
                reading_date: reading.reading_date,
                spad1: reading.spad1,
                spad2: reading.spad2,
                spad3: reading.spad3,
                spad4: reading.spad4,
                spad5: reading.spad5,
                nitrogen1: reading.nitrogen1,
                nitrogen2: reading.nitrogen2,
                nitrogen3: reading.nitrogen3,
                nitrogen4: reading.nitrogen4,
                nitrogen5: reading.nitrogen5,
                reading_location_1: reading.reading_location_1,
                reading_location_2: reading.reading_location_2,
                reading_location_3: reading.reading_location_3,
                reading_location_4: reading.reading_location_4,
                reading_location_5: reading.reading_location_5,
                created_at: reading.created_at,
              });
            });
          } catch (e) {
            console.error("Failed to parse plant_nutrients for farmer:", farmer.farmer_name, e);
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

    return data.filter(r => {
      if (districtFilter && r.district_name !== districtFilter) return false;
      if (blockFilter && r.block_name !== blockFilter) return false;
      if (villageFilter && r.village_name !== villageFilter) return false;

      return JSON.stringify(r).toLowerCase().includes(q);
    });
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
      const url = `/api/plant_nutrient/dashboard/get_export_data?season_id=${exportSeasonId}&season_year=${exportSeasonYear}`;

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
      a.download = `plant_nutrient_${SEASONS.find(s => s.id === exportSeasonId)?.name}_${exportSeasonYear}.csv`;
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
    if (!editForm.plant_nutrient_id) return;

    setIsSaving(true);
    try {
      const currentReading = data.find(r => r.plant_nutrient_id === readingId);
      if (!currentReading) return;

      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/plant_nutrient/dashboard/update/${readingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            reading_date: editForm.reading_date || currentReading.reading_date,
            spad1: editForm.spad1 ?? null,
            spad2: editForm.spad2 ?? null,
            spad3: editForm.spad3 ?? null,
            spad4: editForm.spad4 ?? null,
            spad5: editForm.spad5 ?? null,
            nitrogen1: editForm.nitrogen1 ?? null,
            nitrogen2: editForm.nitrogen2 ?? null,
            nitrogen3: editForm.nitrogen3 ?? null,
            nitrogen4: editForm.nitrogen4 ?? null,
            nitrogen5: editForm.nitrogen5 ?? null,
            reading_location_1: currentReading.reading_location_1,
            reading_location_2: currentReading.reading_location_2,
            reading_location_3: currentReading.reading_location_3,
            reading_location_4: currentReading.reading_location_4,
            reading_location_5: currentReading.reading_location_5,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      const updatedRecord = {
        ...currentReading,
        reading_date: editForm.reading_date,
        spad1: editForm.spad1,
        spad2: editForm.spad2,
        spad3: editForm.spad3,
        spad4: editForm.spad4,
        spad5: editForm.spad5,
        nitrogen1: editForm.nitrogen1,
        nitrogen2: editForm.nitrogen2,
        nitrogen3: editForm.nitrogen3,
        nitrogen4: editForm.nitrogen4,
        nitrogen5: editForm.nitrogen5,
      };

      if (selected?.plant_nutrient_id === readingId) {
        setSelected(updatedRecord);
      }

      setData(prev =>
        prev.map(item =>
          item.plant_nutrient_id === readingId ? updatedRecord : item
        )
      );

      setEditingId(null);
      alert("Successfully updated plant nutrient reading");
    } catch (error) {
      alert("Failed to update plant nutrient reading");
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
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
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
          <div className="bg-white w-[1100px] max-h-[95vh] rounded-lg shadow-xl p-5 overflow-y-auto my-8">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-3 border-b">
              <h2 className="text-lg font-semibold">All Plant Nutrient Readings</h2>
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
              <h3 className="text-md font-semibold mb-3">Plant Nutrient Readings History</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold">Date</th>
                      <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold">ID</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">SPAD1</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">SPAD2</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">SPAD3</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">SPAD4</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold">SPAD5</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold bg-blue-50">N1</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold bg-blue-50">N2</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold bg-blue-50">N3</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold bg-blue-50">N4</th>
                      <th className="px-3 py-2 text-right border-b border-gray-200 font-semibold bg-blue-50">N5</th>
                      <th className="px-3 py-2 text-center border-b border-gray-200 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data
                      .filter(r => r.crop_registration_id === selected.crop_registration_id)
                      .sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime())
                      .map((reading, idx) => {
                        const isEditing = editingId === reading.plant_nutrient_id;
                        return (
                          <tr
                            key={reading.plant_nutrient_id}
                            className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${reading.plant_nutrient_id === selected.plant_nutrient_id ? "ring-2 ring-blue-500" : ""}`}
                          >
                            <td className="px-3 py-2 border-b border-gray-200">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editForm.reading_date}
                                  onChange={e => setEditForm({ ...editForm, reading_date: e.target.value })}
                                  className="w-full px-1 py-1 border rounded text-xs"
                                />
                              ) : (
                                reading.reading_date
                              )}
                            </td>
                            <td className="px-3 py-2 border-b border-gray-200">{reading.plant_nutrient_id}</td>

                            {isEditing ? (
                              <>
                                {[1, 2, 3, 4, 5].map(i => (
                                  <td key={`spad${i}`} className="px-2 py-2 border-b border-gray-200">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editForm[`spad${i}` as keyof typeof editForm] as number}
                                      onChange={e => setEditForm({ ...editForm, [`spad${i}`]: parseFloat(e.target.value) || 0 })}
                                      className="w-full px-1 py-1 border rounded text-xs text-right"
                                    />
                                  </td>
                                ))}
                                {[1, 2, 3, 4, 5].map(i => (
                                  <td key={`nitrogen${i}`} className="px-2 py-2 border-b border-gray-200 bg-blue-50">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editForm[`nitrogen${i}` as keyof typeof editForm] as number}
                                      onChange={e => setEditForm({ ...editForm, [`nitrogen${i}`]: parseFloat(e.target.value) || 0 })}
                                      className="w-full px-1 py-1 border rounded text-xs text-right"
                                    />
                                  </td>
                                ))}
                              </>
                            ) : (
                              <>
                                {[1, 2, 3, 4, 5].map(i => (
                                  <td key={`spad${i}`} className="px-3 py-2 text-right border-b border-gray-200">
                                    {reading[`spad${i}` as keyof FlattenedReading] != null
                                      ? (reading[`spad${i}` as keyof FlattenedReading] as number).toFixed(2)
                                      : "—"}
                                  </td>
                                ))}
                                {[1, 2, 3, 4, 5].map(i => (
                                  <td key={`nitrogen${i}`} className="px-3 py-2 text-right border-b border-gray-200 bg-blue-50">
                                    {reading[`nitrogen${i}` as keyof FlattenedReading] != null
                                      ? (reading[`nitrogen${i}` as keyof FlattenedReading] as number).toFixed(2)
                                      : "—"}
                                  </td>
                                ))}
                              </>
                            )}

                            <td className="px-3 py-2 border-b border-gray-200 text-center">
                              {isEditing ? (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => saveRecord(reading.plant_nutrient_id)}
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
                                      plant_nutrient_id: reading.plant_nutrient_id,
                                      reading_date: reading.reading_date || "",
                                      spad1: reading.spad1 ?? 0,
                                      spad2: reading.spad2 ?? 0,
                                      spad3: reading.spad3 ?? 0,
                                      spad4: reading.spad4 ?? 0,
                                      spad5: reading.spad5 ?? 0,
                                      nitrogen1: reading.nitrogen1 ?? 0,
                                      nitrogen2: reading.nitrogen2 ?? 0,
                                      nitrogen3: reading.nitrogen3 ?? 0,
                                      nitrogen4: reading.nitrogen4 ?? 0,
                                      nitrogen5: reading.nitrogen5 ?? 0,
                                    });
                                    setEditingId(reading.plant_nutrient_id);
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
                  className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
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
