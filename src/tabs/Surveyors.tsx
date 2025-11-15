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

import { useEffect, useState } from "react";

// ---------------------------
// Types
// ---------------------------
export type VillageItem = {
  village_code?: string;
  village_name?: string;
  [k: string]: any;
};

export type SurveyorRecord = {
  surveyor_id?: string;
  surveyor_name?: string;
  surveyor_pin?: string;
  state?: string;
  state_code?: string;
  district?: string;
  district_code?: string;
  block?: string;
  block_code?: string;
  station_id?: string;
  villages?: VillageItem[] | string;
  [k: string]: any;
};

// ---------------------------
// Helpers
// ---------------------------
function parseVillages(raw: any): VillageItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safe(obj: any, key: string) {
  const v = obj?.[key];
  return v ? v : "—";
}

// ---------------------------
// Component
// ---------------------------
export default function SurveyorRecordsTable() {
  const [data, setData] = useState<SurveyorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SurveyorRecord | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<SurveyorRecord>();

  // ---------------------------
  // Columns
  // ---------------------------
  const columns = [
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("surveyor_pin", { header: "PIN" }),
    columnHelper.accessor("state", { header: "State" }),
    columnHelper.accessor("district", { header: "District" }),
    columnHelper.accessor("block", { header: "Block" }),

    columnHelper.display({
      id: "village_count",
      header: "Villages",
      cell: ({ row }) => {
        const arr = parseVillages(row.original.villages);
        return arr.length;
      },
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          onClick={() => setSelected(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  // Default visibility
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    surveyor_pin: false,
    state_code: false,
    district_code: false,
    block_code: false,
    station_id: false,
  });

  // ---------------------------
  // Fetch
  // ---------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/surveyors");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---------------------------
  // Table
  // ---------------------------
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div className="p-4">Loading...</div>;

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <>
      {/* Top Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <input
          className="border px-3 py-2 rounded-md w-60"
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <details className="border px-3 py-2 rounded-md cursor-pointer">
          <summary>Columns</summary>
          <div className="mt-2 flex flex-col gap-1">
            {table.getAllLeafColumns().map((col) => (
              <label key={col.id} className="flex gap-2 items-center">
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
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </span>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto border rounded-md">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="p-3 border-b font-semibold cursor-pointer"
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
                className={i % 2 === 0 ? "bg-white border-b" : "bg-gray-50 border-b"}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex gap-3 items-center mt-4">
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

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[550px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Surveyor Details</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">

              {/* Basic */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Primary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Surveyor Name</div>
                    <div className="text-sm">{safe(selected, "surveyor_name")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Surveyor ID</div>
                    <div className="text-sm">{safe(selected, "surveyor_id")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">PIN</div>
                    <div className="text-sm">{safe(selected, "surveyor_pin")}</div>
                  </div>
                </div>
              </section>

              {/* Location */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">State</div>
                    <div className="text-sm">{safe(selected, "state")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">District</div>
                    <div className="text-sm">{safe(selected, "district")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Block</div>
                    <div className="text-sm">{safe(selected, "block")}</div>
                  </div>
                </div>
              </section>

              {/* Villages */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Villages</h3>

                {parseVillages(selected.villages).length === 0 ? (
                  <div className="text-sm text-gray-500">No villages</div>
                ) : (
                  <div className="border rounded overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">Village Code</th>
                          <th className="p-2 border">Village Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseVillages(selected.villages).map((v, idx) => (
                          <tr key={idx} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                            <td className="p-2 border">{v.village_code || "—"}</td>
                            <td className="p-2 border">{v.village_name || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
