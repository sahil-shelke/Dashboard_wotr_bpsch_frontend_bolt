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
export type SprayItem = {
  date?: string;
  name?: string;
  unit?: string;
  quantity?: string | number;
};

export type PestManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;

  first_pest_date: string;

  light_trap: string; // Yes/No/empty
  light_trap_count: string;
  light_trap_date: string;

  pheromone_trap: string;
  pheromone_trap_count: string;
  pheromone_trap_date: string;

  sticky_trap: string;
  sticky_trap_count: string;
  sticky_trap_date: string;

  biopesticide_spray: string; // JSON string array
  fungicide_spray: string; // JSON string array
  insecticide_spray: string; // JSON string array
};

// --------------------------------------------------
// SAFE HELPERS
// --------------------------------------------------
function getVal(record: PestManagementRecord | null, key: string) {
  if (!record) return "—";
  return (record as Record<string, any>)[key] ?? "—";
}

function parseSprayData(jsonStr: string | undefined): SprayItem[] {
  if (!jsonStr || typeof jsonStr !== "string") return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it: any) => ({
      date: it?.date ?? "",
      name: it?.name ?? "",
      unit: it?.unit ?? "",
      quantity: it?.quantity ?? "",
    }));
  } catch {
    return [];
  }
}

// --------------------------------------------------
// STATUS LOGIC (all date fields including spray item.dates)
// --------------------------------------------------
function getStatus(record: PestManagementRecord | null) {
  if (!record) return "not_filled";

  const dateFields: string[] = [
    record.first_pest_date,
    record.light_trap_date,
    record.pheromone_trap_date,
    record.sticky_trap_date,
  ];

  const bio = parseSprayData(record.biopesticide_spray);
  const fung = parseSprayData(record.fungicide_spray);
  const ins = parseSprayData(record.insecticide_spray);

  const sprayDates = [
    ...bio.map(i => i.date ?? ""),
    ...fung.map(i => i.date ?? ""),
    ...ins.map(i => i.date ?? ""),
  ];

  const allDates = [...dateFields, ...sprayDates];

  const total = allDates.length;
  const filledCount = allDates.filter(d => d && String(d).trim() !== "").length;

  if (total === 0 || filledCount === 0) return "not_filled";
  if (filledCount === total) return "filled";
  return "partial";
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
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function PestManagementTable() {
  const [data, setData] = useState<PestManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PestManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");

  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [blockFilter, setBlockFilter] = useState<string>("");
  const [villageFilter, setVillageFilter] = useState<string>("");

  const columnHelper = createColumnHelper<PestManagementRecord>();

  // --------------------------------------------------
  // COLUMNS
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
    columnHelper.accessor("first_pest_date", { header: "First Pest Date" }),
    columnHelper.accessor("light_trap", { header: "Light Trap" }),
    columnHelper.accessor("pheromone_trap", { header: "Pheromone Trap" }),
    columnHelper.accessor("sticky_trap_date", { header: "Sticky Trap Date" }),

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
        const res = await fetch("http://localhost:5000/api/farm-management/pest-management");
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

    // hide counts / extra by default
    light_trap_count: false,
    pheromone_trap_count: false,
    sticky_trap_count: false,

    biopesticide_spray: false,
    fungicide_spray: false,
    insecticide_spray: false,

    // visible essentials
    surveyor_id: true,
    farmer_mobile: true,
    first_pest_date: true,
    light_trap: true,
    pheromone_trap: true,
    sticky_trap_date: true,
    actions: true,
  });

  // --------------------------------------------------
  // UNIQUE VALUES (dependent filters)
  // --------------------------------------------------
  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name).filter(Boolean))).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    if (!districtFilter) return Array.from(new Set(data.map(r => r.block_name).filter(Boolean))).sort();
    return Array.from(new Set(data.filter(r => r.district_name === districtFilter).map(r => r.block_name).filter(Boolean))).sort();
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

      // build searchable string from important fields
      const searchableFields = [
        r.farmer_name,
        r.farmer_mobile,
        r.crop_name_en,
        r.surveyor_name,
        r.surveyor_id,
        r.village_name,
        r.block_name,
        r.district_name,
        r.first_pest_date,
        r.light_trap,
        r.pheromone_trap,
        r.sticky_trap_date,
      ]
        .filter(Boolean)
        .map(s => String(s).toLowerCase())
        .join(" ");

      // include spray JSON text as well (so name/qty/date in serialized form can be matched)
      const spraysCombined = [r.biopesticide_spray, r.fungicide_spray, r.insecticide_spray].filter(Boolean).join(" ").toLowerCase();

      return searchableFields.includes(g) || spraysCombined.includes(g);
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

  if (loading) return <div className="p-6">Loading...</div>;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">
        {/* CONTROLS */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <input
            placeholder="Search..."
            className="border px-3 py-2 rounded-md w-60"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />

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
                <option key={d} value={d}>
                  {d}
                </option>
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
                <option key={b} value={b}>
                  {b}
                </option>
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
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

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
                  <h2 className="text-lg font-semibold">Pest Management Details</h2>

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

                {/* Traps */}
                <Section title="Traps">
                  {[
                    "first_pest_date",
                    "light_trap",
                    "light_trap_count",
                    "light_trap_date",
                    "pheromone_trap",
                    "pheromone_trap_count",
                    "pheromone_trap_date",
                    "sticky_trap",
                    "sticky_trap_count",
                    "sticky_trap_date",
                  ].map(k => (
                    <Field key={k} name={k} value={getVal(selected, k)} />
                  ))}
                </Section>

                {/* Sprays: biopesticide */}
                <Section title="Biopesticide Spray">
                  {parseSprayData(getVal(selected as any, "biopesticide_spray") as string).length === 0 ? (
                    <div className="text-sm text-gray-500">No biopesticide sprays recorded</div>
                  ) : (
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">Date</th>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Qty</th>
                          <th className="border p-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseSprayData(getVal(selected as any, "biopesticide_spray") as string).map((it, i) => (
                          <tr key={i}>
                            <td className="border p-2">{it.date || "—"}</td>
                            <td className="border p-2">{it.name || "—"}</td>
                            <td className="border p-2">{it.quantity ?? "—"}</td>
                            <td className="border p-2">{it.unit || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Section>

                {/* Sprays: fungicide */}
                <Section title="Fungicide Spray">
                  {parseSprayData(getVal(selected as any, "fungicide_spray") as string).length === 0 ? (
                    <div className="text-sm text-gray-500">No fungicide sprays recorded</div>
                  ) : (
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">Date</th>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Qty</th>
                          <th className="border p-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseSprayData(getVal(selected as any, "fungicide_spray") as string).map((it, i) => (
                          <tr key={i}>
                            <td className="border p-2">{it.date || "—"}</td>
                            <td className="border p-2">{it.name || "—"}</td>
                            <td className="border p-2">{it.quantity ?? "—"}</td>
                            <td className="border p-2">{it.unit || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Section>

                {/* Sprays: insecticide */}
                <Section title="Insecticide Spray">
                  {parseSprayData(getVal(selected as any, "insecticide_spray") as string).length === 0 ? (
                    <div className="text-sm text-gray-500">No insecticide sprays recorded</div>
                  ) : (
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">Date</th>
                          <th className="border p-2">Name</th>
                          <th className="border p-2">Qty</th>
                          <th className="border p-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseSprayData(getVal(selected as any, "insecticide_spray") as string).map((it, i) => (
                          <tr key={i}>
                            <td className="border p-2">{it.date || "—"}</td>
                            <td className="border p-2">{it.name || "—"}</td>
                            <td className="border p-2">{it.quantity ?? "—"}</td>
                            <td className="border p-2">{it.unit || "—"}</td>
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
      </div>
    </div>
  );
}
