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

  irrigation_data: string;
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

  const filled = fields.filter(f => f && f.trim() !== "").length;

  if (filled === 0) return "not_filled";
  if (filled === fields.length) return "filled";
  return "partial";
}

// --------------------------------------------------
// PARSE IRRIGATION JSON
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

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const columnHelper = createColumnHelper<IrrigationManagementRecord>();

  // --------------------------------------------------
  // COLUMNS
  // --------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("crop_registration_id", { header: "Reg ID" }),

    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("irrigation_method", { header: "Irrigation Method" }),
    columnHelper.accessor("irrigation_count", { header: "Count" }),
    columnHelper.accessor("plastic_mulching", { header: "Mulching" }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 text-sm rounded-lg bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90 font-medium"
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
        const res = await fetch("http://localhost:5000/api/farm-management/irrigation");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --------------------------------------------------
  // TABLE STATES  (MUST BE BEFORE useMemo)
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

    surveyor_id: true,
    farmer_mobile: true,
    irrigation_method: true,
    irrigation_count: true,
    plastic_mulching: true,
    actions: true,
  });

  // --------------------------------------------------
  // UNIQUE FILTER VALUES
  // --------------------------------------------------
  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name).filter(Boolean))).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(r => (districtFilter ? r.district_name === districtFilter : true))
          .map(r => r.block_name)
          .filter(Boolean)
      )
    ).sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(r => (districtFilter ? r.district_name === districtFilter : true))
          .filter(r => (blockFilter ? r.block_name === blockFilter : true))
          .map(r => r.village_name)
          .filter(Boolean)
      )
    ).sort();
  }, [data, districtFilter, blockFilter]);

  // --------------------------------------------------
  // FINAL FILTERED DATA (search + status + district + block + village)
  // --------------------------------------------------
  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(record => {
      if (completionFilter !== "all" && getStatus(record) !== completionFilter)
        return false;

      if (districtFilter && record.district_name !== districtFilter) return false;
      if (blockFilter && record.block_name !== blockFilter) return false;
      if (villageFilter && record.village_name !== villageFilter) return false;

      if (!g) return true;

      const combined = JSON.stringify(record).toLowerCase();
      return combined.includes(g);
    });
  }, [
    data,
    globalFilter,
    completionFilter,
    districtFilter,
    blockFilter,
    villageFilter,
  ]);

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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">
        {/* TITLE */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2E3A3F] mb-2">
            Irrigation Management Records
          </h1>
          <p className="text-[#2E3A3F]/70">
            Manage and monitor irrigation activities
          </p>
        </div>

        {/* FILTER BOX */}
        <div className="bg-white rounded-lg border border-[#6D4C41]/20 p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#2E3A3F] mb-3 uppercase tracking-wide">
            Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2E3A3F]">Search</label>
              <input
                placeholder="Search all fields..."
                className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>

            {/* DISTRICT */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2E3A3F]">District</label>
              <select
                className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
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

            {/* BLOCK */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2E3A3F]">Block</label>
              <select
                className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
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

            {/* VILLAGE */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2E3A3F]">Village</label>
              <select
                className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
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

            {/* STATUS */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2E3A3F]">Status</label>
              <select
                className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
                value={completionFilter}
                onChange={e => setCompletionFilter(e.target.value as any)}
              >
                <option value="all">All Records</option>
                <option value="filled">Fully Filled</option>
                <option value="partial">Partially Filled</option>
                <option value="not_filled">Not Filled</option>
              </select>
            </div>

            {/* COLUMN TOGGLER */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#2E3A3F]">Columns</label>
              <details className="h-10 border border-[#6D4C41]/20 rounded-md px-3 py-2 cursor-pointer bg-white">
                <summary className="text-sm text-[#2E3A3F]">Toggle Columns</summary>
                <div className="mt-2 flex flex-col gap-1 absolute bg-white border border-[#6D4C41]/20 rounded-md p-3 shadow-lg z-10">
                  {table.getAllLeafColumns().map(col => (
                    <label key={col.id} className="flex gap-2 text-sm">
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
          </div>

          {/* STATUS BADGES */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-medium">
              Filled: {data.filter(r => getStatus(r) === "filled").length}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 font-medium">
              Partial: {data.filter(r => getStatus(r) === "partial").length}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 font-medium">
              Not Filled: {data.filter(r => getStatus(r) === "not_filled").length}
            </span>
            <span className="text-[#2E3A3F]/70 text-sm font-medium ml-auto">
              Showing {table.getFilteredRowModel().rows.length} of {data.length} records
            </span>
          </div>
        </div>

        {/* TABLE */}
        <div className="w-full overflow-auto border border-[#6D4C41]/20 rounded-lg bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[#F5E9D4]/40 sticky top-0 z-10 text-left">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className="p-3 font-semibold border-b border-[#6D4C41]/20 cursor-pointer text-[#2E3A3F]"
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
                <tr key={row.id} className="border-b border-[#6D4C41]/10 hover:bg-[#7CB342]/10 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-3 text-[#2E3A3F]">
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
            className="border border-[#6D4C41]/20 px-4 py-2 rounded-lg disabled:opacity-50 bg-white hover:bg-[#7CB342]/10 text-[#2E3A3F] font-medium"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>

          <span className="text-[#2E3A3F] font-medium">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>

          <button
            className="border border-[#6D4C41]/20 px-4 py-2 rounded-lg disabled:opacity-50 bg-white hover:bg-[#7CB342]/10 text-[#2E3A3F] font-medium"
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
                  <h2 className="text-lg font-semibold text-[#2E3A3F]">
                    Irrigation Management Details
                  </h2>

                  {/* STATUS BADGE */}
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      getStatus(selectedRecord) === "filled"
                        ? "bg-green-100 text-green-800"
                        : getStatus(selectedRecord) === "partial"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getStatus(selectedRecord).replace("_", " ")}
                  </span>
                </div>

                <button
                  className="text-[#2E3A3F]/70 hover:text-[#2E3A3F]"
                  onClick={() => setSelectedRecord(null)}
                >
                  ✕
                </button>
              </div>

              {/* DETAILS */}
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

                {/* IRRIGATION DATA TABLE */}
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

      </div>
    </div>
  );
}
