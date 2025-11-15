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
export type HarvestItem = {
  date?: string;
  count?: number;
  production_kg_per_plot?: string | number;
};

export type HarvestingManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;

  harvesting_details: string; // JSON string array
  harvesting_count: number;
  first_harvest: boolean;
};

// --------------------------------------------------
// SAFE HELPERS
// --------------------------------------------------
function getVal(record: HarvestingManagementRecord | null, key: string) {
  if (!record) return "—";
  const v = (record as Record<string, any>)[key];
  if (v === null || v === undefined || v === "") return "—";
  return v;
}

function parseHarvestData(jsonStr: string | undefined): HarvestItem[] {
  if (!jsonStr || typeof jsonStr !== "string") return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it: any) => ({
      date: it?.date ?? "",
      count: it?.count ?? undefined,
      production_kg_per_plot: it?.production_kg_per_plot ?? "",
    }));
  } catch {
    return [];
  }
}

// --------------------------------------------------
// STATUS LOGIC (Option B)
// --------------------------------------------------
function getStatus(record: HarvestingManagementRecord) {
  if (!record) return "not_filled";

  const items = parseHarvestData(record.harvesting_details);
  const dateEntries = items.map(i => (i.date ?? "").toString().trim()).filter(d => d !== "");
  const totalDates = dateEntries.length;
  const count = Number(record.harvesting_count || 0);

  if (count === 0 && totalDates === 0) return "not_filled";
  if (count > 0 && totalDates === count) return "filled";

  if (totalDates > 0 || count > 0) return "partial";
  return "not_filled";
}

// --------------------------------------------------
// SMALL UI HELPERS
// --------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
      <div className="text-xs text-gray-500 uppercase tracking-wider">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function HarvestingManagementTable() {
  const [data, setData] = useState<HarvestingManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HarvestingManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");

  const columnHelper = createColumnHelper<HarvestingManagementRecord>();

  // --------------------------------------------------
  // COLUMNS (first_harvest removed)
  // --------------------------------------------------
  const columns = [
    // hidden/searchable
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("crop_registration_id", { header: "Reg ID" }),

    // visible essentials
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("harvesting_count", { header: "Harvest Count" }),

    // view
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
        const res = await fetch("http://localhost:5000/api/farm-management/harvesting-management");
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
    crop_registration_id: false,
    harvesting_details: false,

    surveyor_id: true,
    farmer_mobile: true,
    harvesting_count: true,
    actions: true,
  });

  // --------------------------------------------------
  // APPLY STATUS FILTER
  // --------------------------------------------------
  const filteredByStatus = useMemo(() => {
    return data.filter(r => (completionFilter === "all" ? true : getStatus(r) === completionFilter));
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
  // RENDER
  // --------------------------------------------------
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

        {/* Columns toggle */}
        <details className="border px-3 py-2 rounded-md cursor-pointer">
          <summary>Columns</summary>
          <div className="mt-2 flex flex-col gap-1">
            {table.getAllLeafColumns().map(column => (
              <label key={column.id} className="flex gap-2">
                <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
                {column.id}
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
        <button className="border px-3 py-1 rounded disabled:opacity-50" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Prev
        </button>

        <span>
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button className="border px-3 py-1 rounded disabled:opacity-50" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[520px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Harvesting Management Details</h2>

                {/* Status badge */}
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    getStatus(selected) === "filled"
                      ? "bg-green-100 text-green-700"
                      : getStatus(selected) === "partial"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {getStatus(selected).replace("_", " ")}
                </span>
              </div>

              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="space-y-4">
              {/* Farmer & Location */}
              <Section title="Farmer & Location">
                {["farmer_name", "farmer_mobile", "village_name", "block_name", "district_name"].map(k => (
                  <Field key={k} name={k} value={getVal(selected, k)} />
                ))}
              </Section>

              {/* Crop */}
              <Section title="Crop Details">
                {["crop_name_en"].map(k => (
                  <Field key={k} name={k} value={getVal(selected, k)} />
                ))}
              </Section>

              {/* Harvest summary */}
              <Section title="Harvest Summary">
                <Field name="harvesting_count" value={getVal(selected, "harvesting_count")} />
                <Field name="first_harvest" value={getVal(selected, "first_harvest") ? "Yes" : "No"} />
              </Section>

              {/* Harvesting details table */}
              <Section title="Harvesting Details">
                {parseHarvestData(getVal(selected, "harvesting_details") as string).length === 0 ? (
                  <div className="text-sm text-gray-500">No harvesting records</div>
                ) : (
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Count</th>
                        <th className="border p-2">Production (kg/plot)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseHarvestData(getVal(selected, "harvesting_details") as string).map((it, i) => (
                        <tr key={i}>
                          <td className="border p-2">{it.date || "—"}</td>
                          <td className="border p-2">{it.count ?? "—"}</td>
                          <td className="border p-2">{it.production_kg_per_plot ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
