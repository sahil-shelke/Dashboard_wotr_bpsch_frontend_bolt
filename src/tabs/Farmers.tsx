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

import { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------
// Types
// ------------------------------------------------------
export type CropRegistration = {
  crop_id?: string;
  plot_area?: string;
  season?: string;
  year?: string;
  [k: string]: any;
};

export type FarmerRecord = {
  farmer_id?: string;
  farmer_name?: string;
  farmer_mobile?: string;
  surveyor_id?: string;
  farmer_category?: string;
  block_code?: string;
  block_name?: string;
  district_code?: string;
  district_name?: string;
  village_code?: string;
  village_name?: string;
  crop_registrations?: CropRegistration[] | string;
  [k: string]: any;
};

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------
function parseCropRegs(raw: any): CropRegistration[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeVal<T extends object, K extends keyof T>(obj: T | null, key: K) {
  const v = obj?.[key];
  if (!v || (typeof v === "string" && v.trim() === "")) return "—";
  return v;
}

// ------------------------------------------------------
// Component
// ------------------------------------------------------
export default function FarmerRecordsTable() {
  const [data, setData] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FarmerRecord | null>(null);

  // TABLE STATE
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  // dependent filters
  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<FarmerRecord>();

  // ------------------------------------------------------
  // Columns
  // ------------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_id", { header: "Farmer ID" }),
    columnHelper.accessor("farmer_category", { header: "Category" }),
    columnHelper.accessor("block_code", { header: "Block Code" }),
    columnHelper.accessor("district_code", { header: "District Code" }),
    columnHelper.accessor("village_code", { header: "Village Code" }),

    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),

    columnHelper.display({
      id: "crop_count",
      header: "Crops",
      cell: ({ row }) => {
        const arr = parseCropRegs(row.original.crop_registrations);
        return <>{arr.length}</>;
      },
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setSelected(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  // default hide
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_id: false,
    farmer_category: false,
    block_code: false,
    district_code: false,
    village_code: false,
  });

  // ------------------------------------------------------
  // Fetch
  // ------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farmers");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ------------------------------------------------------
  // Unique Lists (DEPENDENT)
  // ------------------------------------------------------
  const uniqueDistricts = useMemo(
    () => [...new Set(data.map((d) => d.district_name).filter(Boolean))].sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return [
      ...new Set(
        data
          .filter((d) => !districtFilter || d.district_name === districtFilter)
          .map((d) => d.block_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return [
      ...new Set(
        data
          .filter(
            (d) =>
              (!districtFilter || d.district_name === districtFilter) &&
              (!blockFilter || d.block_name === blockFilter)
          )
          .map((d) => d.village_name)
          .filter(Boolean)
      ),
    ].sort();
  }, [data, districtFilter, blockFilter]);

  // ------------------------------------------------------
  // Final Filtered Data
  // ------------------------------------------------------
  const finalData = useMemo(() => {
    return data.filter((rec) => {
      const searchMatch = JSON.stringify(rec)
        .toLowerCase()
        .includes(globalFilter.toLowerCase());

      const districtMatch = !districtFilter || rec.district_name === districtFilter;
      const blockMatch = !blockFilter || rec.block_name === blockFilter;
      const villageMatch = !villageFilter || rec.village_name === villageFilter;

      return searchMatch && districtMatch && blockMatch && villageMatch;
    });
  }, [data, globalFilter, districtFilter, blockFilter, villageFilter]);

  // ------------------------------------------------------
  // Table Init
  // ------------------------------------------------------
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

  if (loading) return <div className="p-6">Loading...</div>;

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          
          <input
            placeholder="Search…"
            className="border px-3 py-2 rounded w-full"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />

          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setBlockFilter("");
              setVillageFilter("");
            }}
            className="border px-3 py-2 rounded"
          >
            <option value="">All Districts</option>
            {uniqueDistricts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <select
            value={blockFilter}
            onChange={(e) => {
              setBlockFilter(e.target.value);
              setVillageFilter("");
            }}
            disabled={!districtFilter}
            className={`border px-3 py-2 rounded ${!districtFilter ? "bg-gray-200" : ""}`}
          >
            <option value="">All Blocks</option>
            {uniqueBlocks.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>

          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            disabled={!blockFilter}
            className={`border px-3 py-2 rounded ${!blockFilter ? "bg-gray-200" : ""}`}
          >
            <option value="">All Villages</option>
            {uniqueVillages.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* columns + count */}
        <div className="flex items-center justify-between mb-4">
          <details className="border px-3 py-2 rounded cursor-pointer">
            <summary>Columns</summary>
            <div className="mt-2 flex flex-col gap-1">
              {table.getAllLeafColumns().map((col) => (
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

          <span className="text-gray-700 text-sm">
            Showing {table.getFilteredRowModel().rows.length} of {data.length} farmers
          </span>
        </div>

        {/* TABLE */}
        <div className="w-full overflow-auto border rounded">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-3 border-b cursor-pointer"
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
                  className={`${i % 2 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}
                >
                  {row.getVisibleCells().map((cell) => (
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
        <div className="flex items-center gap-3 mt-4">
          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>

          <span>Page {pagination.pageIndex + 1} / {table.getPageCount()}</span>

          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>

        {/* MODAL */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[620px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Farmer Details</h2>
                <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                  ✕
                </button>
              </div>

              <div className="space-y-4">

                <section>
                  <h3 className="text-sm font-semibold mb-2">Primary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Farmer ID</div>
                      <div className="text-sm">{safeVal(selected, "farmer_id")}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase">Name</div>
                      <div className="text-sm">{safeVal(selected, "farmer_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase">Mobile</div>
                      <div className="text-sm">{safeVal(selected, "farmer_mobile")}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase">Surveyor ID</div>
                      <div className="text-sm">{safeVal(selected, "surveyor_id")}</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2">Location</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Village</div>
                      <div className="text-sm">{safeVal(selected, "village_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase">Block</div>
                      <div className="text-sm">{safeVal(selected, "block_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase">District</div>
                      <div className="text-sm">{safeVal(selected, "district_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase">Category</div>
                      <div className="text-sm">{safeVal(selected, "farmer_category")}</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-2">Crop Registrations</h3>

                  {parseCropRegs(selected?.crop_registrations).length === 0 ? (
                    <div className="text-sm text-gray-500">No crop registrations</div>
                  ) : (
                    <div className="overflow-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2 border">Crop ID</th>
                            <th className="p-2 border">Plot Area</th>
                            <th className="p-2 border">Season</th>
                            <th className="p-2 border">Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseCropRegs(selected?.crop_registrations).map((c, idx) => (
                            <tr key={idx} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                              <td className="p-2 border">{c.crop_id || "—"}</td>
                              <td className="p-2 border">{c.plot_area || "—"}</td>
                              <td className="p-2 border">{c.season || "—"}</td>
                              <td className="p-2 border">{c.year || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
