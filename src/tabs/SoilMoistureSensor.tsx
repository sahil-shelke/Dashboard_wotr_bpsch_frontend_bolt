

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { THEME } from "../utils/theme";

import { useEffect, useMemo, useState } from "react";

// -----------------------------------------------------
// Types
// -----------------------------------------------------
export type SoilLiveRecord = {
  farmer_name: string;
  farmer_mobile?: string;
  sensor1_name: string;
  sensor1_value: string;
  sensor2_name: string;
  sensor2_value: string;
  zone_id: string;
  district_name?: string;
  block_name?: string;
  village_name?: string;
  date: string;
  time: string;
};

// -----------------------------------------------------
// Zone <-> Village mapping (from your screenshot)
// keep this mapping here so UI can derive villages
// -----------------------------------------------------
const zoneVillageMap: Record<
  string,
  { district: string; block: string; village: string }
> = {
  zone01: { district: "Pune", block: "Khed", village: "Jaulke (bk.)" },
  zone02: { district: "Ch. Sambhajinagar", block: "Gangapur", village: "Kadim Shahapur" },
  zone03: { district: "Jalna", block: "Bhokardan", village: "Khadki" },
  zone04: { district: "Dharashiv", block: "Kalamb", village: "Massa (kh.)" },
  zone05: { district: "Satara", block: "Man", village: "Kiraksal" },
  zone06: { district: "Ahilyanagar", block: "Pathardi", village: "Vaijubabhulgaon" },
  zone07: { district: "Nashik", block: "Igatpuri", village: "Ninavi" },
};

// helper arrays derived from map
const ALL_ZONES = Object.keys(zoneVillageMap);
const ALL_VILLAGES = ALL_ZONES.map(z => zoneVillageMap[z].village);

// -----------------------------------------------------
// Safe helper
// -----------------------------------------------------
function safe(obj: any, key: keyof SoilLiveRecord) {
  const v = obj?.[key];
  return v && String(v).trim() !== "" ? v : "—";
}

// Utility: format date YYYY-MM-DD
function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

