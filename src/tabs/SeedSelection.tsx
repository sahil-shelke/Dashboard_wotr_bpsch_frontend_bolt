import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useState, useEffect, useMemo } from "react";
import { THEME } from "../utils/theme";

const SEASONS = [
  { id: 1, name: "Kharif" },
  { id: 2, name: "Rabi" },
  { id: 3, name: "Summer" },
  { id: 4, name: "Annual" },
];

export type SeedSelectionRecord = {
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
  seed_selection_id: number;
  spacing_cm_squared: string | null;
  variety_name: string | null;
  seed_rate_kg_per_plot: number | null;
  sowing_date: string | null;
  sowing_method: string | null;
  nursery_sowing_date: string | null;
  transplanting_date: string | null;
  bahar: string | null;
  age_of_orchid: number | null;
  date_of_pruning: string | null;
  plantation_date: string | null;
  water_stress_date: string | null;
  duration_days: number | null;
  date_of_selection: string | null;
  bio_fertilizer_1_name: string | null;
  bio_fertilizer_1_quantity: number | null;
  bio_fertilizer_1_unit: string | null;
  bio_fertilizer_2_name: string | null;
  bio_fertilizer_2_quantity: number | null;
  bio_fertilizer_2_unit: string | null;
  bio_fertilizer_3_name: string | null;
  bio_fertilizer_3_quantity: number | null;
  bio_fertilizer_3_unit: string | null;
  insecticide_1_name: string | null;
  insecticide_1_quantity: number | null;
  insecticide_1_unit: string | null;
  insecticide_2_name: string | null;
  insecticide_2_quantity: number | null;
  insecticide_2_unit: string | null;
  insecticide_3_name: string | null;
  insecticide_3_quantity: number | null;
  insecticide_3_unit: string | null;
  created_at?: string;
  updated_at?: string;
};

const schemaFields: (keyof SeedSelectionRecord)[] = [
  "farmer_name",
  "crop_name",
  "plot_area",
  "season",
  "season_year",
  "district_name",
  "block_name",
  "village_name",
  "crop_registration_id",
  "farmer_mobile",
  "surveyor_name",
  "surveyor_id",
  "seed_selection_id",
  "spacing_cm_squared",
  "variety_name",
  "seed_rate_kg_per_plot",
  "sowing_date",
  "sowing_method",
  "nursery_sowing_date",
  "transplanting_date",
  "bahar",
  "age_of_orchid",
  "date_of_pruning",
  "plantation_date",
  "water_stress_date",
  "duration_days",
  "date_of_selection",
  "bio_fertilizer_1_name",
  "bio_fertilizer_1_quantity",
  "bio_fertilizer_1_unit",
  "bio_fertilizer_2_name",
  "bio_fertilizer_2_quantity",
  "bio_fertilizer_2_unit",
  "bio_fertilizer_3_name",
  "bio_fertilizer_3_quantity",
  "bio_fertilizer_3_unit",
  "insecticide_1_name",
  "insecticide_1_quantity",
  "insecticide_1_unit",
  "insecticide_2_name",
  "insecticide_2_quantity",
  "insecticide_2_unit",
  "insecticide_3_name",
  "insecticide_3_quantity",
  "insecticide_3_unit",
];

