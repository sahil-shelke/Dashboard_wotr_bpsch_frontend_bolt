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
  mobile_number?: string;
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
// Zone <-> Village mapping
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

const ALL_ZONES = Object.keys(zoneVillageMap);
const ALL_VILLAGES = ALL_ZONES.map(z => zoneVillageMap[z].village);

// -----------------------------------------------------
// Mask helpers
// -----------------------------------------------------
function maskName(v: string): string {
  if (!v) return "—";
  const parts = v.trim().split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}

function maskMobile(v?: string): string {
  if (!v) return "—";
  const s = String(v);
  return "X".repeat(Math.max(0, s.length - 4)) + s.slice(-4);
}

// -----------------------------------------------------
function safe(obj: any, key: keyof SoilLiveRecord) {
  const v = obj?.[key];

  if (key === "farmer_name") return maskName(v);
  if (key === "mobile_number") return maskMobile(v);

  return v && String(v).trim() !== "" ? v : "—";
}

// Utility
function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

// -----------------------------------------------------
// Component
// -----------------------------------------------------
export default function SoilMoistureLiveTable() {
  const [data, setData] = useState<SoilLiveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  const [zoneId, setZoneId] = useState<string>("zone05");
  const [village, setVillage] = useState<string>(zoneVillageMap["zone05"].village);

  const [startDate, setStartDate] = useState(formatDate(twoDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  const [selected, setSelected] = useState<SoilLiveRecord | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<SoilLiveRecord>();

  const schemaFields: (keyof SoilLiveRecord)[] = [
    "farmer_name",
    "mobile_number",
    "sensor1_value",
    "sensor2_value",
    "zone_id",
    "district_name",
    "block_name",
    "village_name",
    "date",
    "time",
  ];

  const columns = [
    columnHelper.accessor("farmer_name", {
      header: "Farmer",
      cell: ({ row }) => maskName(row.original.farmer_name),
    }),

    columnHelper.accessor("mobile_number", {
      header: "Mobile",
      cell: ({ row }) => maskMobile(row.original.mobile_number),
    }),

    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("village_name", { header: "Village" }),

    // columnHelper.accessor("sensor1_name", { header: "Sensor 1" }),
    columnHelper.accessor("sensor1_value", { header: "Value 1" }),
    // columnHelper.accessor("sensor2_name", { header: "Sensor 2" }),
    columnHelper.accessor("sensor2_value", { header: "Value 2" }),

    columnHelper.accessor("date", { header: "Date" }),
    columnHelper.accessor("time", { header: "Time" }),

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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    district_name: false,
    block_name: false,
    village_name: false,
    zone_id: false,
  });

  const villageToZone = useMemo(() => {
    const m: Record<string, string> = {};
    for (const z of ALL_ZONES) {
      const v = zoneVillageMap[z].village;
      m[v] = z;
    }
    return m;
  }, []);

  useEffect(() => {
    const z = villageToZone[village];
    if (z) setZoneId(z);
  }, [village, villageToZone]);

  async function fetchData() {
    if (!zoneId) return;
    setLoading(true);
    try {
      const url = `/api/farm-management/soil-moisture-sensor?zone_id=${encodeURIComponent(
        zoneId
      )}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;

      const res = await fetch(url);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error("fetch error", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const table = useReactTable({
    data,
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

  function exportCSV() {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) return;

    const headers = schemaFields;

    const csvRows = rows.map(r =>
      headers
        .map(h => {
          let v = (r.original as any)[h];

          if (h === "farmer_name") v = maskName(v);
          if (h === "mobile_number") v = maskMobile(v);

          if (v == null) return "";
          const s = String(v);
          if (s.includes(",") || s.includes('"') || s.includes("\n"))
            return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soil_moisture_live_${zoneId}_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full">
      {/* FILTER PANEL */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#2E3A3F]">Filters</h3>

          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium">Village</label>
            <select
              className="h-10 rounded border px-3"
              value={village}
              onChange={e => setVillage(e.target.value)}
            >
              <option value="">Select village</option>
              {ALL_VILLAGES.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Start Date</label>
            <input type="date" className="h-10 rounded border px-3" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">End Date</label>
            <input type="date" className="h-10 rounded border px-3" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <div className="flex items-end">
            <button onClick={fetchData} className={THEME.buttons.primary}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex items-center justify-between mb-4">
        <input
          placeholder="Search..."
          className="border px-3 py-2 rounded w-60"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />

        <span className="text-sm text-gray-600">
          Showing {table.getFilteredRowModel().rows.length} of {data.length}
        </span>
      </div>

      {/* TABLE */}
      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id} className={THEME.table.theadText} onClick={header.column.getToggleSortingHandler()}>
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
              <tr key={row.id} className={`${i % 2 ? THEME.table.rowOdd : THEME.table.rowEven} ${THEME.table.rowHover}`}>
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

      {/* PAGINATION */}
      <div className="flex gap-3 items-center mt-4">
        <button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="border px-4 py-2 rounded">
          Prev
        </button>
        <span>
          Page {pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="border px-4 py-2 rounded">
          Next
        </button>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[450px] max-h-[85vh] rounded shadow-lg p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Soil Sensor Reading</h2>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="space-y-3">
              {schemaFields.map(k => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                  <div className="text-sm">{safe(selected, k)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
