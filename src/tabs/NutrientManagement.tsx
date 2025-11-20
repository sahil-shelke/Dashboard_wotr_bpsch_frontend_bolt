"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useState, useEffect, useMemo } from "react";
import { THEME } from "../utils/theme";

export type NutrientManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;

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

const schemaFields: (keyof NutrientManagementRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",

  "urea_basal_dt",
  "urea_basal_kg",
  "ssp_date",
  "ssp_kg",
  "mop_date",
  "mop_kg",
  "dap_date",
  "dap_kg",

  "urea_30_days_dt",
  "urea30das_kg",
  "urea45days_date",
  "urea45das_kg",

  "foliar1_date",
  "foliar1_name",
  "foliar1_quantity",
  "foliar1_unit",

  "foliar2_date",
  "foliar2_name",
  "foliar2_quantity",
  "foliar2_unit",

  "foliar3_date",
  "foliar3_name",
  "foliar3_quantity",
  "foliar3_unit",

  "other_date",
  "other_name",
  "other_quantity_kg",

  "other2_date",
  "other2_name",
  "other2_quantity_kg",
];

function mask(value: any) {
  if (!value) return "—";
  const s = String(value);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function getStatus(r: NutrientManagementRecord) {
  const fields = [r.urea_basal_dt, r.ssp_date, r.mop_date, r.dap_date];
  const filled = fields.filter(v => v && String(v).trim() !== "").length;
  if (filled === 0) return "not_filled";
  if (filled === fields.length) return "filled";
  return "partial";
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">
        {name.replace(/_/g, " ")}
      </div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

export default function NutrientManagementTable() {
  const [data, setData] = useState<NutrientManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NutrientManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] =
    useState<"all" | "filled" | "partial" | "not_filled">("all");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<NutrientManagementRecord>();

  const columns: ColumnDef<NutrientManagementRecord, any>[] = useMemo(() => {
    const generated = schemaFields.map(field => {
      if (field === "farmer_mobile" || field === "surveyor_id") {
        return columnHelper.accessor(field, {
          header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => mask(info.getValue()),
        });
      }

      return columnHelper.accessor(field, {
        header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        cell: info => {
          const v = info.getValue();
          return v ? String(v) : "—";
        },
      });
    });

    generated.push(
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button className={THEME.buttons.primary} onClick={() => setSelected(row.original)}>
            View
          </button>
        ),
      })
    );

    return generated;
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/nutrient-management");
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
      "urea_basal_dt",
      "ssp_date",
      "mop_date",
      "dap_date",
    ].forEach(f => (v[f] = true));

    return v;
  });

  const uniqueDistricts = useMemo(
    () => [...new Set(data.map(r => r.district_name).filter(Boolean))].sort(),
    [data]
  );

  const uniqueBlocks = useMemo(
    () =>
      [...new Set(
        data
          .filter(r => !districtFilter || r.district_name === districtFilter)
          .map(r => r.block_name)
          .filter(Boolean)
      )].sort(),
    [data, districtFilter]
  );

  const uniqueVillages = useMemo(
    () =>
      [...new Set(
        data
          .filter(r => !districtFilter || r.district_name === districtFilter)
          .filter(r => !blockFilter || r.block_name === blockFilter)
          .map(r => r.village_name)
          .filter(Boolean)
      )].sort(),
    [data, districtFilter, blockFilter]
  );

  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(r => {
      if (completionFilter !== "all" && getStatus(r) !== completionFilter) return false;
      if (districtFilter && r.district_name !== districtFilter) return false;
      if (blockFilter && r.block_name !== blockFilter) return false;
      if (villageFilter && r.village_name !== villageFilter) return false;
      if (g && !JSON.stringify(r).toLowerCase().includes(g)) return false;
      return true;
    });
  }, [
    data,
    globalFilter,
    completionFilter,
    districtFilter,
    blockFilter,
    villageFilter,
  ]);

  const table = useReactTable({
    data: finalData,
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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function exportCSV() {
    if (!finalData.length) return;

    const headers = schemaFields;

    const rows = finalData.map(row =>
      headers.map(h => {
        let v: any = row[h];
        if (h === "farmer_mobile" || h === "surveyor_id") v = mask(v);
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
    a.download = "nutrient_management.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">

      <div className="bg-white border rounded-lg p-4 mb-6">

        <div className="flex justify-between mb-4">
          <button onClick={exportCSV} className="px-4 py-2 rounded bg-green-600 text-white">
            Export CSV
          </button>

          <div className="relative">
            <button
              className="px-4 py-2 rounded bg-gray-700 text-white"
              onClick={() => setShowColumnMenu(p => !p)}
            >
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-60 p-3 z-50 max-h-72 overflow-y-auto">
                {schemaFields.map(col => (
                  <label key={col} className="flex gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={table.getColumn(col)?.getIsVisible() ?? false}
                      onChange={e =>
                        table.getColumn(col)?.toggleVisibility(e.target.checked)
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

          <div>
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded h-10 px-3 w-full"
              placeholder="Search..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded h-10 px-3 w-full"
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueDistricts.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded h-10 px-3 w-full"
              disabled={!districtFilter}
              value={blockFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueBlocks.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded h-10 px-3 w-full"
              disabled={!blockFilter}
              value={villageFilter}
              onChange={e => setVillageFilter(e.target.value)}
            >
              <option value="">All</option>
              {uniqueVillages.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

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

          <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm rounded-full">
            Filled: {data.filter(r => getStatus(r) === "filled").length}
          </span>

          <span className="px-4 py-1.5 bg-yellow-100 text-yellow-700 text-sm rounded-full">
            Partial: {data.filter(r => getStatus(r) === "partial").length}
          </span>

          <span className="px-4 py-1.5 bg-red-100 text-red-700 text-sm rounded-full">
            Not Filled: {data.filter(r => getStatus(r) === "not_filled").length}
          </span>

          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length}
          </span>
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

      <div className="flex gap-4 items-center mt-4">
        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span className="text-sm font-medium">
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

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
          <div className="bg-white w-[480px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Nutrient Management Details</h2>
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

              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {schemaFields.map(key => {
                let value: any = selected[key];
                if (key === "farmer_mobile" || key === "surveyor_id") value = mask(value);
                return <Field key={key} name={key} value={value} />;
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
