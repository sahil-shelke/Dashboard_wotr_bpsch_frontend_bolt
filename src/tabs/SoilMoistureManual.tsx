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
  crop_registration_id: string;

  soil_data: string; // JSON string
  soil_moisture_count: number;
};

// --------------------------------------------------
// SAFE HELPERS
// --------------------------------------------------
function safeVal(rec: SoilManagementRecord | null, key: keyof SoilManagementRecord) {
  if (!rec) return "—";
  const v = rec[key];
  return v === "" || v === null || v === undefined ? "—" : v;
}

function parseSoilData(jsonStr: string): SoilItem[] {
  try {
    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return [];
    return arr.map((it: any) => ({
      date: it.date ?? "",
      sensor1Dry: it.sensor1Dry ?? "",
      sensor1Wet: it.sensor1Wet ?? "",
      sensor2Dry: it.sensor2Dry ?? "",
      sensor2Wet: it.sensor2Wet ?? "",
    }));
  } catch {
    return [];
  }
}

// --------------------------------------------------
// SMALL COMPONENTS FOR MODAL
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
      <div className="text-xs text-gray-500 uppercase tracking-wider">
        {name.replace(/_/g, " ")}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
export default function SoilManagementTable() {
  const [data, setData] = useState<SoilManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SoilManagementRecord | null>(null);

  // DEPENDENT FILTER STATES
  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const columnHelper = createColumnHelper<SoilManagementRecord>();

  // --------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("crop_registration_id", { header: "Reg ID" }),

    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("soil_moisture_count", { header: "Records Count" }),

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
        const res = await fetch("http://localhost:5000/api/farm-management/soil-moisture-manual");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --------------------------------------------------
  // TABLE STATES
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

    surveyor_id: true,
    farmer_mobile: true,
    soil_moisture_count: true,
    actions: true,
  });

  // --------------------------------------------------
  // DEPENDENT VALUES
  // --------------------------------------------------
  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name))).filter(Boolean).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return Array.from(
      new Set(
        data.filter(r => (districtFilter ? r.district_name === districtFilter : true))
            .map(r => r.block_name)
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

  // --------------------------------------------------
  // FINAL FILTER LOGIC (search + dependent filter)
  // --------------------------------------------------
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

  if (loading) return <div className="p-4">Loading...</div>;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">

        {/* FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">

          {/* SEARCH */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Search</label>
            <input
              placeholder="Search all fields..."
              className="border px-3 py-2 rounded-md"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          {/* DISTRICT */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">District</label>
            <select
              className="border px-3 py-2 rounded-md"
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* BLOCK */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Block</label>
            <select
              className="border px-3 py-2 rounded-md"
              value={blockFilter}
              disabled={!districtFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueBlocks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* VILLAGE */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Village</label>
            <select
              className="border px-3 py-2 rounded-md"
              value={villageFilter}
              disabled={!blockFilter}
              onChange={e => setVillageFilter(e.target.value)}
            >
              <option value="">All</option>
              {uniqueVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* COLUMNS TOGGLE & COUNT */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-700">
            Showing {finalData.length} of {data.length} records
          </span>

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
                      className="p-3 font-semibold border-b cursor-pointer"
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
                <tr key={row.id} className="border-b hover:bg-blue-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-3">
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

        {/* MODAL */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[520px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Soil Moisture Calibration</h2>
                <button
                  className="text-gray-500 hover:text-black"
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">

                <Section title="Farmer & Location">
                  {["farmer_name", "farmer_mobile", "village_name", "block_name", "district_name"].map(
                    k => <Field key={k} name={k} value={safeVal(selected, k as any)} />
                  )}
                </Section>

                <Section title="Crop Details">
                  <Field name="crop_name_en" value={safeVal(selected, "crop_name_en")} />
                </Section>

                <Section title="Summary">
                  <Field name="soil_moisture_count" value={safeVal(selected, "soil_moisture_count")} />
                </Section>

                <Section title="Sensor Calibration Records">
                  {parseSoilData(selected.soil_data).length === 0 ? (
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
                        {parseSoilData(selected.soil_data).map((item, i) => (
                          <tr key={i}>
                            <td className="border p-2">{item.date}</td>
                            <td className="border p-2">{item.sensor1Dry}</td>
                            <td className="border p-2">{item.sensor1Wet}</td>
                            <td className="border p-2">{item.sensor2Dry}</td>
                            <td className="border p-2">{item.sensor2Wet}</td>
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
