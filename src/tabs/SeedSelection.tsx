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
export type SeedSelectionRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;

  bio_fertilizer_1_name: string;
  bio_fertilizer_1_quantity: string;
  bio_fertilizer_1_unit: string;

  bio_fertilizer_2_name: string;
  bio_fertilizer_2_quantity: string;
  bio_fertilizer_2_unit: string;

  bio_fertilizer_3_name: string;
  bio_fertilizer_3_quantity: string;
  bio_fertilizer_3_unit: string;

  duration: string;

  insecticide_1_name: string;
  insecticide_1_quantity: string;
  insecticide_1_unit: string;

  insecticide_2_name: string;
  insecticide_2_quantity: string;
  insecticide_2_unit: string;

  insecticide_3_name: string;
  insecticide_3_quantity: string;
  insecticide_3_unit: string;

  seed_rate_kg_per_plot: string;
  sowing_date: string;
  sowing_method: string;
  spacing_cm_squared: string;
  variety_name: string;
  transplanting_date: string;
  nursery_sowing_date: string;
  plantation_date: string;
  bahar: string;
  water_stress_date: string;
};

// --------------------------------------------------
// COMPLETION LOGIC
// --------------------------------------------------
function getStatus(record: SeedSelectionRecord) {
  const fields = [
    record.variety_name,
    record.seed_rate_kg_per_plot,
    record.sowing_date,
    record.sowing_method,
    record.spacing_cm_squared,
  ];

  const filledCount = fields.filter(v => v && v.trim() !== "").length;

  if (filledCount === 0) return "not_filled";
  if (filledCount === fields.length) return "filled";
  return "partial";
}

// --------------------------------------------------
// SMALL COMPONENTS
// --------------------------------------------------
function Section({ title, children }: any) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs text-gray-500 uppercase tracking-wider">
        {name.replace(/_/g, " ")}
      </div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function SeedSelectionTable() {
  const [data, setData] = useState<SeedSelectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<SeedSelectionRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const columnHelper = createColumnHelper<SeedSelectionRecord>();

  // --------------------------------------------------
  // COLUMNS
  // --------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),

    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("variety_name", { header: "Variety" }),
    columnHelper.accessor("sowing_date", { header: "Sowing Date" }),
    columnHelper.accessor("sowing_method", { header: "Method" }),
    columnHelper.accessor("seed_rate_kg_per_plot", { header: "Seed Rate (kg)" }),

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
  // FETCH
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/seed_selection");
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
    surveyor_name: false,
    village_name: false,
    block_name: false,
    district_name: false,
  });

  // --------------------------------------------------
  // DEPENDENT FILTER UNIQUE VALUES
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
  // FINAL FILTER LOGIC (status + location + search)
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

      return JSON.stringify(record).toLowerCase().includes(g);
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

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">
        {/* TITLE */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2E3A3F] mb-2">Seed Selection Records</h1>
          <p className="text-[#2E3A3F]/70">Manage and monitor seed selection activities</p>
        </div>

        {/* FILTER BOX */}
        <div className="bg-white rounded-lg border border-[#6D4C41]/20 p-4 mb-4">
          <h3 className="text-sm font-semibold text-[#2E3A3F] mb-3 uppercase tracking-wide">
            Filters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">

            {/* SEARCH */}
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

            {/* COLUMN TOGGLE */}
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
            <thead className="bg-[#F5E9D4]/40 sticky top-0 z-10">
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
                <tr
                  key={row.id}
                  className="border-b border-[#6D4C41]/10 hover:bg-[#7CB342]/10 transition-colors"
                >
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
            <div className="bg-white w-[490px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Seed Selection Details</h2>

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

              <div className="space-y-6">

                {/* Farmer & Location */}
                <Section title="Farmer & Location">
                  {[
                    "farmer_name",
                    "farmer_mobile",
                    "village_name",
                    "block_name",
                    "district_name",
                  ].map(key => (
                    <Field
                      key={key}
                      name={key}
                      value={selectedRecord[key as keyof SeedSelectionRecord]}
                    />
                  ))}
                </Section>

                {/* Crop */}
                <Section title="Crop Details">
                  {[
                    "crop_name_en",
                    "variety_name",
                    "crop_registration_id",
                    "bahar",
                  ].map(key => (
                    <Field
                      key={key}
                      name={key}
                      value={selectedRecord[key as keyof SeedSelectionRecord]}
                    />
                  ))}
                </Section>

                {/* Sowing */}
                <Section title="Sowing Details">
                  {[
                    "sowing_date",
                    "sowing_method",
                    "seed_rate_kg_per_plot",
                    "spacing_cm_squared",
                    "transplanting_date",
                    "nursery_sowing_date",
                    "plantation_date",
                    "water_stress_date",
                  ].map(key => (
                    <Field
                      key={key}
                      name={key}
                      value={selectedRecord[key as keyof SeedSelectionRecord]}
                    />
                  ))}
                </Section>

                {/* Bio Fertilizers */}
                <Section title="Bio Fertilizers">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="border p-2 rounded-md space-y-1">
                      <div className="font-medium text-sm mb-1">Bio Fertilizer {n}</div>
                      {[
                        `bio_fertilizer_${n}_name`,
                        `bio_fertilizer_${n}_quantity`,
                        `bio_fertilizer_${n}_unit`,
                      ].map(key => (
                        <Field
                          key={key}
                          name={key}
                          value={(selectedRecord as any)[key]}
                        />
                      ))}
                    </div>
                  ))}
                </Section>

                {/* Insecticides */}
                <Section title="Insecticides">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="border p-2 rounded-md space-y-1">
                      <div className="font-medium text-sm mb-1">Insecticide {n}</div>
                      {[
                        `insecticide_${n}_name`,
                        `insecticide_${n}_quantity`,
                        `insecticide_${n}_unit`,
                      ].map(key => (
                        <Field
                          key={key}
                          name={key}
                          value={(selectedRecord as any)[key]}
                        />
                      ))}
                    </div>
                  ))}
                </Section>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
