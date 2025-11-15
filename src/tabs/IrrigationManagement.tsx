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

import { useState, useEffect, useMemo } from "react";

// --------------------------------------------------
// TYPES
// --------------------------------------------------
export type IrrigationManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;

  crop_residue_tonnes_per_plot: string;
  crop_residue_mulching: string;
  irrigation_method: string;
  plastic_mulching: string;
  plastic_paper_micron: string;
  plastic_mulching_date: string;

  irrigation_data: string; // JSON string
  irrigation_count: number;
};

// --------------------------------------------------
// FIELDS FOR MODAL
// --------------------------------------------------
const schemaFields: (keyof IrrigationManagementRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "crop_registration_id",

  "crop_residue_tonnes_per_plot",
  "crop_residue_mulching",
  "irrigation_method",
  "plastic_mulching",
  "plastic_paper_micron",
  "plastic_mulching_date",

  "irrigation_count",
];

// --------------------------------------------------
// STATUS LOGIC
// --------------------------------------------------
function getStatus(record: IrrigationManagementRecord) {
  const fields = [
    record.crop_residue_tonnes_per_plot,
    record.crop_residue_mulching,
    record.irrigation_method,
    record.plastic_mulching,
    record.plastic_paper_micron,
    record.plastic_mulching_date,
  ];

  const filledCount = fields.filter(v => v && v.trim() !== "").length;

  if (filledCount === 0) return "not_filled";
  if (filledCount === fields.length) return "filled";
  return "partial";
}

// --------------------------------------------------
// PARSE IRRIGATION JSON SAFELY
// --------------------------------------------------
function parseIrrigationData(data: string) {
  if (!data || typeof data !== "string") return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function IrrigationManagementTable() {
  const [data, setData] = useState<IrrigationManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] =
    useState<IrrigationManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");

  const columnHelper = createColumnHelper<IrrigationManagementRecord>();

  // --------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------
  const columns = [
    // Hidden but searchable
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("crop_registration_id", { header: "Reg ID" }),

    // Visible
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("irrigation_method", { header: "Irrigation" }),
    columnHelper.accessor("irrigation_count", { header: "Count" }),
    columnHelper.accessor("plastic_mulching", { header: "Mulching" }),

    // View button
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setSelectedRecord(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  // --------------------------------------------------
  // FETCH DATA
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "http://localhost:5000/api/farm-management/irrigation"
        );
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --------------------------------------------------
  // TABLE STATES
  // --------------------------------------------------
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

  // --------------------------------------------------
  // APPLY STATUS FILTER
  // --------------------------------------------------
  const filteredByStatus = useMemo(() => {
    return data.filter(record =>
      completionFilter === "all" ? true : getStatus(record) === completionFilter
    );
  }, [data, completionFilter]);

  // --------------------------------------------------
  // TABLE INIT
  // --------------------------------------------------
  const table = useReactTable({
    data: filteredByStatus,
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

  if (loading) return <div className="p-4">Loading...</div>;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <>
      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">

        {/* Search */}
        <input
          placeholder="Search..."
          className="border px-3 py-2 rounded-md w-60"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />

        {/* Status Filter */}
        <select
          className="border px-3 py-2 rounded-md"
          value={completionFilter}
          onChange={e => setCompletionFilter(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="filled">Filled</option>
          <option value="partial">Partially Filled</option>
          <option value="not_filled">Not Filled</option>
        </select>

        {/* Status Badges */}
        <div className="flex gap-3 items-center">
          <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
            Filled: {data.filter(r => getStatus(r) === "filled").length}
          </span>

          <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
            Partial: {data.filter(r => getStatus(r) === "partial").length}
          </span>

          <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
            Not Filled: {data.filter(r => getStatus(r) === "not_filled").length}
          </span>
        </div>

        {/* Count */}
        <span className="text-gray-700 text-sm font-medium">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </span>

        {/* Column Toggle */}
        <details className="border px-3 py-2 rounded-md cursor-pointer">
          <summary>Columns</summary>
          <div className="mt-2 flex flex-col gap-1">
            {table.getAllLeafColumns().map(column => (
              <label key={column.id} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {column.id}
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10 text-left">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="p-3 font-semibold border-b border-gray-300 tracking-wide cursor-pointer bg-gray-50"
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
                className={`border-b ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition-colors`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-3 border-gray-200">
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

      {/* MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[480px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Irrigation Management Details</h2>

                {/* Status badge only */}
                <span
                  className={`
                    text-xs px-2 py-1 rounded
                    ${
                      getStatus(selectedRecord) === "filled"
                        ? "bg-green-100 text-green-700"
                        : getStatus(selectedRecord) === "partial"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }
                  `}
                >
                  {getStatus(selectedRecord).replace("_", " ")}
                </span>
              </div>

              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {schemaFields.map(key => (
                <div key={key} className="border-b pb-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-sm">
                    {selectedRecord[key] || <span className="text-gray-400">—</span>}
                  </div>
                </div>
              ))}

              {/* Irrigation Data Table */}
              <div className="mt-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Irrigation Data
                </div>

                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Date</th>
                      <th className="border p-2">Hours</th>
                      <th className="border p-2">Minutes</th>
                      <th className="border p-2">Count</th>
                    </tr>
                  </thead>

                  <tbody>
                    {parseIrrigationData(selectedRecord.irrigation_data).map(
                      (item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="border p-2">{item.date || "—"}</td>
                          <td className="border p-2">{item.hours || "—"}</td>
                          <td className="border p-2">{item.minutes || "—"}</td>
                          <td className="border p-2">
                            {item.irrigation_count || "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
