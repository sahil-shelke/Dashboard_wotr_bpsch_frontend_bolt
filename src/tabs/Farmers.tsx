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

// ---------------------------
// Types
// ---------------------------
export type CropRegistration = {
  crop_id?: string;
  plot_area?: string;
  season?: string;
  year?: string;
  [k: string]: any;
};

export type FarmerRecord = {
  farmer_id?: string;
  farmer_name?: string;
  farmer_mobile?: string;
  surveyor_id?: string;
  farmer_category?: string;
  block_code?: string;
  block_name?: string;
  district_code?: string;
  district_name?: string;
  village_code?: string;
  village_name?: string;
  crop_registrations?: CropRegistration[] | string; // sometimes stringified
  [k: string]: any;
};

// ---------------------------
// Helpers
// ---------------------------
function parseCropRegs(raw: any): CropRegistration[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeVal<T extends object, K extends keyof T>(obj: T | null, key: K) {
  if (!obj) return "—";
  const v = obj[key];
  if (v === undefined || v === null) return "—";
  if (typeof v === "string" && v.trim() === "") return "—";
  return v;
}

// ---------------------------
// Component
// ---------------------------
export default function FarmerRecordsTable() {
  const [data, setData] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FarmerRecord | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<FarmerRecord>();

  // Columns: choose a concise, useful default set
  const columns = [
    // Hidden/searchable - we include these so search covers them
    columnHelper.accessor("farmer_id", { header: "Farmer ID" }),
    columnHelper.accessor("farmer_category", { header: "Category" }),
    columnHelper.accessor("block_code", { header: "Block Code" }),
    columnHelper.accessor("district_code", { header: "District Code" }),
    columnHelper.accessor("village_code", { header: "Village Code" }),

    // Visible columns
    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),

    // Crop registrations count
    columnHelper.display({
      id: "crop_count",
      header: "Crops",
      cell: ({ row }) => {
        const raw = row.original.crop_registrations;
        const arr = parseCropRegs(raw);
        return <>{arr.length}</>;
      },
    }),

    // View action
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setSelected(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  // Column visibility initial state (hide codes by default)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_id: false,
    farmer_category: false,
    block_code: false,
    district_code: false,
    village_code: false,
  });

  // ---------------------------
  // Fetch data (adjust URL if needed)
  // ---------------------------
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farmers");
        const json = await res.json();
        if (!mounted) return;
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Failed to fetch farmers:", err);
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------
  // Initialize table
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div className="p-4">Loading...</div>;

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <input
          placeholder="Search..."
          className="border px-3 py-2 rounded-md w-64"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <div className="flex gap-3 items-center">
          <details className="border px-3 py-2 rounded-md">
            <summary className="cursor-pointer">Columns</summary>
            <div className="mt-2 flex flex-col gap-1">
              {table.getAllLeafColumns().map((col) => (
                <label key={col.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                  />
                  <span className="text-sm">{col.id}</span>
                </label>
              ))}
            </div>
          </details>
        </div>

        <div className="text-sm text-gray-700">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10 text-left">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 font-semibold border-b border-gray-300 tracking-wide cursor-pointer"
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
                className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 border-gray-200 align-top">
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

      {/* Modal — Full Farmer Details */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[620px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Farmer Details</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <section>
                <h3 className="text-sm font-semibold mb-2">Primary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Farmer ID</div>
                    <div className="text-sm">{safeVal(selected, "farmer_id")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">Name</div>
                    <div className="text-sm">{safeVal(selected, "farmer_name")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">Mobile</div>
                    <div className="text-sm">{safeVal(selected, "farmer_mobile")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">Surveyor ID</div>
                    <div className="text-sm">{safeVal(selected, "surveyor_id")}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Village</div>
                    <div className="text-sm">{safeVal(selected, "village_name")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">Block</div>
                    <div className="text-sm">{safeVal(selected, "block_name")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">District</div>
                    <div className="text-sm">{safeVal(selected, "district_name")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 uppercase">Category</div>
                    <div className="text-sm">{safeVal(selected, "farmer_category")}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Crop Registrations</h3>

                {parseCropRegs(selected?.crop_registrations).length === 0 ? (
                  <div className="text-sm text-gray-500">No crop registrations</div>
                ) : (
                  <div className="overflow-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">Crop ID</th>
                          <th className="p-2 border">Plot Area</th>
                          <th className="p-2 border">Season</th>
                          <th className="p-2 border">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseCropRegs(selected?.crop_registrations).map((c, idx) => (
                          <tr key={idx} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                            <td className="p-2 border">{c.crop_id || "—"}</td>
                            <td className="p-2 border">{c.plot_area || "—"}</td>
                            <td className="p-2 border">{c.season || "—"}</td>
                            <td className="p-2 border">{c.year || "—"}</td>
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
