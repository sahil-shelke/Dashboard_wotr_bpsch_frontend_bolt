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

export type LandPreparationRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  fym_date: string;
  fym_quantity: string;
  ploughing_date: string;
  harrow_date: string;
};

const schemaFields: (keyof LandPreparationRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "fym_date",
  "fym_quantity",
  "ploughing_date",
  "harrow_date",
];

// -----------------------------
// STATUS
// -----------------------------
function getStatus(record: LandPreparationRecord) {
  const fields = [
    record.fym_date,
    record.fym_quantity,
    record.ploughing_date,
    record.harrow_date,
  ];
  const filledCount = fields.filter(v => v && v.trim() !== "").length;

  if (filledCount === 0) return "not_filled";
  if (filledCount === fields.length) return "filled";
  return "partial";
}

export default function LandPreparationTable() {
  const [data, setData] = useState<LandPreparationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LandPreparationRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<"all" | "filled" | "partial" | "not_filled">("all");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const columnHelper = createColumnHelper<LandPreparationRecord>();

  // -----------------------------
  // COLUMNS
  // -----------------------------
  const columns = [
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Farmer Mobile" }),
    columnHelper.accessor("fym_date", { header: "FYM Date" }),
    columnHelper.accessor("fym_quantity", { header: "FYM Qty" }),
    columnHelper.accessor("ploughing_date", { header: "Ploughing Date" }),
    columnHelper.accessor("harrow_date", { header: "Harrow Date" }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800"
          onClick={() => setSelectedRecord(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  // -----------------------------
  // FETCH DATA
  // -----------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/land_preparations");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // -----------------------------
  // TABLE STATE
  // -----------------------------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: false,
    crop_name_en: false,
    surveyor_name: false,
    village_name: false,
    block_name: false,
    district_name: false,
  });

  // -----------------------------
  // DEPENDENT DROPDOWNS
  // -----------------------------
  const uniqueDistricts = [...new Set(data.map(r => r.district_name))].filter(Boolean).sort();

  const uniqueBlocks = [...new Set(
    data
      .filter(r => (districtFilter ? r.district_name === districtFilter : true))
      .map(r => r.block_name)
  )].filter(Boolean).sort();

  const uniqueVillages = [...new Set(
    data
      .filter(r => (districtFilter ? r.district_name === districtFilter : true))
      .filter(r => (blockFilter ? r.block_name === blockFilter : true))
      .map(r => r.village_name)
  )].filter(Boolean).sort();

  // -----------------------------
  // FINAL FILTERING
  // -----------------------------
  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(record => {
      if (completionFilter !== "all" && getStatus(record) !== completionFilter) return false;
      if (districtFilter && record.district_name !== districtFilter) return false;
      if (blockFilter && record.block_name !== blockFilter) return false;
      if (villageFilter && record.village_name !== villageFilter) return false;
      if (g && !JSON.stringify(record).toLowerCase().includes(g)) return false;

      return true;
    });
  }, [data, completionFilter, districtFilter, blockFilter, villageFilter, globalFilter]);

  // -----------------------------
  // TABLE INIT
  // -----------------------------
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
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div className="p-6">Loading...</div>;

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5F3E7]">

      <div className="w-full p-4">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2E3A3F]">Land Preparation Records</h1>
          <p className="text-[#2E3A3F]/70">Manage and monitor land preparation activities</p>
        </div>

        {/* FILTER PANEL */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-6 w-full">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* SEARCH */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Search</label>
              <input
                className="border rounded px-3 h-10"
                placeholder="Search all fields..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>

            {/* DISTRICT */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">District</label>
              <select
                className="border rounded px-3 h-10"
                value={districtFilter}
                onChange={e => {
                  setDistrictFilter(e.target.value);
                  setBlockFilter("");
                  setVillageFilter("");
                }}
              >
                <option value="">All Districts</option>
                {uniqueDistricts.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* BLOCK */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Block</label>
              <select
                className="border rounded px-3 h-10"
                value={blockFilter}
                disabled={!districtFilter}
                onChange={e => {
                  setBlockFilter(e.target.value);
                  setVillageFilter("");
                }}
              >
                <option value="">All Blocks</option>
                {uniqueBlocks.map(b => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* VILLAGE */}
            <div className="flex flex-col">
              <label className="text-sm font-medium">Village</label>
              <select
                className="border rounded px-3 h-10"
                value={villageFilter}
                disabled={!blockFilter}
                onChange={e => setVillageFilter(e.target.value)}
              >
                <option value="">All Villages</option>
                {uniqueVillages.map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* STATUS + COUNT */}
          <div className="mt-4 flex flex-wrap gap-3">
            <select
              className="border rounded px-3 h-10"
              value={completionFilter}
              onChange={e => setCompletionFilter(e.target.value as any)}
            >
              <option value="all">All Records</option>
              <option value="filled">Filled</option>
              <option value="partial">Partial</option>
              <option value="not_filled">Not Filled</option>
            </select>

            <span className="px-3 py-1 rounded bg-green-100 text-green-700 text-sm">
              Filled: {data.filter(r => getStatus(r) === "filled").length}
            </span>
            <span className="px-3 py-1 rounded bg-yellow-100 text-yellow-700 text-sm">
              Partial: {data.filter(r => getStatus(r) === "partial").length}
            </span>
            <span className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm">
              Not Filled: {data.filter(r => getStatus(r) === "not_filled").length}
            </span>

            <span className="ml-auto text-sm text-gray-600">
              Showing {finalData.length} of {data.length} records
            </span>
          </div>

        </div>

        {/* TABLE */}
        <div className="w-full overflow-auto border rounded-lg bg-white shadow">

          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10 border-b">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className="p-3 font-semibold text-left cursor-pointer"
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
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {row.getVisibleCells().map(cell => (
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
            className="border px-3 py-2 rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>

          <span className="text-sm font-medium">
            Page {pagination.pageIndex + 1} / {table.getPageCount()}
          </span>

          <button
            className="border px-3 py-2 rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>

        {/* MODAL */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white w-[450px] max-h-[80vh] rounded-xl shadow-xl p-6 overflow-y-auto">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Land Preparation Details</h2>
                <button className="text-2xl" onClick={() => setSelectedRecord(null)}>×</button>
              </div>

              <div className="space-y-4">
                {schemaFields.map(key => (
                  <div key={key} className="border-b pb-2">
                    <div className="text-xs uppercase text-gray-600">{key.replace(/_/g, " ")}</div>
                    <div className="text-sm">{selectedRecord[key] || "—"}</div>
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
