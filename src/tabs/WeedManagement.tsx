

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

const schemaFields: (keyof WeedManagementRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "crop_registration_id",
  "hoeing_date_1",
  "hoeing_date_2",
  "hand_weeding_date_1",
  "hand_weeding_date_2",
  "post_herbicide_date_1",
  "post_herbicide_name_1",
  "post_herbicide_quantity_1",
  "post_herbicide_unit_1",
  "post_herbicide_date_2",
  "post_herbicide_name_2",
  "post_herbicide_quantity_2",
  "post_herbicide_unit_2",
  "post_herbicide_date_3",
  "post_herbicide_name_3",
  "post_herbicide_quantity_3",
  "post_herbicide_unit_3",
  "per_herbicide_date",
  "per_herbicide_name",
  "per_herbicide_quantity",
  "per_herbicide_unit",
];

function mask(value: any) {
  if (!value) return "—";
  const s = String(value);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function getStatus(r: WeedManagementRecord) {
  const fields = [
    r.hoeing_date_1,
    r.hand_weeding_date_1,
    r.post_herbicide_date_1,
    r.post_herbicide_name_1,
    r.per_herbicide_date,
  ];
  const filled = fields.filter(v => v && String(v).trim() !== "").length;
  if (filled === 0) return "not_filled";
  if (filled === fields.length) return "filled";
  return "partial";
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs text-gray-500 uppercase">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

export default function WeedManagementTable() {
  const [data, setData] = useState<WeedManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<WeedManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] =
    useState<"all" | "filled" | "partial" | "not_filled">("all");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<WeedManagementRecord>();

  const columns = useMemo(() => {
    const generated = schemaFields.map(field => {
      const id = String(field);

      if (id === "farmer_mobile" || id === "surveyor_id") {
        return columnHelper.accessor(id as any, {
          header: id.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => mask(info.getValue()),
        });
      }

      return columnHelper.accessor(id as any, {
        header: id.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        cell: info => {
          const v = info.getValue();
          return v === undefined || v === null || v === "" ? "—" : String(v);
        },
      });
    });

    generated.push(
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button className={THEME.buttons.primary} onClick={() => setSelectedRecord(row.original)}>
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
        const res = await fetch("/api/farm-management/weed-management");
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
    const s: VisibilityState = {};
    schemaFields.forEach(f => (s[f] = false));
    [
      "farmer_name",
      "farmer_mobile",
      "crop_name_en",
      "hoeing_date_1",
      "hand_weeding_date_1",
    ].forEach(k => (s[k] = true));
    return s;
  });

  const uniqueDistricts = useMemo(
    () => [...new Set(data.map(r => r.district_name).filter(Boolean))].sort(),
    [data]
  );

  const uniqueBlocks = useMemo(
    () => [...new Set(data.map(r => r.block_name).filter(Boolean))].sort(),
    [data]
  );

  const uniqueVillages = useMemo(
    () => [...new Set(data.map(r => r.village_name).filter(Boolean))].sort(),
    [data]
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
    const BOM = "\uFEFF"; // UTF-8 BOM
    const blob = new Blob([BOM + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weed_management.csv";
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
                {schemaFields.map(col => {
                  const c = table.getColumn(col);
                  return (
                    <label key={col} className="flex gap-2 text-sm mb-2">
                      <input
                        type="checkbox"
                        checked={c?.getIsVisible() ?? false}
                        onChange={e => c?.toggleVisibility(e.target.checked)}
                      />
                      {String(col).replace(/_/g, " ")}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10 w-full"
              placeholder="Search..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueDistricts.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={blockFilter}
              disabled={!districtFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueBlocks.map(b => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded px-3 h-10 w-full"
              value={villageFilter}
              disabled={!blockFilter}
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

          <span className="px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700">
            Filled: {data.filter(r => getStatus(r) === "filled").length}
          </span>

          <span className="px-3 py-1.5 rounded-full text-sm bg-yellow-100 text-yellow-700">
            Partial: {data.filter(r => getStatus(r) === "partial").length}
          </span>

          <span className="px-3 py-1.5 rounded-full text-sm bg-red-100 text-red-700">
            Not Filled: {data.filter(r => getStatus(r) === "not_filled").length}
          </span>

          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length} records
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
          className="border px-4 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span className="text-sm font-medium">
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button
          className="border px-4 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[480px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Weed Management Details</h2>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    getStatus(selectedRecord) === "filled"
                      ? "bg-green-100 text-green-700"
                      : getStatus(selectedRecord) === "partial"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {getStatus(selectedRecord).replace("_", " ")}
                </span>
              </div>

              <button className="text-gray-500 hover:text-black" onClick={() => setSelectedRecord(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {schemaFields.map(key => {
                let value: any = selectedRecord[key];
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
