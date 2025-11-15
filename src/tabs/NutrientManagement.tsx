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
export type NutrientManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;

  urea_basal_dt: string;
  urea_basal_kg: string;
  ssp_date: string;
  ssp_kg: string;
  mop_date: string;
  mop_kg: string;
  dap_date: string;
  dap_kg: string;

  urea_30_days_dt: string;
  urea30das_kg: string;

  urea45days_date: string;
  urea45das_kg: string;

  foliar1_date: string;
  foliar1_name: string;
  foliar1_quantity: string;
  foliar1_unit: string;

  foliar2_date: string;
  foliar2_name: string;
  foliar2_quantity: string;
  foliar2_unit: string;

  foliar3_date: string;
  foliar3_name: string;
  foliar3_quantity: string;
  foliar3_unit: string;

  other_date: string;
  other_name: string;
  other_quantity_kg: string;

  other2_date: string;
  other2_name: string;
  other2_quantity_kg: string;
};

// --------------------------------------------------
// STATUS LOGIC
// --------------------------------------------------
function getStatus(r: NutrientManagementRecord) {
  const fields = [r.urea_basal_dt, r.ssp_date, r.mop_date, r.dap_date];
  const filled = fields.filter(v => v?.trim() !== "").length;

  if (filled === 0) return "not_filled";
  if (filled === fields.length) return "filled";
  return "partial";
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function NutrientManagementTable() {
  const [data, setData] = useState<NutrientManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NutrientManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const columnHelper = createColumnHelper<NutrientManagementRecord>();

  // --------------------------------------------------
  // COLUMNS
  // --------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor" }),
    columnHelper.accessor("crop_registration_id", { header: "Registration ID" }),

    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("urea_basal_dt", { header: "Urea Basal" }),
    columnHelper.accessor("ssp_date", { header: "SSP" }),
    columnHelper.accessor("mop_date", { header: "MOP" }),
    columnHelper.accessor("dap_date", { header: "DAP" }),

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

  // --------------------------------------------------
  // FETCH
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/nutrient-management");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --------------------------------------------------
  // TABLE STATE
  // --------------------------------------------------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: false,
    crop_name_en: false,
    village_name: false,
    block_name: false,
    district_name: false,
    surveyor_name: false,
    crop_registration_id: false,
  });

  // --------------------------------------------------
  // UNIQUE VALUES
  // --------------------------------------------------
  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name).filter(Boolean))).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    if (!districtFilter) return Array.from(new Set(data.map(r => r.block_name).filter(Boolean))).sort();
    return Array.from(
      new Set(
        data
          .filter(r => r.district_name === districtFilter)
          .map(r => r.block_name)
          .filter(Boolean)
      )
    ).sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(r =>
            districtFilter
              ? r.district_name === districtFilter
              : true
          )
          .filter(r => (blockFilter ? r.block_name === blockFilter : true))
          .map(r => r.village_name)
          .filter(Boolean)
      )
    ).sort();
  }, [data, districtFilter, blockFilter]);

  // --------------------------------------------------
  // FILTER LOGIC
  // --------------------------------------------------
  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(r => {
      if (completionFilter !== "all" && getStatus(r) !== completionFilter) return false;

      if (districtFilter && r.district_name !== districtFilter) return false;
      if (blockFilter && r.block_name !== blockFilter) return false;
      if (villageFilter && r.village_name !== villageFilter) return false;

      if (!g) return true;

      const searchable = Object.values(r).join(" ").toLowerCase();
      return searchable.includes(g);
    });
  }, [data, completionFilter, districtFilter, blockFilter, villageFilter, globalFilter]);

  // --------------------------------------------------
  // TABLE INIT
  // --------------------------------------------------
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

  if (loading) return <div className="p-4">Loading...</div>;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          
          {/* SEARCH */}
          <input
            placeholder="Search..."
            className="border px-3 py-2 rounded-md w-60"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />

          {/* Dependent Filters */}
          <div className="flex gap-2 items-center">
            <select
              className="border px-3 py-2 rounded-md"
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              className="border px-3 py-2 rounded-md"
              value={blockFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
              disabled={!districtFilter}
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              className="border px-3 py-2 rounded-md"
              value={villageFilter}
              onChange={e => setVillageFilter(e.target.value)}
              disabled={!blockFilter}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            {/* STATUS */}
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
          </div>

          {/* STATUS COUNTS */}
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

          {/* COUNT */}
          <span className="text-gray-700 text-sm font-medium">
            Showing {table.getFilteredRowModel().rows.length} / {data.length}
          </span>

          {/* COLUMN TOGGLE */}
          <details className="border px-3 py-2 rounded-md cursor-pointer">
            <summary>Columns</summary>
            <div className="mt-2 flex flex-col gap-1">
              {table.getAllLeafColumns().map(col => (
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

        {/* TABLE */}
        <div className="w-full overflow-auto border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className="p-3 border-b border-gray-300 font-semibold cursor-pointer"
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
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b hover:bg-blue-50 transition">
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
        {selected && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[480px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Nutrient Management Details</h2>

                  <span
                    className={`
                      text-xs px-2 py-1 rounded
                      ${
                        getStatus(selected) === "filled"
                          ? "bg-green-100 text-green-700"
                          : getStatus(selected) === "partial"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    `}
                  >
                    {getStatus(selected).replace("_", " ")}
                  </span>
                </div>

                <button
                  className="text-gray-500 hover:text-black"
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5">
                {Object.entries(selected).map(([key, val]) => (
                  <div key={key} className="border-b pb-2">
                    <div className="text-xs text-gray-500 uppercase">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm">{val || <span className="text-gray-400">—</span>}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