function mask(value: any) {
  if (!value) return "—";
  const s = String(value);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function maskName(value: string) {
  if (!value) return "—";
  const parts = value.split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}

function getStatus(record: SeedSelectionRecord) {
  const fields = [record.variety_name];

  if (record.crop_name === "Pomegranate") {
    fields.push(record.bahar);
    fields.push(record.plantation_date);
  } else {
    fields.push(record.sowing_date);
    fields.push(record.seed_rate_kg_per_plot ? String(record.seed_rate_kg_per_plot) : null);
  }

  const filledCount = fields.filter(v => v && String(v).trim() !== "").length;
  if (filledCount === 0) return "ongoing";
  if (filledCount >= fields.length) return "completed";
  return "ongoing";
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

export default function SeedSelectionTable() {
  const [data, setData] = useState<SeedSelectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SeedSelectionRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    variety_name: "",
    seed_rate_kg_per_plot: 0,
    sowing_date: "",
    sowing_method: "",
    spacing_cm_squared: "",
    transplanting_date: "",
    nursery_sowing_date: "",
    plantation_date: "",
    water_stress_date: "",
    duration_days: 0,
    date_of_selection: "",
    bahar: "",
    age_of_orchid: 0,
    date_of_pruning: "",
    bio_fertilizer_1_name: "",
    bio_fertilizer_1_quantity: 0,
    bio_fertilizer_1_unit: "",
    bio_fertilizer_2_name: "",
    bio_fertilizer_2_quantity: 0,
    bio_fertilizer_2_unit: "",
    bio_fertilizer_3_name: "",
    bio_fertilizer_3_quantity: 0,
    bio_fertilizer_3_unit: "",
    insecticide_1_name: "",
    insecticide_1_quantity: 0,
    insecticide_1_unit: "",
    insecticide_2_name: "",
    insecticide_2_quantity: 0,
    insecticide_2_unit: "",
    insecticide_3_name: "",
    insecticide_3_quantity: 0,
    insecticide_3_unit: "",
  });

  const [completionFilter, setCompletionFilter] = useState<"all" | "completed" | "ongoing">("completed");
  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSeasonId, setExportSeasonId] = useState(1);
  const [exportSeasonYear, setExportSeasonYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const columnHelper = createColumnHelper<SeedSelectionRecord>();

  const columns = useMemo(() => {
    const cols = schemaFields.map(field => {
      if (field === "farmer_name") {
        return columnHelper.accessor(field, {
          header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => maskName(info.getValue()),
        });
      }

      if (field === "farmer_mobile" || field === "surveyor_id") {
        return columnHelper.accessor(field, {
          header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => mask(info.getValue()),
        });
      }

      return columnHelper.accessor(field, {
        header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        cell: info => {
          const v = info.getValue();
          if (v === null || v === undefined) return "—";
          return String(v);
        },
      });
    });

    cols.push(
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button className={THEME.buttons.primary} onClick={() => setSelected(row.original)}>
            View
          </button>
        ),
      })
    );

    return cols;
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/seed_selection/dashboard/get_all_records", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const v: VisibilityState = {};
    schemaFields.forEach(f => (v[f] = false));

    v["farmer_name"] = true;
    v["crop_name"] = true;
    v["plot_area"] = true;
    v["season"] = true;
    v["season_year"] = true;
    v["district_name"] = true;
    v["block_name"] = true;
    v["village_name"] = true;

    return v;
  });

  const uniqueDistricts = useMemo(
    () => [...new Set(data.map(r => r.district_name).filter(Boolean))].sort(),
    [data]
  );

  const uniqueBlocks = useMemo(
    () =>
      [...new Set(
        data
          .filter(r => !districtFilter || r.district_name === districtFilter)
          .map(r => r.block_name)
          .filter(Boolean)
      )].sort(),
    [data, districtFilter]
  );

  const uniqueVillages = useMemo(
    () =>
      [...new Set(
        data
          .filter(r => !districtFilter || r.district_name === districtFilter)
          .filter(r => !blockFilter || r.block_name === blockFilter)
          .map(r => r.village_name)
          .filter(Boolean)
      )].sort(),
    [data, districtFilter, blockFilter]
  );

  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(record => {
      if (completionFilter !== "all" && getStatus(record) !== completionFilter) return false;
      if (districtFilter && record.district_name !== districtFilter) return false;
      if (blockFilter && record.block_name !== blockFilter) return false;
      if (villageFilter && record.village_name !== villageFilter) return false;
      if (g && !JSON.stringify(record).toLowerCase().includes(g)) return false;
      return true;
    });
  }, [data, completionFilter, districtFilter, blockFilter, villageFilter, globalFilter]);

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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function exportCSV() {
    setShowExportModal(true);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `/api/seed_selection/dashboard/get_export_data?season_id=${exportSeasonId}&season_year=${exportSeasonYear}`;

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
      a.download = `seed_selection_${SEASONS.find(s => s.id === exportSeasonId)?.name}_${exportSeasonYear}.csv`;
      a.click();
      URL.revokeObjectURL(url2);

      setShowExportModal(false);
    } catch (error) {
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }

  async function saveRecord() {
    if (!selected) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/seed_selection/dashboard/update/${selected.crop_registration_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            variety_name: editForm.variety_name || null,
            seed_rate_kg_per_plot: editForm.seed_rate_kg_per_plot,
            sowing_date: editForm.sowing_date || null,
            sowing_method: editForm.sowing_method || null,
            spacing_cm_squared: editForm.spacing_cm_squared || null,
            transplanting_date: editForm.transplanting_date || null,
            nursery_sowing_date: editForm.nursery_sowing_date || null,
            plantation_date: editForm.plantation_date || null,
            water_stress_date: editForm.water_stress_date || null,
            duration_days: editForm.duration_days,
            date_of_selection: editForm.date_of_selection || null,
            bahar: editForm.bahar || null,
            age_of_orchid: editForm.age_of_orchid,
            date_of_pruning: editForm.date_of_pruning || null,
            bio_fertilizer_1_name: editForm.bio_fertilizer_1_name || null,
            bio_fertilizer_1_quantity: editForm.bio_fertilizer_1_quantity,
            bio_fertilizer_1_unit: editForm.bio_fertilizer_1_unit || null,
            bio_fertilizer_2_name: editForm.bio_fertilizer_2_name || null,
            bio_fertilizer_2_quantity: editForm.bio_fertilizer_2_quantity,
            bio_fertilizer_2_unit: editForm.bio_fertilizer_2_unit || null,
            bio_fertilizer_3_name: editForm.bio_fertilizer_3_name || null,
            bio_fertilizer_3_quantity: editForm.bio_fertilizer_3_quantity,
            bio_fertilizer_3_unit: editForm.bio_fertilizer_3_unit || null,
            insecticide_1_name: editForm.insecticide_1_name || null,
            insecticide_1_quantity: editForm.insecticide_1_quantity,
            insecticide_1_unit: editForm.insecticide_1_unit || null,
            insecticide_2_name: editForm.insecticide_2_name || null,
            insecticide_2_quantity: editForm.insecticide_2_quantity,
            insecticide_2_unit: editForm.insecticide_2_unit || null,
            insecticide_3_name: editForm.insecticide_3_name || null,
            insecticide_3_quantity: editForm.insecticide_3_quantity,
            insecticide_3_unit: editForm.insecticide_3_unit || null,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      const updatedRecord = {
        ...selected,
        ...editForm,
      };

      setSelected(updatedRecord);
      setData(prev =>
        prev.map(item =>
          item.crop_registration_id === selected.crop_registration_id
            ? updatedRecord
            : item
        )
      );

      setIsEditing(false);
      alert("Successfully updated seed selection record");
    } catch (error) {
      alert("Failed to update seed selection record");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6 w-full">
        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Export
          </button>

          <div className="relative inline-block text-left">
            <button
              onClick={() => setShowColumnMenu(p => !p)}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              View Additional Data
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 p-3 max-h-72 overflow-y-auto">
                {schemaFields.map(col => {
                  const colObj = table.getColumn(String(col));
                  return (
                    <label key={String(col)} className="flex items-center gap-2 text-sm mb-2">
                      <input
                        type="checkbox"
                        checked={colObj ? colObj.getIsVisible() : Boolean(columnVisibility[col])}
                        onChange={e => colObj && colObj.toggleVisibility(e.target.checked)}
                      />
                      {String(col).replace(/_/g, " ")}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10 w-full"
              placeholder="Search..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={blockFilter}
              disabled={!districtFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={villageFilter}
              disabled={!blockFilter}
              onChange={e => setVillageFilter(e.target.value)}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-3 h-10"
            value={completionFilter}
            onChange={e => setCompletionFilter(e.target.value as any)}
          >
            <option value="all">All Records</option>
            <option value="completed">Completed</option>
            <option value="ongoing">On-going</option>
          </select>

          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length} records
          </span>
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
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`${i % 2 === 0 ? THEME.table.rowEven : THEME.table.rowOdd} ${THEME.table.rowHover}`}
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

      <div className="flex gap-4 items-center mt-4">
        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span className="text-sm">
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white w-[700px] max-h-[95vh] rounded-lg shadow-xl p-5 overflow-y-auto my-8">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-3 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Seed Selection Details</h2>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    getStatus(selected) === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {getStatus(selected) === "completed" ? "Completed" : "On-going"}
                </span>
              </div>

              <button
                className="text-gray-500 hover:text-black"
                onClick={() => {
                  setSelected(null);
                  setIsEditing(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <Field name="Farmer Name" value={maskName(selected.farmer_name)} />
              <Field name="Farmer Mobile" value={mask(selected.farmer_mobile)} />
              <Field name="Crop Name" value={selected.crop_name} />
              <Field name="Surveyor Name" value={selected.surveyor_name} />
              <Field name="Surveyor ID" value={mask(selected.surveyor_id)} />
              <Field name="Village" value={selected.village_name} />
              <Field name="Block" value={selected.block_name} />
              <Field name="District" value={selected.district_name} />
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold">Seed Selection Details</h3>
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setEditForm({
                        variety_name: selected.variety_name || "",
                        seed_rate_kg_per_plot: selected.seed_rate_kg_per_plot || 0,
                        sowing_date: selected.sowing_date || "",
                        sowing_method: selected.sowing_method || "",
                        spacing_cm_squared: selected.spacing_cm_squared || "",
                        transplanting_date: selected.transplanting_date || "",
                        nursery_sowing_date: selected.nursery_sowing_date || "",
                        plantation_date: selected.plantation_date || "",
                        water_stress_date: selected.water_stress_date || "",
                        duration_days: selected.duration_days || 0,
                        date_of_selection: selected.date_of_selection || "",
                        bahar: selected.bahar || "",
                        age_of_orchid: selected.age_of_orchid || 0,
                        date_of_pruning: selected.date_of_pruning || "",
                        bio_fertilizer_1_name: selected.bio_fertilizer_1_name || "",
                        bio_fertilizer_1_quantity: selected.bio_fertilizer_1_quantity || 0,
                        bio_fertilizer_1_unit: selected.bio_fertilizer_1_unit || "",
                        bio_fertilizer_2_name: selected.bio_fertilizer_2_name || "",
                        bio_fertilizer_2_quantity: selected.bio_fertilizer_2_quantity || 0,
                        bio_fertilizer_2_unit: selected.bio_fertilizer_2_unit || "",
                        bio_fertilizer_3_name: selected.bio_fertilizer_3_name || "",
                        bio_fertilizer_3_quantity: selected.bio_fertilizer_3_quantity || 0,
                        bio_fertilizer_3_unit: selected.bio_fertilizer_3_unit || "",
                        insecticide_1_name: selected.insecticide_1_name || "",
                        insecticide_1_quantity: selected.insecticide_1_quantity || 0,
                        insecticide_1_unit: selected.insecticide_1_unit || "",
                        insecticide_2_name: selected.insecticide_2_name || "",
                        insecticide_2_quantity: selected.insecticide_2_quantity || 0,
                        insecticide_2_unit: selected.insecticide_2_unit || "",
                        insecticide_3_name: selected.insecticide_3_name || "",
                        insecticide_3_quantity: selected.insecticide_3_quantity || 0,
                        insecticide_3_unit: selected.insecticide_3_unit || "",
                      });
                      setIsEditing(true);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Record
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveRecord}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Basic Seed Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Variety Name</label>
                        <input
                          type="text"
                          value={editForm.variety_name}
                          onChange={e => setEditForm({ ...editForm, variety_name: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Seed Rate (kg/plot)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.seed_rate_kg_per_plot}
                          onChange={e =>
                            setEditForm({ ...editForm, seed_rate_kg_per_plot: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Sowing Date</label>
                        <input
                          type="date"
                          value={editForm.sowing_date}
                          onChange={e => setEditForm({ ...editForm, sowing_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Sowing Method</label>
                        <input
                          type="text"
                          value={editForm.sowing_method}
                          onChange={e => setEditForm({ ...editForm, sowing_method: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Spacing (cm²)</label>
                        <input
                          type="text"
                          value={editForm.spacing_cm_squared}
                          onChange={e => setEditForm({ ...editForm, spacing_cm_squared: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Date of Selection</label>
                        <input
                          type="date"
                          value={editForm.date_of_selection}
                          onChange={e => setEditForm({ ...editForm, date_of_selection: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Transplanting & Nursery</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Nursery Sowing Date</label>
                        <input
                          type="date"
                          value={editForm.nursery_sowing_date}
                          onChange={e => setEditForm({ ...editForm, nursery_sowing_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Transplanting Date</label>
                        <input
                          type="date"
                          value={editForm.transplanting_date}
                          onChange={e => setEditForm({ ...editForm, transplanting_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Orchard Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Plantation Date</label>
                        <input
                          type="date"
                          value={editForm.plantation_date}
                          onChange={e => setEditForm({ ...editForm, plantation_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Bahar</label>
                        <input
                          type="text"
                          value={editForm.bahar}
                          onChange={e => setEditForm({ ...editForm, bahar: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Age of Orchid</label>
                        <input
                          type="number"
                          value={editForm.age_of_orchid}
                          onChange={e => setEditForm({ ...editForm, age_of_orchid: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Date of Pruning</label>
                        <input
                          type="date"
                          value={editForm.date_of_pruning}
                          onChange={e => setEditForm({ ...editForm, date_of_pruning: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Water Stress Date</label>
                        <input
                          type="date"
                          value={editForm.water_stress_date}
                          onChange={e => setEditForm({ ...editForm, water_stress_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Duration (days)</label>
                        <input
                          type="number"
                          value={editForm.duration_days}
                          onChange={e => setEditForm({ ...editForm, duration_days: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Bio-fertilizers</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-sm font-medium">Bio-fertilizer 1 Name</label>
                          <input
                            type="text"
                            value={editForm.bio_fertilizer_1_name}
                            onChange={e => setEditForm({ ...editForm, bio_fertilizer_1_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.bio_fertilizer_1_quantity}
                            onChange={e =>
                              setEditForm({ ...editForm, bio_fertilizer_1_quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Unit</label>
                          <input
                            type="text"
                            value={editForm.bio_fertilizer_1_unit}
                            onChange={e => setEditForm({ ...editForm, bio_fertilizer_1_unit: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-sm font-medium">Bio-fertilizer 2 Name</label>
                          <input
                            type="text"
                            value={editForm.bio_fertilizer_2_name}
                            onChange={e => setEditForm({ ...editForm, bio_fertilizer_2_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.bio_fertilizer_2_quantity}
                            onChange={e =>
                              setEditForm({ ...editForm, bio_fertilizer_2_quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Unit</label>
                          <input
                            type="text"
                            value={editForm.bio_fertilizer_2_unit}
                            onChange={e => setEditForm({ ...editForm, bio_fertilizer_2_unit: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-sm font-medium">Bio-fertilizer 3 Name</label>
                          <input
                            type="text"
                            value={editForm.bio_fertilizer_3_name}
                            onChange={e => setEditForm({ ...editForm, bio_fertilizer_3_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.bio_fertilizer_3_quantity}
                            onChange={e =>
                              setEditForm({ ...editForm, bio_fertilizer_3_quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Unit</label>
                          <input
                            type="text"
                            value={editForm.bio_fertilizer_3_unit}
                            onChange={e => setEditForm({ ...editForm, bio_fertilizer_3_unit: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Insecticides</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-sm font-medium">Insecticide 1 Name</label>
                          <input
                            type="text"
                            value={editForm.insecticide_1_name}
                            onChange={e => setEditForm({ ...editForm, insecticide_1_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.insecticide_1_quantity}
                            onChange={e =>
                              setEditForm({ ...editForm, insecticide_1_quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Unit</label>
                          <input
                            type="text"
                            value={editForm.insecticide_1_unit}
                            onChange={e => setEditForm({ ...editForm, insecticide_1_unit: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-sm font-medium">Insecticide 2 Name</label>
                          <input
                            type="text"
                            value={editForm.insecticide_2_name}
                            onChange={e => setEditForm({ ...editForm, insecticide_2_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.insecticide_2_quantity}
                            onChange={e =>
                              setEditForm({ ...editForm, insecticide_2_quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Unit</label>
                          <input
                            type="text"
                            value={editForm.insecticide_2_unit}
                            onChange={e => setEditForm({ ...editForm, insecticide_2_unit: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-sm font-medium">Insecticide 3 Name</label>
                          <input
                            type="text"
                            value={editForm.insecticide_3_name}
                            onChange={e => setEditForm({ ...editForm, insecticide_3_name: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.insecticide_3_quantity}
                            onChange={e =>
                              setEditForm({ ...editForm, insecticide_3_quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Unit</label>
                          <input
                            type="text"
                            value={editForm.insecticide_3_unit}
                            onChange={e => setEditForm({ ...editForm, insecticide_3_unit: e.target.value })}
                            className="w-full px-3 py-2 border rounded mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Basic Seed Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Field name="Variety Name" value={selected.variety_name} />
                      <Field name="Seed Rate (kg/plot)" value={selected.seed_rate_kg_per_plot} />
                      <Field name="Sowing Date" value={selected.sowing_date} />
                      <Field name="Sowing Method" value={selected.sowing_method} />
                      <Field name="Spacing (cm²)" value={selected.spacing_cm_squared} />
                      <Field name="Date of Selection" value={selected.date_of_selection} />
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Transplanting & Nursery</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Field name="Nursery Sowing Date" value={selected.nursery_sowing_date} />
                      <Field name="Transplanting Date" value={selected.transplanting_date} />
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Orchard Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Field name="Plantation Date" value={selected.plantation_date} />
                      <Field name="Bahar" value={selected.bahar} />
                      <Field name="Age of Orchid" value={selected.age_of_orchid} />
                      <Field name="Date of Pruning" value={selected.date_of_pruning} />
                      <Field name="Water Stress Date" value={selected.water_stress_date} />
                      <Field name="Duration (days)" value={selected.duration_days} />
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium mb-3">Bio-fertilizers</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Bio-fertilizer 1</div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field name="Name" value={selected.bio_fertilizer_1_name} />
                          <Field name="Quantity" value={selected.bio_fertilizer_1_quantity} />
                          <Field name="Unit" value={selected.bio_fertilizer_1_unit} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Bio-fertilizer 2</div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field name="Name" value={selected.bio_fertilizer_2_name} />
                          <Field name="Quantity" value={selected.bio_fertilizer_2_quantity} />
                          <Field name="Unit" value={selected.bio_fertilizer_2_unit} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Bio-fertilizer 3</div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field name="Name" value={selected.bio_fertilizer_3_name} />
                          <Field name="Quantity" value={selected.bio_fertilizer_3_quantity} />
                          <Field name="Unit" value={selected.bio_fertilizer_3_unit} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Insecticides</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Insecticide 1</div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field name="Name" value={selected.insecticide_1_name} />
                          <Field name="Quantity" value={selected.insecticide_1_quantity} />
                          <Field name="Unit" value={selected.insecticide_1_unit} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Insecticide 2</div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field name="Name" value={selected.insecticide_2_name} />
                          <Field name="Quantity" value={selected.insecticide_2_quantity} />
                          <Field name="Unit" value={selected.insecticide_2_unit} />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">Insecticide 3</div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field name="Name" value={selected.insecticide_3_name} />
                          <Field name="Quantity" value={selected.insecticide_3_quantity} />
                          <Field name="Unit" value={selected.insecticide_3_unit} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
