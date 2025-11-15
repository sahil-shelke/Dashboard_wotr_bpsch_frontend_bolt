"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useEffect, useState } from "react";

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------
export type WeatherStationRecord = {
  id: number;
  station_id: number;
  station_name: string;
  reading_time: string;

  barometer_hpa: number;
  temp_c: number;
  high_temp_c: number;
  low_temp_c: number;
  humidity_percent: number;
  dew_point_c: number;
  wet_bulb_c: number;

  wind_speed_kmph: number;
  wind_direction_deg: number;
  high_wind_speed_kmph: number;
  high_wind_direction_deg: number;

  rain_mm: number;
  rain_rate_mm_per_hr: number;

  solar_rad_w_per_m2: number;
  high_solar_rad_w_per_m2: number;

  et_mm: number;

  [key: string]: any;
};

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
function safe(obj: any, key: keyof WeatherStationRecord) {
  const v = obj?.[key];
  return v !== undefined && v !== null && String(v).trim() !== "" ? v : "—";
}

// For HTML input <input type="date"> (YYYY-MM-DD)
function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

// Convert any date → MM/DD/YY (for display)
function formatDisplayDate(raw: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

// Convert YYYY-MM-DD → MM/DD/YY (for API)
function toApiDate(yyyy_mm_dd: string) {
  if (!yyyy_mm_dd) return "";
  const [yyyy, mm, dd] = yyyy_mm_dd.split("-");
  const yy = yyyy.slice(-2);
  return `${mm}/${dd}/${yy}`;
}

// -------------------------------------------------------------
export default function WeatherStationTable() {
  const [data, setData] = useState<WeatherStationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WeatherStationRecord | null>(null);

  // Default: yesterday → today
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const [stationId, setStationId] = useState("211815");
  const [startDate, setStartDate] = useState(formatDate(yesterday));
  const [endDate, setEndDate] = useState(formatDate(today));

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<WeatherStationRecord>();

  // -------------------------------------------------------------
  // Table Columns
  // -------------------------------------------------------------
  const columns = [
    columnHelper.accessor("station_name", { header: "Station" }),

    columnHelper.accessor("reading_time", {
      header: "Reading Time",
      cell: ({ getValue }) => formatDisplayDate(getValue()),
    }),

    columnHelper.accessor("temp_c", { header: "Temp (°C)" }),
    columnHelper.accessor("humidity_percent", { header: "Humidity (%)" }),
    columnHelper.accessor("wind_speed_kmph", { header: "Wind (kmph)" }),
    columnHelper.accessor("rain_mm", { header: "Rain (mm)" }),
    columnHelper.accessor("solar_rad_w_per_m2", { header: "Solar (W/m²)" }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setSelected(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // -------------------------------------------------------------
  // Fetch Data
  // -------------------------------------------------------------
  async function fetchData() {
    if (!stationId.trim()) return;

    setLoading(true);

    // Convert to API format MM/DD/YY
    const apiStart = toApiDate(startDate);
    const apiEnd = toApiDate(endDate);

    const url = `http://localhost:5000/api/farm-management/davis-weather?station_id=${stationId}&start_date=${apiStart}&end_date=${apiEnd}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // Table Setup
  // -------------------------------------------------------------
  const table = useReactTable({
    data,
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) return <div className="p-4">Loading...</div>;

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <>
      {/* FILTER BOX */}
      <div className="flex flex-wrap gap-4 items-end mb-4 p-3 border rounded-md bg-gray-50">
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Station ID *</label>
          <input
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            className="border px-3 py-2 rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-3 py-2 rounded"
          />
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>

      {/* SEARCH + COLUMN TOGGLE */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <input
          placeholder="Search…"
          className="border px-3 py-2 rounded w-60"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <details className="border px-3 py-2 rounded cursor-pointer">
          <summary>Columns</summary>
          <div className="mt-2 flex flex-col gap-1 max-h-60 overflow-auto">
            {table.getAllLeafColumns().map((col) => (
              <label key={col.id} className="flex items-center gap-2">
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

        <span className="text-sm text-gray-700">
          Showing {table.getFilteredRowModel().rows.length} of {data.length}
        </span>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-auto border rounded-md">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 font-semibold border-b cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === "asc" && " ▲"}
                    {header.column.getIsSorted() === "desc" && " ▼"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr key={row.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 border-b">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex gap-3 items-center mt-4">
        <button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          className="border px-3 py-1 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span>
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          className="border px-3 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white w-[500px] max-h-[85vh] rounded-lg p-5 shadow-xl overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Weather Station Reading
              </h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(selected).map((k) => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs text-gray-500 uppercase">
                    {k.replace(/_/g, " ")}
                  </div>

                  <div className="text-sm">
                    {k === "reading_time"
                      ? formatDisplayDate(selected[k])
                      : safe(selected, k as any)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
