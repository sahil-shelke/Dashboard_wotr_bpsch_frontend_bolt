"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
export type CropRegistrationRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;

  crop_registration_id: string;
  crop_id: string;
  farmer_id: string;
  plot_area: string;
  season: string;
  year: string;
};

// Helper for safe printing
function safe(obj: any, key: keyof CropRegistrationRecord) {
  const v = obj?.[key];
  return v && String(v).trim() !== "" ? v : "—";
}

// -----------------------------------------------------
// Component
// -----------------------------------------------------
export default function CropRegistrationTable() {
  const [data, setData] = useState<CropRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CropRegistrationRecord | null>(null);

  // table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<CropRegistrationRecord>();

  // -----------------------------------------------------
  // Columns
  // -----------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),

    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("plot_area", { header: "Plot Area" }),
    columnHelper.accessor("season", { header: "Season" }),
    columnHelper.accessor("year", { header: "Year" }),

    // Action column
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

  // default hidden columns
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    crop_registration_id: false,
    crop_id: false,
    farmer_id: false,
  });

  // -----------------------------------------------------
  // Fetch Data
  // -----------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/crop-registrations");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // -----------------------------------------------------
  // Table init
  // -----------------------------------------------------
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

  // -----------------------------------------------------
  // UI
  // -----------------------------------------------------
  return (
    <>
      {/* Controls */}
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

        <span className="text-gray-700 text-sm font-medium">
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
              <h2 className="text-lg font-semibold">Crop Registration Details</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">

              {/* Farmer */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Farmer Details</h3>
                {["farmer_name", "farmer_mobile", "farmer_id"].map((k) => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{safe(selected, k as any)}</div>
                  </div>
                ))}
              </section>

              {/* Crop Details */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Crop Details</h3>
                {["crop_name_en", "crop_id", "plot_area", "season", "year"].map((k) => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{safe(selected, k as any)}</div>
                  </div>
                ))}
              </section>

              {/* Surveyor & Location */}
              <section>
                <h3 className="text-sm font-semibold mb-2">Surveyor & Location</h3>
                {[
                  "surveyor_name",
                  "surveyor_id",
                  "village_name",
                  "block_name",
                  "district_name",
                ].map((k) => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{safe(selected, k as any)}</div>
                  </div>
                ))}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