// -----------------------------------------------------
// Component
// -----------------------------------------------------
export default function SoilMoistureLiveTable() {
  const [data, setData] = useState<SoilLiveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // defaults: last 2 days
  const today = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  // internal zone id (hidden to user). initialize to zone05 as before
  const [zoneId, setZoneId] = useState<string>("zone05");

  // village selected by user (primary selector)
  const [village, setVillage] = useState<string>(zoneVillageMap["zone05"].village);

  const [startDate, setStartDate] = useState(formatDate(twoDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  const [selected, setSelected] = useState<SoilLiveRecord | null>(null);

  // table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<SoilLiveRecord>();

  // -------------------------------
  // columns & schema (CSV order)
  // -------------------------------
  const schemaFields: (keyof SoilLiveRecord)[] = [
    "farmer_name",
    "farmer_mobile",
    "sensor1_name",
    "sensor1_value",
    "sensor2_name",
    "sensor2_value",
    "zone_id",
    "district_name",
    "block_name",
    "village_name",
    "date",
    "time",
  ];

  const columns = [
    // primary visible
    columnHelper.accessor("farmer_name", { header: "Farmer" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),

    // hidden but searchable columns (district/block/village)
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("village_name", { header: "Village" }),

    // sensors & time
    columnHelper.accessor("sensor1_name", { header: "Sensor 1" }),
    columnHelper.accessor("sensor1_value", { header: "Value 1" }),
    columnHelper.accessor("sensor2_name", { header: "Sensor 2" }),
    columnHelper.accessor("sensor2_value", { header: "Value 2" }),

    columnHelper.accessor("date", { header: "Date" }),
    columnHelper.accessor("time", { header: "Time" }),

    // zone (kept in CSV but hidden in UI)
    columnHelper.accessor("zone_id", { header: "Zone" }),

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

  // -------------------------------
  // default column visibility (village/district/block hidden)
  // keep main sensor columns visible
  // -------------------------------
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    district_name: false,
    block_name: false,
    village_name: false,
    zone_id: false, // hide zone in table (but include in CSV)
  });

  // -------------------------------
  // Build village->zone reverse map for quick lookup
  // -------------------------------
  const villageToZone = useMemo(() => {
    const m: Record<string, string> = {};
    for (const z of ALL_ZONES) {
      const v = zoneVillageMap[z].village;
      m[v] = z;
    }
    return m;
  }, []);

  // -------------------------------
  // synchronize village -> zoneId
  // When village changes, auto-fill zoneId (hidden)
  // -------------------------------
  useEffect(() => {
    const z = villageToZone[village];
    if (z) setZoneId(z);
  }, [village, villageToZone]);

  // -------------------------------
  // Fetch Data using query params (zoneId, start/end)
  // -------------------------------
  async function fetchData() {
    if (!zoneId) return;
    setLoading(true);
    try {
      // encode params to be safe
      const url = `/api/farm-management/soil-moisture-sensor?zone_id=${encodeURIComponent(
        zoneId
      )}&start_date=${encodeURIComponent(startDate || "")}&end_date=${encodeURIComponent(endDate || "")}`;

      // using absolute localhost for dev environment like others
      // const fullUrl = url.startsWith("/api") ? `${url}` : url;

      const res = await fetch(url);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error("Failed fetching soil live data", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  // default fetch on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------
  // Table init
  // -------------------------------
  const table = useReactTable({
    data,
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) return <div className="p-6">Loading...</div>;

  // -------------------------------
  // CSV Export (exports current filtered rows)
  // -------------------------------
  function exportCSV() {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) return;
    const headers = schemaFields;
    const csvRows = rows.map(r =>
      headers.map(h => {
        const v = (r.original as any)[h];
        if (v == null) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      }).join(",")
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const BOM = "\uFEFF"; // UTF-8 BOM
    const blob = new Blob([BOM + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soil_moisture_live_${zoneId}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="w-full">
      {/* FILTER PANEL */}
      <div className="bg-white rounded-lg border border-[#6D4C41]/20 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2E3A3F]">Filters</h3>

          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
              Export CSV
            </button>

            <details className="relative">
              <summary className="px-3 py-2 rounded bg-gray-700 text-white cursor-pointer">Columns</summary>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#6D4C41]/20 rounded shadow p-3 z-50 max-h-64 overflow-y-auto">
                {table.getAllLeafColumns().map(col => (
                  <label key={col.id} className="flex items-center gap-2 text-sm mb-2">
                    <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} />
                    <span className="capitalize">{col.id.replaceAll("_", " ")}</span>
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Village selector (primary) */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium text-[#2E3A3F]">Village</label>
            <select
              className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            >
              <option value="">Select village</option>
              {ALL_VILLAGES.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">Zone auto-selected from village</div>
          </div>

          {/* (hidden) zone id - kept for debugging if needed, but not shown */}
          <div className="flex flex-col md:col-span-1">
            <label className="text-sm font-medium text-[#2E3A3F]">Zone (hidden)</label>
            <input
              className="h-10 rounded-md border border-[#6D4C41]/20 px-3 bg-gray-50"
              value={zoneId}
              readOnly
              aria-hidden
            />
          </div>

          {/* Start date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-[#2E3A3F]">Start Date</label>
            <input
              type="date"
              className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-[#2E3A3F]">End Date</label>
            <input
              type="date"
              className="h-10 rounded-md border border-[#6D4C41]/20 px-3"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Apply */}
          <div className="flex items-end">
            <button onClick={fetchData} className={THEME.buttons.primary}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search / Stats */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <input
          placeholder="Search..."
          className="border px-3 py-2 rounded-md w-60"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <span className="text-[#2E3A3F]/70 text-sm font-medium ml-auto">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </span>
      </div>

      {/* TABLE */}
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
              <tr key={row.id} className={`${i % 2 === 0 ? THEME.table.rowEven : THEME.table.rowOdd} ${THEME.table.rowHover}`}>
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

      {/* Pagination */}
      <div className="flex gap-3 items-center mt-4">
        <button
          className="border border-[#6D4C41]/20 px-4 py-2 rounded-lg disabled:opacity-50 bg-white hover:bg-[#7CB342]/10 text-[#2E3A3F] font-medium"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Prev
        </button>

        <span className="text-[#2E3A3F] font-medium">
          Page {pagination.pageIndex + 1} of {table.getPageCount()}
        </span>

        <button
          className="border border-[#6D4C41]/20 px-4 py-2 rounded-lg disabled:opacity-50 bg-white hover:bg-[#7CB342]/10 text-[#2E3A3F] font-medium"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[450px] max-h-[85vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Soil Sensor Reading</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="space-y-3">
              {[
                "farmer_name",
                "farmer_mobile",
                "sensor1_name",
                "sensor1_value",
                "sensor2_name",
                "sensor2_value",
                "zone_id",
                "district_name",
                "block_name",
                "village_name",
                "date",
                "time",
              ].map(k => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                  <div className="text-sm">{safe(selected, k as keyof SoilLiveRecord)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
