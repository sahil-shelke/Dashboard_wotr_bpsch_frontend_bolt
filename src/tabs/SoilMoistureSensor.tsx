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

// -----------------------------------------------------
// Types
// -----------------------------------------------------
export type SoilLiveRecord = {
  farmer_name: string;
  sensor1_name: string;
  sensor1_value: string;
  sensor2_name: string;
  sensor2_value: string;
  zone_id: string;
  district_name: string;
  block_name: string;
  village_name: string;
  date: string;
  time: string;
};

function safe(obj: any, key: keyof SoilLiveRecord) {
  const v = obj?.[key];
  return v && String(v).trim() !== "" ? v : "—";
}

// Utility: format date YYYY-MM-DD
function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

// -----------------------------------------------------
// Main Component
// -----------------------------------------------------
export default function SoilMoistureLiveTable() {
  const [data, setData] = useState<SoilLiveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------
  // Filters with defaults
  // -------------------------------
  const today = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  const [zoneId, setZoneId] = useState("zone05");
  const [startDate, setStartDate] = useState(formatDate(twoDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  const [selected, setSelected] = useState<SoilLiveRecord | null>(null);

  // -------------------------------
  // Table state
  // -------------------------------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<SoilLiveRecord>();

  // -------------------------------
  // Columns
  // -------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer" }),

    // hidden but searchable
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("village_name", { header: "Village" }),

    // visible main columns
    columnHelper.accessor("sensor1_name", { header: "Sensor 1" }),
    columnHelper.accessor("sensor1_value", { header: "Value 1" }),
    columnHelper.accessor("sensor2_name", { header: "Sensor 2" }),
    columnHelper.accessor("sensor2_value", { header: "Value 2" }),
    columnHelper.accessor("zone_id", { header: "Zone" }),
    columnHelper.accessor("date", { header: "Date" }),
    columnHelper.accessor("time", { header: "Time" }),

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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    district_name: false,
    block_name: false,
    village_name: false,
  });

  // -------------------------------
  // Fetch Data using query params
  // -------------------------------
  async function fetchData() {
    if (!zoneId.trim()) return;

    setLoading(true);

    const url = `http://localhost:5000/api/farm-management/soil-moisture-sensor?zone_id=${zoneId}&start_date=${startDate || ""}&end_date=${endDate || ""}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  // default fetch on first load
  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------
  // Table init
  // -------------------------------
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

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <>
      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 items-end mb-4 p-3 border rounded-md bg-gray-50">

        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">Zone ID *</label>
          <input
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="border px-3 py-2 rounded"
            placeholder="zone05"
            required
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

      {/* Search + columns */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <input
          placeholder="Search..."
          className="border px-3 py-2 rounded-md w-60"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <details className="border px-3 py-2 rounded-md cursor-pointer">
          <summary>Columns</summary>
          <div className="mt-2 flex flex-col gap-1">
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

        <span className="text-gray-700 text-sm">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </span>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-auto border rounded-md">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="p-3 border-b font-semibold cursor-pointer"
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
              <tr key={row.id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 border-b">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[450px] max-h-[85vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Soil Sensor Reading</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {[
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
                "time",
              ].map((k) => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                  <div className="text-sm">{safe(selected, k as any)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
