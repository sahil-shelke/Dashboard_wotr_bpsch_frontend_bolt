"use client";

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

// ------------------------------
// Types
// ------------------------------
type NutrientReading = {
  SPAD1?: string;
  SPAD2?: string;
  SPAD3?: string;
  SPAD4?: string;
  SPAD5?: string;
  Nitrogen1?: string;
  Nitrogen2?: string;
  Nitrogen3?: string;
  Nitrogen4?: string;
  Nitrogen5?: string;
  reading_date?: string;
  Reading1_location?: string;
  Reading2_location?: string;
  Reading3_location?: string;
  Reading4_location?: string;
  Reading5_location?: string;
  [k: string]: any;
};

export type NutrientRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;

  nutrient_data: string; // JSON string
  nutrient_count: number;
};

// ------------------------------
// Helpers
// ------------------------------
function parseNutrientData(str?: string): NutrientReading[] {
  if (!str) return [];
  try {
    const arr = JSON.parse(str);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readingHasData(rd: NutrientReading) {
  const keys = [
    "SPAD1",
    "SPAD2",
    "SPAD3",
    "SPAD4",
    "SPAD5",
    "Nitrogen1",
    "Nitrogen2",
    "Nitrogen3",
    "Nitrogen4",
    "Nitrogen5",
    "Reading1_location",
    "Reading2_location",
    "Reading3_location",
    "Reading4_location",
    "Reading5_location",
  ];

  return keys.some((k) => {
    const v = rd[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
}

function getStatus(rec: NutrientRecord) {
  const arr = parseNutrientData(rec.nutrient_data);
  if (arr.length === 0) return "not_filled";

  const flags = arr.map((r) => readingHasData(r));
  if (flags.every((f) => !f)) return "not_filled";
  if (flags.every((f) => f)) return "filled";
  return "partial";
}

function firstDate(rec: NutrientRecord) {
  const arr = parseNutrientData(rec.nutrient_data);
  return arr[0]?.reading_date || "";
}
function lastDate(rec: NutrientRecord) {
  const arr = parseNutrientData(rec.nutrient_data);
  return arr[arr.length - 1]?.reading_date || "";
}

function safeVal(obj: any, key: string) {
  if (!obj) return "—";
  const v = obj[key];
  if (v === undefined || v === null) return "—";
  if (typeof v === "string" && v.trim() === "") return "—";
  return v;
}

// ------------------------------
// Component
// ------------------------------
export default function NutrientMonitoringTable() {
  const [data, setData] = useState<NutrientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NutrientRecord | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");

  const columnHelper = createColumnHelper<NutrientRecord>();

  // --------------------------------------------
  // Table Columns (NO STATUS COLUMN OUTSIDE)
  // --------------------------------------------
  const columns = [
    // Hidden searchable
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("crop_registration_id", { header: "Crop Reg ID" }),

    // Visible
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("nutrient_count", { header: "Count" }),

    columnHelper.display({
      id: "first_date",
      header: "First Reading",
      cell: ({ row }) => firstDate(row.original) || "—",
    }),

    columnHelper.display({
      id: "last_date",
      header: "Latest Reading",
      cell: ({ row }) => lastDate(row.original) || "—",
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white"
          onClick={() => setSelected(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  // --------------------------------------------
  // Fetch data
  // --------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/plant-nutrients");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --------------------------------------------
  // Apply Status Filter FIRST
  // --------------------------------------------
  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((r) => getStatus(r) === statusFilter);
  }, [data, statusFilter]);

  // --------------------------------------------
  // Table
  // --------------------------------------------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: false,
    crop_name_en: false,
    surveyor_name: false,
    village_name: false,
    block_name: false,
    district_name: false,
    crop_registration_id: false,
  });

  const table = useReactTable({
    data: filteredData,
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

  if (loading) return <div className="p-4">Loading...</div>;

  const filledCount = data.filter((d) => getStatus(d) === "filled").length;
  const partialCount = data.filter((d) => getStatus(d) === "partial").length;
  const notFilledCount = data.filter((d) => getStatus(d) === "not_filled").length;

  // --------------------------------------------
  // Render
  // --------------------------------------------
  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <input
          placeholder="Search…"
          className="border px-3 py-2 rounded w-60"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <select
            className="border px-3 py-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="filled">Filled</option>
            <option value="partial">Partially Filled</option>
            <option value="not_filled">Not Filled</option>
          </select>

          {/* Status Badges */}
          <div className="flex gap-2">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
              Filled: {filledCount}
            </span>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm">
              Partial: {partialCount}
            </span>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm">
              Not Filled: {notFilledCount}
            </span>
          </div>
        </div>

        <span className="text-sm text-gray-700">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </span>

        <details className="border px-3 py-2 rounded cursor-pointer">
          <summary>Columns</summary>
          <div className="mt-2 flex flex-col gap-1">
            {table.getAllLeafColumns().map((col) => (
              <label key={col.id} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={col.getIsVisible()}
                  onChange={col.getToggleVisibilityHandler()}
                />
                {col.id}
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto border rounded">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="p-3 border-b cursor-pointer"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc" && " ▲"}
                    {h.column.getIsSorted() === "desc" && " ▼"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`${i % 2 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 border-gray-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3 mt-4">
        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Prev
        </button>

        <span>
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>

      {/* ---------------- MODAL ---------------- */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[700px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Nutrient Monitoring Details</h2>

              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-5">
              {/* Farmer & location */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Farmer & Location</h3>

                {["farmer_name", "farmer_mobile", "village_name", "block_name", "district_name"].map(
                  (k) => (
                    <div key={k} className="border-b pb-2">
                      <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                      <div className="text-sm">{safeVal(selected, k)}</div>
                    </div>
                  )
                )}
              </section>

              {/* Summary */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Nutrient Count</div>
                    <div className="text-sm">{selected.nutrient_count}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">Status</div>
                    <div className="text-sm">{getStatus(selected)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">First Reading</div>
                    <div className="text-sm">{firstDate(selected) || "—"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">Latest Reading</div>
                    <div className="text-sm">{lastDate(selected) || "—"}</div>
                  </div>
                </div>
              </section>

              {/* Nutrient Reading Table */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Nutrient Readings</h3>

                <div className="overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Reading Date</th>
                        <th className="p-2 border">SPAD</th>
                        <th className="p-2 border">Nitrogen</th>
                        <th className="p-2 border">Locations</th>
                        <th className="p-2 border">Filled?</th>
                      </tr>
                    </thead>

                    <tbody>
                      {parseNutrientData(selected.nutrient_data).map((rd, idx) => {
                        const filled = readingHasData(rd);

                        const spad = [rd.SPAD1, rd.SPAD2, rd.SPAD3, rd.SPAD4, rd.SPAD5].filter(
                          (v) => v && String(v).trim() !== ""
                        );
                        const nitro = [
                          rd.Nitrogen1,
                          rd.Nitrogen2,
                          rd.Nitrogen3,
                          rd.Nitrogen4,
                          rd.Nitrogen5,
                        ].filter((v) => v && String(v).trim() !== "");

                        const rawLocs = [
                          rd.Reading1_location,
                          rd.Reading2_location,
                          rd.Reading3_location,
                          rd.Reading4_location,
                          rd.Reading5_location,
                        ].filter((v) => v && String(v).trim() !== "");

                        const locs: string[] = [];
                        rawLocs.forEach((l) => {
                          if (!l) return;

                          // Keep Marathi/Hindi as-is
                          if (/[\u0900-\u097F]/.test(l)) {
                            locs.push(l.trim());
                          } else {
                            l.split(/\s*Timestamp\s*[:-]?\s*/i)
                              .flatMap((p) => p.split(/\r?\n/))
                              .forEach((part) => {
                                const c = part.trim();
                                if (c) locs.push(c);
                              });
                          }
                        });

                        return (
                          <tr
                            key={idx}
                            className={`${
                              idx % 2 ? "bg-gray-50" : "bg-white"
                            } ${!filled ? "opacity-50" : ""}`}
                          >
                            <td className="p-2 border">{rd.reading_date || "—"}</td>

                            <td className="p-2 border align-top">
                              {spad.length ? (
                                <div className="flex flex-col">{spad.map((s, i) => <div key={i}>{s}</div>)}</div>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="p-2 border align-top">
                              {nitro.length ? (
                                <div className="flex flex-col">
                                  {nitro.map((n, i) => (
                                    <div key={i}>{n}</div>
                                  ))}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="p-2 border align-top whitespace-pre-wrap">
                              {locs.length ? (
                                <div className="flex flex-col">
                                  {locs.map((L, i) => (
                                    <div key={i}>{L}</div>
                                  ))}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="p-2 border">
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  filled
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {filled ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
