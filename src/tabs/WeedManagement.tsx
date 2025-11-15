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
export type WeedManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;

  hoeing_date_1: string;
  hoeing_date_2: string;
  hand_weeding_date_1: string;
  hand_weeding_date_2: string;

  post_herbicide_date_1: string;
  post_herbicide_name_1: string;
  post_herbicide_quantity_1: string;
  post_herbicide_unit_1: string;

  post_herbicide_date_2: string;
  post_herbicide_name_2: string;
  post_herbicide_quantity_2: string;
  post_herbicide_unit_2: string;

  post_herbicide_date_3: string;
  post_herbicide_name_3: string;
  post_herbicide_quantity_3: string;
  post_herbicide_unit_3: string;

  per_herbicide_date: string;
  per_herbicide_name: string;
  per_herbicide_quantity: string;
  per_herbicide_unit: string;
};

// --------------------------------------------------
// COMPLETION LOGIC
// --------------------------------------------------
function getStatus(record: WeedManagementRecord) {
  const fields = [
    record.hoeing_date_1,
    record.hand_weeding_date_1,
    record.post_herbicide_date_1,
    record.post_herbicide_name_1,
    record.per_herbicide_date,
  ];

  const filled = fields.filter(v => v && v.trim() !== "").length;

  if (filled === 0) return "not_filled";
  if (filled === fields.length) return "filled";
  return "partial";
}

// --------------------------------------------------
// SAFE FIELD GETTER (No TS errors)
// --------------------------------------------------
function getVal(record: WeedManagementRecord, key: string) {
  return (record as Record<string, any>)[key] ?? "—";
}

// --------------------------------------------------
// SMALL MODAL COMPONENTS
// --------------------------------------------------
function Section({ title, children }: any) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ name, value }: { name: string; value: any }) {
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
export default function WeedManagementTable() {
  const [data, setData] = useState<WeedManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<WeedManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");

  const columnHelper = createColumnHelper<WeedManagementRecord>();

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

    // visible in main table
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("hoeing_date_1", { header: "Hoeing Date 1" }),
    columnHelper.accessor("hand_weeding_date_1", { header: "Hand Weeding 1" }),
    columnHelper.accessor("post_herbicide_date_1", { header: "Post Herbicide 1" }),
    columnHelper.accessor("per_herbicide_date", { header: "Pre Herbicide" }),

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
  // FETCH
  // --------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/weed-management");
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

  // Default visibility — only main columns visible
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: false,
    crop_name_en: false,
    surveyor_name: false,
    village_name: false,
    block_name: false,
    district_name: false,
    crop_registration_id: false,

    hoeing_date_2: false,
    hand_weeding_date_2: false,

    post_herbicide_date_2: false,
    post_herbicide_name_2: false,
    post_herbicide_quantity_2: false,
    post_herbicide_unit_2: false,

    post_herbicide_date_3: false,
    post_herbicide_name_3: false,
    post_herbicide_quantity_3: false,
    post_herbicide_unit_3: false,

    per_herbicide_name: false,
    per_herbicide_quantity: false,
    per_herbicide_unit: false,

    surveyor_id: true,
    farmer_mobile: true,
    hoeing_date_1: true,
    hand_weeding_date_1: true,
    post_herbicide_date_1: true,
    per_herbicide_date: true,
    actions: true,
  });

  // --------------------------------------------------
  // FILTER BY STATUS
  // --------------------------------------------------
  const filteredByStatus = useMemo(() => {
    return data.filter(r =>
      completionFilter === "all" ? true : getStatus(r) === completionFilter
    );
  }, [data, completionFilter]);

  const table = useReactTable({
    data: filteredByStatus,
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

  return (
    <>
      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">

        <input
          placeholder="Search..."
          className="border px-3 py-2 rounded-md w-60"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />

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

        <span className="text-gray-700 text-sm font-medium">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </span>

        {/* Column Toggle */}
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
                    className="p-3 font-semibold border-b border-gray-300 cursor-pointer"
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
              <tr key={row.id} className="border-b hover:bg-blue-50 transition-colors">
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
          <div className="bg-white w-[490px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Weed Management Details</h2>

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
                  <Field key={key} name={key} value={getVal(selectedRecord, key)} />
                ))}
              </Section>

              {/* Crop */}
             {/* Crop */}
<Section title="Crop Details">
  {["crop_name_en"].map(key => (
    <Field key={key} name={key} value={getVal(selectedRecord, key)} />
  ))}
</Section>


              {/* Hoeing & Hand Weeding */}
              <Section title="Hoeing & Hand Weeding">
                {[
                  "hoeing_date_1",
                  "hoeing_date_2",
                  "hand_weeding_date_1",
                  "hand_weeding_date_2",
                ].map(key => (
                  <Field key={key} name={key} value={getVal(selectedRecord, key)} />
                ))}
              </Section>

              {/* Post Herbicides */}
              <Section title="Post Herbicides">
                {[1, 2, 3].map(n => {
                  const fields = [
                    `post_herbicide_date_${n}`,
                    `post_herbicide_name_${n}`,
                    `post_herbicide_quantity_${n}`,
                    `post_herbicide_unit_${n}`,
                  ];
                  return (
                    <div key={n} className="border p-2 rounded-md space-y-1">
                      <div className="font-medium text-sm mb-1">Post Herbicide {n}</div>
                      {fields.map(key => (
                        <Field key={key} name={key} value={getVal(selectedRecord, key)} />
                      ))}
                    </div>
                  );
                })}
              </Section>

              {/* Pre Herbicide */}
              <Section title="Pre Herbicide">
                {[
                  "per_herbicide_date",
                  "per_herbicide_name",
                  "per_herbicide_quantity",
                  "per_herbicide_unit",
                ].map(key => (
                  <Field key={key} name={key} value={getVal(selectedRecord, key)} />
                ))}
              </Section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
