

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

import { useMemo, useEffect, useState } from "react";
import { THEME } from "../utils/theme";

export type NutrientReading = {
  SPAD1?: string;
  SPAD2?: string;
  SPAD3?: string;
  SPAD4?: string;
  SPAD5?: string;
  Nitrogen1?: string;
  Nitrogen2?: string;
  Nitrogen3?: string;
  Nitrogen4?: string;
  Nitrogen5?: string;
  reading_date?: string;
  Reading1_location?: string;
  Reading2_location?: string;
  Reading3_location?: string;
  Reading4_location?: string;
  Reading5_location?: string;
  [k: string]: any;
};

export type NutrientRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;

  nutrient_data: string; // JSON string
  nutrient_count: number;
};

const schemaFields: (keyof NutrientRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "nutrient_count",
  "nutrient_data",
];

// helpers
function parseNutrientData(str?: string): NutrientReading[] {
  if (!str) return [];
  try {
    const arr = JSON.parse(str);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readingHasData(rd: NutrientReading) {
  const keys = [
    "SPAD1",
    "SPAD2",
    "SPAD3",
    "SPAD4",
    "SPAD5",
    "Nitrogen1",
    "Nitrogen2",
    "Nitrogen3",
    "Nitrogen4",
    "Nitrogen5",
    "Reading1_location",
    "Reading2_location",
    "Reading3_location",
    "Reading4_location",
    "Reading5_location",
  ];

  return keys.some((k) => {
    const v = rd[k];
    return v !== undefined && v !== null && String(v).trim() !== "";
  });
}

function getStatus(rec: NutrientRecord | null) {
  if (!rec) return "not_filled";
  const arr = parseNutrientData(rec.nutrient_data);
  if (arr.length === 0) return "not_filled";
  const flags = arr.map((r) => readingHasData(r));
  if (flags.every((f) => !f)) return "not_filled";
  if (flags.every((f) => f)) return "filled";
  return "partial";
}

function firstDate(rec: NutrientRecord | null) {
  if (!rec) return "";
  const arr = parseNutrientData(rec.nutrient_data);
  return arr[0]?.reading_date || "";
}
function lastDate(rec: NutrientRecord | null) {
  if (!rec) return "";
  const arr = parseNutrientData(rec.nutrient_data);
  return arr[arr.length - 1]?.reading_date || "";
}

function safeVal(obj: any, key: string) {
  if (!obj) return "—";
  const v = obj[key];
  if (v === undefined || v === null) return "—";
  if (typeof v === "string" && v.trim() === "") return "—";
  return v;
}

export default function NutrientMonitoringTable() {
  const [data, setData] = useState<NutrientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NutrientRecord | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "filled" | "partial" | "not_filled"
  >("all");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [blockFilter, setBlockFilter] = useState<string>("");
  const [villageFilter, setVillageFilter] = useState<string>("");
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<NutrientRecord>();

  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),

    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("nutrient_count", { header: "Count" }),

    columnHelper.display({
      id: "first_date",
      header: "First Reading",
      cell: ({ row }) => firstDate(row.original) || "—",
    }),

    columnHelper.display({
      id: "last_date",
      header: "Latest Reading",
      cell: ({ row }) => lastDate(row.original) || "—",
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className={THEME.buttons.primary}
          onClick={() => setSelected(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "/api/farm-management/plant-nutrients"
        );
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const uniqueDistricts = useMemo(
    () =>
      Array.from(new Set(data.map((r) => r.district_name).filter(Boolean))).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((r) => (districtFilter ? r.district_name === districtFilter : true))
          .map((r) => r.block_name)
      )
    )
      .filter(Boolean)
      .sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((r) => (districtFilter ? r.district_name === districtFilter : true))
          .filter((r) => (blockFilter ? r.block_name === blockFilter : true))
          .map((r) => r.village_name)
      )
    )
      .filter(Boolean)
      .sort();
  }, [data, districtFilter, blockFilter]);

  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();
    return data.filter((rec) => {
      if (statusFilter !== "all" && getStatus(rec) !== statusFilter) return false;
      if (districtFilter && rec.district_name !== districtFilter) return false;
      if (blockFilter && rec.block_name !== blockFilter) return false;
      if (villageFilter && rec.village_name !== villageFilter) return false;
      if (!g) return true;
      return JSON.stringify(rec).toLowerCase().includes(g);
    });
  }, [data, statusFilter, districtFilter, blockFilter, villageFilter, globalFilter]);

  const [sorting, setSorting] = useState<SortingState>([]);
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

  const table = useReactTable({
    data: finalData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      pagination,
    } as any,
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

  function exportCSV() {
    if (!table.getFilteredRowModel().rows.length) return;

    const visibleCols = table
      .getAllLeafColumns()
      .filter((c) => c.getIsVisible() && c.id !== "actions");

    const headers = visibleCols.map((c) =>
      typeof c.columnDef.header === "string" ? c.columnDef.header : String(c.id)
    );

    const rows = table.getFilteredRowModel().rows.map((r) =>
      visibleCols
        .map((col) => {
          const v = (r.original as any)[col.id];
          if (v === null || v === undefined) return "";
          const s = typeof v === "string" ? v : JSON.stringify(v);
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
const BOM = "\uFEFF"; // UTF-8 BOM
const blob = new Blob([BOM + csv], {
  type: "text/csv;charset=utf-8;",
});

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nutrient_monitoring.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  const filledCount = data.filter((d) => getStatus(d) === "filled").length;
  const partialCount = data.filter((d) => getStatus(d) === "partial").length;
  const notFilledCount = data.filter((d) => getStatus(d) === "not_filled").length;

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-6 w-full">
        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Export CSV
          </button>

          <div className="relative inline-block text-left">
            <button
              onClick={() => setShowColumnMenu((p) => !p)}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 p-3 max-h-72 overflow-y-auto">
                {schemaFields.concat([]).map((col) => (
                  <label key={String(col)} className="flex items-center gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={table.getColumn(String(col))?.getIsVisible() ?? false}
                      onChange={(e) =>
                        table.getColumn(String(col))?.toggleVisibility(e.target.checked)
                      }
                    />
                    {String(col).replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10"
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10"
              value={blockFilter}
              disabled={!districtFilter}
              onChange={(e) => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded px-3 h-10"
              value={villageFilter}
              disabled={!blockFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-3 h-10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Records</option>
            <option value="filled">Filled</option>
            <option value="partial">Partial</option>
            <option value="not_filled">Not Filled</option>
          </select>

          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
            Filled: {filledCount}
          </span>

          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            Partial: {partialCount}
          </span>

          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
            Not Filled: {notFilledCount}
          </span>

          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length} records
          </span>
        </div>
      </div>

      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={THEME.table.theadText}
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
                className={`${i % 2 === 0 ? THEME.table.rowEven : THEME.table.rowOdd} ${THEME.table.rowHover}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={THEME.table.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 items-center mt-4">
        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span className="text-sm">Page {pagination.pageIndex + 1} / {table.getPageCount()}</span>

        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[700px] max-h-[90vh] rounded-xl shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Nutrient Monitoring Details</h2>
              <button className="text-2xl" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="space-y-4">
              {["farmer_name", "farmer_mobile", "village_name", "block_name", "district_name"].map((k) => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs uppercase text-gray-600">{k.replace(/_/g, " ")}</div>
                  <div className="text-sm">{safeVal(selected, k)}</div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="text-xs text-gray-600 uppercase">Nutrient Count</div>
                  <div className="text-sm">{selected?.nutrient_count ?? "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 uppercase">Status</div>
                  <div className="text-sm">{getStatus(selected)}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 uppercase">First Reading</div>
                  <div className="text-sm">{firstDate(selected) || "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 uppercase">Latest Reading</div>
                  <div className="text-sm">{lastDate(selected) || "—"}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Nutrient Readings</h3>
                <div className="overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Reading Date</th>
                        <th className="p-2 border">SPAD</th>
                        <th className="p-2 border">Nitrogen</th>
                        <th className="p-2 border">Filled?</th>
                      </tr>
                    </thead>

                    <tbody>
                      {parseNutrientData(selected?.nutrient_data).map((rd, idx) => {
                        const filled = readingHasData(rd);

                        const spad = [rd.SPAD1, rd.SPAD2, rd.SPAD3, rd.SPAD4, rd.SPAD5].filter(
                          (v) => v && String(v).trim() !== ""
                        );
                        const nitro = [
                          rd.Nitrogen1,
                          rd.Nitrogen2,
                          rd.Nitrogen3,
                          rd.Nitrogen4,
                          rd.Nitrogen5,
                        ].filter((v) => v && String(v).trim() !== "");

                        // We still parse locs in case any other logic uses it elsewhere,
                        // but we do NOT render the Locations column in the modal.
                        const rawLocs = [
                          rd.Reading1_location,
                          rd.Reading2_location,
                          rd.Reading3_location,
                          rd.Reading4_location,
                          rd.Reading5_location,
                        ].filter((v) => v && String(v).trim() !== "");

                        const locs: string[] = [];
                        rawLocs.forEach((l) => {
                          if (!l) return;
                          if (/[\u0900-\u097F]/.test(l)) {
                            locs.push(l.trim());
                          } else {
                            l.split(/\s*Timestamp\s*[:-]?\s*/i)
                              .flatMap((p) => p.split(/\r?\n/))
                              .forEach((part) => {
                                const c = part.trim();
                                if (c) locs.push(c);
                              });
                          }
                        });

                        return (
                          <tr key={idx} className={`${idx % 2 ? "bg-gray-50" : "bg-white"} ${!filled ? "opacity-50" : ""}`}>
                            <td className="p-2 border">{rd.reading_date || "—"}</td>

                            <td className="p-2 border align-top">
                              {spad.length ? <div className="flex flex-col">{spad.map((s, i) => <div key={i}>{s}</div>)}</div> : "—"}
                            </td>

                            <td className="p-2 border align-top">
                              {nitro.length ? <div className="flex flex-col">{nitro.map((n, i) => <div key={i}>{n}</div>)}</div> : "—"}
                            </td>

                            <td className="p-2 border">
                              <span className={`px-2 py-1 text-xs rounded ${filled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {filled ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
