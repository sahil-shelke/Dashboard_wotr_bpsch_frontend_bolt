"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useEffect, useMemo, useState } from "react";
import { THEME } from "../utils/theme";

export type CropRegistrationRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  crop_registration_id: string;
  crop_id: string;
  farmer_id: string;
  plot_area: string;
  season: string;
  year: string;
};

function safe(obj: any, key: string) {
  const v = obj?.[key];
  return v && String(v).trim() !== "" ? v : "—";
}

export default function CropRegistrationTable() {
  const [data, setData] = useState<CropRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CropRegistrationRecord | null>(null);

  const [globalFilter, setGlobalFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<CropRegistrationRecord>();

  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),

    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("plot_area", { header: "Plot Area" }),
    columnHelper.accessor("season", { header: "Season" }),
    columnHelper.accessor("year", { header: "Year" }),

    columnHelper.accessor("crop_registration_id", { header: "Reg ID" }),
    columnHelper.accessor("crop_id", { header: "Crop ID" }),
    columnHelper.accessor("farmer_id", { header: "Farmer ID" }),

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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/crop-registrations");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name))).filter(Boolean).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .filter(r => (!districtFilter || r.district_name === districtFilter))
            .map(r => r.block_name)
        )
      )
        .filter(Boolean)
        .sort(),
    [data, districtFilter]
  );

  const uniqueVillages = useMemo(
    () =>
      Array.from(
        new Set(
          data
            .filter(r => (!districtFilter || r.district_name === districtFilter))
            .filter(r => (!blockFilter || r.block_name === blockFilter))
            .map(r => r.village_name)
        )
      )
        .filter(Boolean)
        .sort(),
    [data, districtFilter, blockFilter]
  );

  const filteredData = useMemo(() => {
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
    data: filteredData,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, pagination } as any,
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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-6 w-full">

        <div className="flex justify-between mb-4">
          <button
            onClick={() => {
              const headers = Object.keys(filteredData[0] || {});
              const csvRows = [headers.join(",")];

              filteredData.forEach(rec => {
                const row = headers.map(h => {
                  const val = rec[h as keyof CropRegistrationRecord] ?? "";
                  const s = String(val);
                  return s.includes(",") ? `"${s}"` : s;
                });
                csvRows.push(row.join(","));
              });

              const blob = new Blob([csvRows.join("\n")], {
                type: "text/csv;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "crop_registrations.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Export CSV
          </button>

          <div className="relative inline-block text-left">
            <button
              onClick={() => setColumnVisibility(prev => ({ ...prev, __menu: !prev.__menu }))}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              Columns
            </button>

            {columnVisibility.__menu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 p-3 max-h-72 overflow-y-auto">
                {table.getAllLeafColumns().map(col => (
                  <label key={col.id} className="flex items-center gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                    />
                    {col.id}
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

        {/* ✅ RECORD COUNT ADDED */}
        <div className="mt-4 flex justify-end">
  <span className="text-sm text-gray-700">
    Showing {filteredData.length} of {data.length} records
  </span>
</div>

      </div>

      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    className={THEME.table.theadText}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc" && " ▲"}
                    {h.column.getIsSorted() === "desc" && " ▼"}
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
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span>
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[550px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Crop Registration Details</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <section>
                <h3 className="text-sm font-semibold mb-2">Farmer Details</h3>
                {["farmer_name", "farmer_mobile", "farmer_id"].map(k => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{safe(selected, k)}</div>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Crop Details</h3>
                {["crop_name_en", "crop_id", "plot_area", "season", "year"].map(k => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{safe(selected, k)}</div>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Surveyor & Location</h3>
                {["surveyor_name", "surveyor_id", "village_name", "block_name", "district_name"].map(k => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{safe(selected, k)}</div>
                  </div>
                ))}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
