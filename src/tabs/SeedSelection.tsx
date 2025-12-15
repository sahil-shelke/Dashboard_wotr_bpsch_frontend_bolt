

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

// --------------------------------------------------
// TYPES
// --------------------------------------------------
export type SeedSelectionRecord = {
  farmer_name?: string;
  farmer_mobile?: string;
  crop_name_en?: string;
  surveyor_name?: string;
  surveyor_id?: string;
  village_name?: string;
  block_name?: string;
  district_name?: string;
  crop_registration_id?: string;
  plot_area?: string;

  bio_fertilizer_1_name?: string;
  bio_fertilizer_1_quantity?: string;
  bio_fertilizer_1_unit?: string;

  bio_fertilizer_2_name?: string;
  bio_fertilizer_2_quantity?: string;
  bio_fertilizer_2_unit?: string;

  bio_fertilizer_3_name?: string;
  bio_fertilizer_3_quantity?: string;
  bio_fertilizer_3_unit?: string;

  duration?: string;

  insecticide_1_name?: string;
  insecticide_1_quantity?: string;
  insecticide_1_unit?: string;

  insecticide_2_name?: string;
  insecticide_2_quantity?: string;
  insecticide_2_unit?: string;

  insecticide_3_name?: string;
  insecticide_3_quantity?: string;
  insecticide_3_unit?: string;

  seed_rate_kg_per_plot?: string;
  sowing_date?: string;
  sowing_method?: string;
  spacing_cm_squared?: string;
  variety_name?: string;
  transplanting_date?: string;
  nursery_sowing_date?: string;
  plantation_date?: string;
  bahar?: string;
  water_stress_date?: string;

  [k: string]: any;
};

// ALL FIELDS (corrected names)
const schemaFields: (keyof SeedSelectionRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "crop_registration_id",
  "plot_area",
  "bio_fertilizer_1_name",
  "bio_fertilizer_1_quantity",
  "bio_fertilizer_1_unit",
  "bio_fertilizer_2_name",
  "bio_fertilizer_2_quantity",
  "bio_fertilizer_2_unit",
  "bio_fertilizer_3_name",
  "bio_fertilizer_3_quantity",
  "bio_fertilizer_3_unit",
  "duration",
  "insecticide_1_name",
  "insecticide_1_quantity",
  "insecticide_1_unit",
  "insecticide_2_name",
  "insecticide_2_quantity",
  "insecticide_2_unit",
  "insecticide_3_name",
  "insecticide_3_quantity",
  "insecticide_3_unit",
  "seed_rate_kg_per_plot",
  "sowing_date",
  "sowing_method",
  "spacing_cm_squared",
  "variety_name",
  "transplanting_date",
  "nursery_sowing_date",
  "plantation_date",
  "bahar",
  "water_stress_date",
];

// --------------------------------------------------
// MASK HELPERS (show only last 4 digits)
// --------------------------------------------------
function mask(value: any) {
  if (value === null || value === undefined) return "—";
  const s = String(value);
  if (s.trim() === "") return "—";
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

// MASK ENTIRE FIRST NAME
function maskName(value: string) {
  if (!value) return "—";
  const parts = value.split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}


// --------------------------------------------------
// STATUS (same simple rules used previously)
// --------------------------------------------------
function getStatus(record: SeedSelectionRecord) {


  const fields = [record.variety_name]  
 
  if (record.crop_name_en=='Pomegranate'){
    fields.push(record.bahar)
    fields.push(record.plantation_date)
  }
  else
  {
    fields.push(record.sowing_date)
    fields.push(record.seed_rate_kg_per_plot)
  }
  
  const filledCount = fields.filter((v) => v && String(v).trim() !== "").length;
  if (filledCount === 0) return "On-going";
  if (filledCount >= fields.length) return "Completed";
}

// --------------------------------------------------
// Modal Helpers (simple key/value)
// --------------------------------------------------
function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function SeedSelectionTable() {
  const [data, setData] = useState<SeedSelectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<SeedSelectionRecord | null>(null);

  const [completionFilter, setCompletionFilter] =
    useState<"all" | "Completed" | "On-going">("Completed");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<SeedSelectionRecord>();

  // -------------------------
  // Table state
  // -------------------------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  // initial column visibility: replicate previous defaults
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const s: VisibilityState = {};
    schemaFields.forEach((f) => (s[f] = false));
    // default visible columns
    ["farmer_name", "crop_name_en" ,"sowing_date", "district_name","block_name","village_name","plot_area", "seed_rate_kg_per_plot"].forEach(
      (k) => (s[k as keyof SeedSelectionRecord] = true)
    );
    return s;
  });

  // -------------------------
  // Columns (dynamically from schemaFields, but mask mobile and surveyor)
  // -------------------------
