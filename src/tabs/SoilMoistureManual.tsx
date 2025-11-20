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
import { THEME } from "../utils/theme";

export type SoilItem = {
  date?: string;
  sensor1Dry?: string | number;
  sensor1Wet?: string | number;
  sensor2Dry?: string | number;
  sensor2Wet?: string | number;
};

export type SoilManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  soil_data: string;
  soil_moisture_count: number;
};

const schemaFields: (keyof SoilManagementRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "soil_moisture_count",
  "soil_data",
];

function maskValue(v: string): string {
  if (!v) return "—";
  if (v.length <= 6) return "XXXXXX";
  return "XXXXXX" + v.slice(6);
}

function safeVal(rec: SoilManagementRecord | null, key: keyof SoilManagementRecord) {
  if (!rec) return "—";
  const v = rec[key];
  if (v === "" || v === null || v === undefined) return "—";

  if (key === "farmer_mobile" || key === "surveyor_id") {
    return maskValue(String(v));
  }

  return v;
}

function parseSoilData(jsonStr: string | undefined): SoilItem[] {
  if (!jsonStr || typeof jsonStr !== "string") return [];
  try {
    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return [];
    return arr.map((it: any) => ({
      date: it?.date ?? "",
      sensor1Dry: it?.sensor1Dry ?? "",
      sensor1Wet: it?.sensor1Wet ?? "",
      sensor2Dry: it?.sensor2Dry ?? "",
      sensor2Wet: it?.sensor2Wet ?? "",
    }));
  } catch {
    return [];
  }
}

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

export default function SoilManagementTable() {
  const [data, setData] = useState<SoilManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SoilManagementRecord | null>(null);

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<SoilManagementRecord>();

  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("farmer_mobile", {
      header: "Mobile",
      cell: ({ row }) => maskValue(row.original.farmer_mobile),
    }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("soil_moisture_count", { header: "Records Count" }),

    columnHelper.accessor("surveyor_name", { header: "Surveyor" }),
    columnHelper.accessor("surveyor_id", {
      header: "Surveyor ID",
      cell: ({ row }) => maskValue(row.original.surveyor_id),
    }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("soil_data", { header: "Soil Data" }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button className={THEME.buttons.primary} onClick={() => setSelected(row.original)}>
          View
        </button>
      ),
    }),
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/soil-moisture-manual");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const s: VisibilityState = {};
    schemaFields.forEach(f => (s[f] = false));
    s["farmer_name"] = true;
    s["farmer_mobile"] = true;
    s["crop_name_en"] = true;
    s["soil_moisture_count"] = true;
    s["actions"] = true;
    return s;
  });

  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name))).filter(Boolean).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return Array.from(
      new Set(
        data.filter(r => (districtFilter ? r.district_name === districtFilter : true)).map(r => r.block_name)
      )
    )
      .filter(Boolean)
      .sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(r => (districtFilter ? r.district_name === districtFilter : true))
          .filter(r => (blockFilter ? r.block_name === blockFilter : true))
          .map(r => r.village_name)
      )
    )
      .filter(Boolean)
      .sort();
  }, [data, districtFilter, blockFilter]);

  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(rec => {
      if (districtFilter && rec.district_name !== districtFilter) return false;
      if (blockFilter && rec.block_name !== blockFilter) return false;
      if (villageFilter && rec.village_name !== villageFilter) return false;

      if (!g) return true;
      return JSON.stringify(rec).toLowerCase().includes(g);
    });
  }, [data, districtFilter, blockFilter, villageFilter, globalFilter]);

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

  function exportCSV() {
    if (!finalData.length) return;

    const headers = schemaFields;

    const rows = finalData.map(row =>
      headers.map(h => {
        let v = row[h];

        if (h === "farmer_mobile" || h === "surveyor_id") {
          v = maskValue(String(v || ""));
        }

        if (v === null || v === undefined) return "";
        const s = typeof v === "string" ? v : JSON.stringify(v);

        if (s.includes(",") || s.includes('"') || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      })
    );

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "soil_moisture_manual.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-4">Loading...</div>;

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
              onClick={() => setShowColumnMenu(prev => !prev)}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 p-3 max-h-72 overflow-y-auto">
                {schemaFields.concat(["actions" as any]).map(col => (
                  <label key={String(col)} className="flex items-center gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={table.getColumn(String(col))?.getIsVisible() ?? false}
                      onChange={e => table.getColumn(String(col))?.toggleVisibility(e.target.checked)}
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
              placeholder="Search all fields..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

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
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end text-sm text-gray-700 mt-4">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </div>
      </div>

      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
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
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className={THEME.table.cell}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 items-center mt-4">
        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Prev
        </button>

        <span className="text-sm font-medium">
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

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[520px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Soil Moisture Calibration</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <Section title="Farmer & Location">
                {["farmer_name", "farmer_mobile", "village_name", "block_name", "district_name"].map(k => (
                  <Field key={k} name={k} value={safeVal(selected, k as any)} />
                ))}
              </Section>

              <Section title="Crop Details">
                <Field name="crop_name_en" value={safeVal(selected, "crop_name_en")} />
              </Section>

              <Section title="Summary">
                <Field name="soil_moisture_count" value={safeVal(selected, "soil_moisture_count")} />
              </Section>

              <Section title="Sensor Calibration Records">
                {parseSoilData(selected?.soil_data || "").length === 0 ? (
                  <div className="text-sm text-gray-500">No soil calibration data</div>
                ) : (
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Date</th>
                        <th className="border p-2">S1 Dry</th>
                        <th className="border p-2">S1 Wet</th>
                        <th className="border p-2">S2 Dry</th>
                        <th className="border p-2">S2 Wet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseSoilData(selected?.soil_data || "").map((item, i) => (
                        <tr key={i}>
                          <td className="border p-2">{item.date || "—"}</td>
                          <td className="border p-2">{item.sensor1Dry ?? "—"}</td>
                          <td className="border p-2">{item.sensor1Wet ?? "—"}</td>
                          <td className="border p-2">{item.sensor2Dry ?? "—"}</td>
                          <td className="border p-2">{item.sensor2Wet ?? "—"}</td>
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
  );
}
