"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useState, useEffect, useMemo } from "react";
import { THEME } from "../utils/theme";

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
  "irrigation_data",
  "irrigation_count",
];

function mask(value: string) {
  if (!value) return "—";
  const s = String(value);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

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

function parseIrrigationData(data: string) {
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

export default function IrrigationManagementTable() {
  const [data, setData] = useState<IrrigationManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] =
    useState<IrrigationManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] =
    useState<"all" | "filled" | "partial" | "not_filled">("all");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<IrrigationManagementRecord>();

  // ⭐ FIXED - Use individual accessor calls for each field
  const columns = useMemo(() => [
    columnHelper.accessor("farmer_name", {
      header: "Farmer Name",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("farmer_mobile", {
      header: "Farmer Mobile",
      cell: info => mask(String(info.getValue() ?? "")),
    }),
    columnHelper.accessor("crop_name_en", {
      header: "Crop Name En",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("surveyor_name", {
      header: "Surveyor Name",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("surveyor_id", {
      header: "Surveyor Id",
      cell: info => mask(String(info.getValue() ?? "")),
    }),
    columnHelper.accessor("village_name", {
      header: "Village Name",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("block_name", {
      header: "Block Name",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("district_name", {
      header: "District Name",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("crop_registration_id", {
      header: "Crop Registration Id",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("crop_residue_tonnes_per_plot", {
      header: "Crop Residue Tonnes Per Plot",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("crop_residue_mulching", {
      header: "Crop Residue Mulching",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("irrigation_method", {
      header: "Irrigation Method",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("plastic_mulching", {
      header: "Plastic Mulching",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("plastic_paper_micron", {
      header: "Plastic Paper Micron",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("plastic_mulching_date", {
      header: "Plastic Mulching Date",
      cell: info => info.getValue() || "—",
    }),
    columnHelper.accessor("irrigation_data", {
      header: "Irrigation Data",
      cell: () => "View",
    }),
    columnHelper.accessor("irrigation_count", {
      header: "Irrigation Count",
      cell: info => String(info.getValue() ?? "—"),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: info => {
        const record = info.row.original;
        return (
          <button
            className={THEME.buttons.primary}
            onClick={() => setSelectedRecord(record)}
          >
            View
          </button>
        );
      }
    })
  ], []);

  // ---------------- Fetch Data ----------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/irrigation");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const v: VisibilityState = {};
    schemaFields.forEach(f => (v[f] = false));

    [
      "farmer_name",
      "farmer_mobile",
      "crop_name_en",
      "irrigation_method",
      "irrigation_count",
    ].forEach(k => (v[k] = true));

    return v;
  });

  const uniqueDistricts = [...new Set(data.map(r => r.district_name).filter(Boolean))].sort();
  const uniqueBlocks = [...new Set(data.filter(r => !districtFilter || r.district_name === districtFilter).map(r => r.block_name).filter(Boolean))].sort();
  const uniqueVillages = [...new Set(data.filter(r => !districtFilter || r.district_name === districtFilter).filter(r => !blockFilter || r.block_name === blockFilter).map(r => r.village_name).filter(Boolean))].sort();

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
  }, [data, globalFilter, completionFilter, districtFilter, blockFilter, villageFilter]);

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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  // ---------------- CSV Export ----------------
  function exportCSV() {
    if (!finalData.length) return;

    const headers = schemaFields;

    const rows = finalData.map(row =>
      headers.map(h => {
        let v = row[h];
        if (h === "farmer_mobile" || h === "surveyor_id") v = mask(String(v));
        if (v == null) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
        return s;
      })
    );

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "irrigation_management.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">

      {/* Filters + CSV + Column menu UI is unchanged */}
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Export CSV
          </button>

          <div className="relative">
            <button
              className="px-4 py-2 rounded bg-gray-700 text-white"
              onClick={() => setShowColumnMenu(prev => !prev)}
            >
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-56 p-3 z-50 max-h-72 overflow-y-auto">
                {schemaFields.map(col => {
                  const column = table.getColumn(col);
                  return (
                    <label key={col} className="flex gap-2 text-sm mb-2">
                      <input
                        type="checkbox"
                        checked={column?.getIsVisible() ?? false}
                        onChange={e => column?.toggleVisibility(e.target.checked)}
                      />
                      {String(col).replace(/_/g, " ")}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search, filters, counters (unchanged) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded h-10 px-3"
              placeholder="Search..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded h-10 px-3"
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

          <div className="flex flex-col">
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded h-10 px-3"
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

          <div className="flex flex-col">
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded h-10 px-3"
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

        {/* Status count */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-3 h-10"
            value={completionFilter}
            onChange={e => setCompletionFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="filled">Filled</option>
            <option value="partial">Partial</option>
            <option value="not_filled">Not Filled</option>
          </select>

          <span className="px-4 py-1.5 rounded-full text-sm bg-green-100 text-green-700">
            Filled: {data.filter(r => getStatus(r) === "filled").length}
          </span>

          <span className="px-4 py-1.5 rounded-full text-sm bg-yellow-100 text-yellow-700">
            Partial: {data.filter(r => getStatus(r) === "partial").length}
          </span>

          <span className="px-4 py-1.5 rounded-full text-sm bg-red-100 text-red-700">
            Not Filled: {data.filter(r => getStatus(r) === "not_filled").length}
          </span>

          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length} records
          </span>
        </div>
      </div>

      {/* ---------------- Table ---------------- */}
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

      {/* ---------------- Pagination ---------------- */}
      <div className="flex gap-4 items-center mt-4">
        <button
          className="border border-gray-300 px-4 py-2 rounded-lg disabled:opacity-50 bg-white hover:bg-gray-100 text-gray-700"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span className="text-gray-700 font-medium">
          Page {pagination.pageIndex + 1} of {table.getPageCount()}
        </span>

        <button
          className="border border-gray-300 px-4 py-2 rounded-lg disabled:opacity-50 bg-white hover:bg-gray-100 text-gray-700"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {/* ---------------- Modal ---------------- */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[480px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Irrigation Management Details</h2>

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
                className="text-gray-500 hover:text-black text-lg"
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {schemaFields.map(key => {
                let value: any = selectedRecord[key];
                if (key === "farmer_mobile") value = mask(value);
                if (key === "surveyor_id") value = mask(value);

                return <Field key={key} name={key} value={value} />;
              })}

              <h3 className="text-sm font-semibold mt-4">Irrigation Data</h3>

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
      )}

    </div>
  );
}