const columns = useMemo(() => {
  const cols = schemaFields.map((field) => {
    const id = String(field);

    // MASK farmer_name → XXXXX Patil
    if (id === "farmer_name") {
      return columnHelper.accessor(id as any, {
        header: id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        cell: (info) => maskName(info.getValue()),
      });
    }

    // MASK mobile + surveyor
    if (id === "farmer_mobile" || id === "surveyor_id") {
      return columnHelper.accessor(id as any, {
        header: id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        cell: (info) => mask(info.getValue()),
      });
    }

    // DEFAULT (no masking)
    return columnHelper.accessor(id as any, {
      header: id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      cell: (info) => {
        const v = info.getValue();
        return v === undefined || v === null || v === "" ? "—" : String(v);
      },
    });
  });

    // actions column at the end
    cols.push(
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            className={THEME.buttons.primary}
            onClick={() => setSelectedRecord(row.original)}
          >
            View
          </button>
        ),
      })
    );

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Fetch
  // -------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/farm-management/seed_selection");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("seed selection fetch error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // -------------------------
  // Dependent filter lists
  // -------------------------
  const uniqueDistricts = useMemo(
    () => [...new Set(data.map((r) => r.district_name).filter(Boolean))].sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return [
      ...new Set(
        data
          .filter((r) => (!districtFilter || r.district_name === districtFilter))
          .map((r) => r.block_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return [
      ...new Set(
        data
          .filter((r) => (!districtFilter || r.district_name === districtFilter))
          .filter((r) => (!blockFilter || r.block_name === blockFilter))
          .map((r) => r.village_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [data, districtFilter, blockFilter]);

  // -------------------------
  // final filtered data (search + dependent filters + completion)
  // -------------------------
  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();
    return data.filter((rec) => {
      if (completionFilter !== "all" && getStatus(rec) !== completionFilter) return false;
      if (districtFilter && rec.district_name !== districtFilter) return false;
      if (blockFilter && rec.block_name !== blockFilter) return false;
      if (villageFilter && rec.village_name !== villageFilter) return false;
      if (g && !JSON.stringify(rec).toLowerCase().includes(g)) return false;
      return true;
    });
  }, [data, globalFilter, districtFilter, blockFilter, villageFilter, completionFilter]);

  // -------------------------
  // CSV Export with masking
  // -------------------------
  function exportCSV() {
    if (!finalData.length) return;

    const headers = schemaFields.map((h) => String(h));
    const rows = finalData.map((row) =>
      headers.map((h) => {
        let v: any = row[h];
        if (h === "farmer_name") v = maskName(v);
        if (h === "farmer_mobile" || h === "surveyor_id") v = mask(v);
        if (v === null || v === undefined) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      })
    );

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const BOM = "\uFEFF"; // UTF-8 BOM
    const blob = new Blob([BOM + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seed_selection.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // -------------------------
  // Table init (ensure columnVisibility is passed and updated)
  // -------------------------
  const table = useReactTable({
    data: finalData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      pagination,
    },
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

  if (loading) return <div className="p-6">Loading...</div>;

  // -------------------------
  // UI - Land Preparation style
  // -------------------------
  return (
    <div className="w-full">
      {/* FILTER PANEL */}
      <div className="bg-white border  rounded-lg p-4 shadow-sm mb-6 w-full">
        {/* TOP BUTTONS */}
        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Export
          </button>

          {/* COLUMN SELECTOR — working logic from old code */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => setShowColumnMenu((p) => !p)}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              View Additional Data
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 p-3 max-h-72 overflow-y-auto">
                {schemaFields.map((col) => {
                  const id = String(col);
                  const colObj = table.getColumn(id);
                  return (
                    <label key={id} className="flex items-center gap-2 text-sm mb-2">
                      <input
                        type="checkbox"
                        checked={colObj ? colObj.getIsVisible() : Boolean(columnVisibility[id])}
                        onChange={(e) => colObj && colObj.toggleVisibility(e.target.checked)}
                      />
                      {id.replace(/_/g, " ")}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SEARCH & DROPDOWNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SEARCH */}
          <div>
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10 w-full"
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          {/* DISTRICT */}
          <div>
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* BLOCK */}
          <div>
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={blockFilter}
              disabled={!districtFilter}
              onChange={(e) => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* VILLAGE */}
          <div>
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={villageFilter}
              disabled={!blockFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STATUS + COUNTER */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-3 h-10"
            value={completionFilter}
            onChange={(e) => setCompletionFilter(e.target.value as any)}
          >
            <option value="all">All Records</option>
            <option value="Completed">Completed</option>
            <option value="On-going">On-going</option>
          </select>

          {/* <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
              Completed: {data.filter((r) => getStatus(r) === "Completed").length}
          </span>

          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            On-going: {data.filter((r) => getStatus(r) === "On-going").length}
          </span> */}
            
          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length} records
          </span>
        </div>
      </div>

      {/* TABLE */}
      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
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
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={THEME.table.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
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

      {/* SIMPLE MODAL (A) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[480px] max-h-[85vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Seed Selection Details</h2>
              <button className="text-gray-600 text-xl" onClick={() => setSelectedRecord(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {schemaFields.map((k) => {
                let val: any = selectedRecord?.[k];
                if (k === "farmer_name") val = maskName(val);
                if (k === "farmer_mobile") val = mask(val);
                if (k === "surveyor_id") val = mask(val);

                return <FieldRow key={String(k)} label={String(k).replace(/_/g, " ")} value={val ?? "—"} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
