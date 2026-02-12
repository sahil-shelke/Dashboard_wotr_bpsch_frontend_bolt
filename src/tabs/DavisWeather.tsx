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

// -------------------------------------------------------------
// Stations (default = Ninavi)
// -------------------------------------------------------------
const STATIONS: { station_code: string; station_name: string }[] = [
  { station_code: "211815", station_name: "Shahapur Kadim" },
  { station_code: "210783", station_name: "Khadki" },
  { station_code: "212450", station_name: "Ninavi" }, // DEFAULT
  { station_code: "212775", station_name: "Jaulke (Bk)" },
  { station_code: "209837", station_name: "Kude (Bk)" },
  { station_code: "209844", station_name: "Devoshi" },
  { station_code: "212670", station_name: "Kiraksal" },
  { station_code: "212075", station_name: "Massa (Kh)" },
  { station_code: "214757", station_name: "Vaijubabhulgaon" },
  { station_code: "215186", station_name: "Satnavari" },
];

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------
export type WeatherStationRecord = {
  id?: number;
  station_id?: number | string;
  station_name?: string;
  reading_time?: string;
  barometer_hpa?: number;
  temp_c?: number;
  high_temp_c?: number;
  low_temp_c?: number;
  humidity_percent?: number;
  dew_point_c?: number;
  wet_bulb_c?: number;
  wind_speed_kmph?: number;
  wind_direction_deg?: number;
  high_wind_speed_kmph?: number;
  high_wind_direction_deg?: number;
  rain_mm?: number;
  rain_rate_mm_per_hr?: number;
  solar_rad_w_per_m2?: number;
  high_solar_rad_w_per_m2?: number;
  et_mm?: number;
  [key: string]: any;
};

// -------------------------------------------------------------
function safe(obj: any, key: keyof WeatherStationRecord) {
  const v = obj?.[key];
  return v !== undefined && v !== null && String(v).trim() !== "" ? v : "—";
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(raw: string | undefined) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function toApiDate(yyyy_mm_dd: string) {
  if (!yyyy_mm_dd) return "";
  const [yyyy, mm, dd] = yyyy_mm_dd.split("-");
  const yy = yyyy.slice(-2);
  return `${mm}/${dd}/${yy}`;
}

// -------------------------------------------------------------
export default function WeatherStationTable() {
  const [data, setData] = useState<WeatherStationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WeatherStationRecord | null>(null);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const [stationCode, setStationCode] = useState("212450");
  const [startDate, setStartDate] = useState(formatDate(yesterday));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [globalFilter, setGlobalFilter] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<WeatherStationRecord>();

  const columns = [
    columnHelper.accessor("station_name", { header: "Station" }),

    // ⭐⭐⭐ FULL TIMESTAMP SHOWN HERE (UPDATED)
    columnHelper.accessor("reading_time", {
      header: "Reading Time",
      cell: ({ getValue }) => {
        const raw = getValue() as string;
        if (!raw) return "—";
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;
        return d.toLocaleString(); // FULL DATE + TIME
      },
    }),

    columnHelper.accessor("temp_c", { header: "Temp (°C)" }),
    columnHelper.accessor("humidity_percent", { header: "Humidity (%)" }),
    columnHelper.accessor("wind_speed_kmph", { header: "Wind (kmph)" }),
    columnHelper.accessor("rain_mm", { header: "Rain (mm)" }),
    columnHelper.accessor("solar_rad_w_per_m2", { header: "Solar (W/m²)" }),

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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // -------------------------------------------------------------
  async function fetchData() {
    setLoading(true);
    const apiStart = toApiDate(startDate);
    const apiEnd = toApiDate(endDate);

    const url = `/api/davis/dashboard?station_id=${stationCode}&start_date=${apiStart}&end_date=${apiEnd}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // -------------------------------------------------------------
  function exportCSV() {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) return;

    const visibleCols = table
      .getAllLeafColumns()
      .filter(c => c.getIsVisible() && c.id !== "actions");

    const headers = visibleCols.map(col =>
      typeof col.columnDef.header === "string" ? col.columnDef.header : col.id
    );

    const csvRows = rows.map(r =>
      visibleCols
        .map(col => {
          const v = (r.original as any)[col.id];
          const s = v === undefined || v === null ? "" : String(v);
          return s.includes(",") ? `"${s}"` : s;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "weather_station.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  // -------------------------------------------------------------
  return (
    <div className="w-full">

      {/* FILTER PANEL */}
      <div className="bg-white rounded-lg border border-[#6D4C41]/20 p-4 mb-4">

        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Export
          </button>

          <details className="relative">
            <summary className="px-4 py-2 rounded bg-gray-700 text-white cursor-pointer">
              View Additional Data
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded border p-3 z-50 max-h-64 overflow-auto">
              {table.getAllLeafColumns().map(col => (
                <label key={col.id} className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                  />
                  {typeof col.columnDef.header === "string"
                    ? col.columnDef.header
                    : col.id}
                </label>
              ))}
            </div>
          </details>
        </div>

        {/* STATION + DATES + APPLY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="flex flex-col">
            <label className="text-sm font-medium">Station</label>
            <select
              className="h-10 border rounded px-3"
              value={stationCode}
              onChange={e => setStationCode(e.target.value)}
            >
              {STATIONS.map(s => (
                <option key={s.station_code} value={s.station_code}>
                  {s.station_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="h-10 border rounded px-3"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">End Date</label>
            <input
              type="date"
              className="h-10 border rounded px-3"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button className={THEME.buttons.primary} onClick={fetchData}>
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex items-center justify-between mb-4">
        <input
          placeholder="Search…"
          className="border px-3 py-2 rounded w-60"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />

        <span className="text-sm text-gray-700">
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

      {/* PAGINATION */}
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

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white w-[520px] max-h-[85vh] rounded-lg p-5 shadow-xl overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Weather Station Reading</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(selected).map(k => (
                <div key={k} className="border-b pb-2">
                  <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                  <div className="text-sm">
                    {k === "reading_time"
                      ? new Date(selected[k]).toLocaleString() // ⭐ FULL TIMESTAMP IN MODAL TOO
                      : safe(selected, k as any)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
