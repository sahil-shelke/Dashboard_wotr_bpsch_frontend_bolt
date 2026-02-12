

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
import { THEME } from "../utils/theme";
import { useEffect, useMemo, useState } from "react";

export type VillageItem = {
  village_code?: string;
  village_name?: string;
  [k: string]: any;
};

export type SurveyorRecord = {
  surveyor_id?: string;
  surveyor_name?: string;
  surveyor_pin?: string;
  state?: string;
  state_code?: string;
  district?: string;
  district_code?: string;
  block?: string;
  block_code?: string;
  station_id?: string;
  villages?: VillageItem[] | string;
  [k: string]: any;
};

// ------------------------
// MASK FUNCTIONS
// ------------------------
function maskNumber(v: any) {
  if (!v) return "—";
  const s = String(v);
  if (s.length <= 4) return s;
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function maskPIN(v: any) {
  if (!v) return "—";
  return "XXXX";
}

function parseVillages(raw: any): VillageItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function safe(obj: any, key: string) {
  const v = obj?.[key];
  return v && String(v).trim() !== "" ? v : "—";
}

export default function SurveyorRecordsTable() {
  const [data, setData] = useState<SurveyorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SurveyorRecord | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    surveyor_pin: false,
    state_code: false,
    district_code: false,
    block_code: false,
    station_id: false,
  });

  const columnHelper = createColumnHelper<SurveyorRecord>();

  // --------------------------
  // TABLE COLUMNS
  // --------------------------
  const columns = [
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),

    columnHelper.accessor("surveyor_id", {
      header: "Surveyor ID",
      cell: ({ getValue }) => maskNumber(getValue()), // MASKED
    }),

    columnHelper.accessor("surveyor_pin", {
      header: "PIN",
      cell: ({ getValue }) => maskPIN(getValue()), // MASKED
    }),

    columnHelper.accessor("state", { header: "State" }),
    columnHelper.accessor("district", { header: "District" }),
    columnHelper.accessor("block", { header: "Block" }),

    columnHelper.display({
      id: "village_count",
      header: "Villages",
      cell: ({ row }) => parseVillages(row.original.villages).length,
    }),

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

  // --------------------------
  // LOAD DATA
  // --------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/surveyors/");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --------------------------
  // FILTER OPTIONS
  // --------------------------
  const uniqueStates = useMemo(
    () => [...new Set(data.map((d) => d.state).filter(Boolean))].sort(),
    [data]
  );

  const uniqueDistricts = useMemo(() => {
    return [
      ...new Set(
        data
          .filter((d) => !stateFilter || d.state === stateFilter)
          .map((d) => d.district)
          .filter(Boolean)
      ),
    ].sort();
  }, [data, stateFilter]);

  const uniqueBlocks = useMemo(() => {
    return [
      ...new Set(
        data
          .filter(
            (d) =>
              (!stateFilter || d.state === stateFilter) &&
              (!districtFilter || d.district === districtFilter)
          )
          .map((d) => d.block)
          .filter(Boolean)
      ),
    ].sort();
  }, [data, stateFilter, districtFilter]);

  const filteredData = useMemo(() => {
    return data.filter((rec) => {
      const s = JSON.stringify(rec).toLowerCase().includes(globalFilter.toLowerCase());
      const st = !stateFilter || rec.state === stateFilter;
      const dt = !districtFilter || rec.district === districtFilter;
      const bt = !blockFilter || rec.block === blockFilter;
      return s && st && dt && bt;
    });
  }, [data, globalFilter, stateFilter, districtFilter, blockFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // --------------------------
  // CSV EXPORT
  // --------------------------
  function exportCSV() {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) return;

    const visibleCols = table.getAllLeafColumns().filter((c) => c.getIsVisible() && c.id !== "actions");

    const headers = visibleCols.map((c) =>
      typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
    );

    const csvRows = rows.map((r) =>
      visibleCols
        .map((col) => {
          let v = (r.original as any)[col.id];

          if (col.id === "surveyor_id") v = maskNumber(v);
          if (col.id === "surveyor_pin") v = maskPIN(v);

          if (v === null || v === undefined) return "";
          const s = String(v);
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "surveyors.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  // --------------------------
  // UI
  // --------------------------
  return (
    <div className="w-full">
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-6 w-full">
        <div className="flex justify-between mb-4">
          <button onClick={exportCSV} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            Export
          </button>

          <details className="relative">
            <summary className="px-4 py-2 rounded bg-gray-700 text-white cursor-pointer">
              View Additional Data
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded border p-3 z-50 max-h-64 overflow-auto">
              {table.getAllLeafColumns().map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                  />
                  {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                </label>
              ))}
            </div>
          </details>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            placeholder="Search..."
            className="border px-3 h-10 rounded"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />

          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setDistrictFilter("");
              setBlockFilter("");
            }}
            className="border px-3 h-10 rounded"
          >
            <option value="">All States</option>
            {uniqueStates.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            value={districtFilter}
            disabled={!stateFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setBlockFilter("");
            }}
            className={`border px-3 h-10 rounded ${!stateFilter ? "bg-gray-200" : ""}`}
          >
            <option value="">All Districts</option>
            {uniqueDistricts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <select
            value={blockFilter}
            disabled={!districtFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className={`border px-3 h-10 rounded ${!districtFilter ? "bg-gray-200" : ""}`}
          >
            <option value="">All Blocks</option>
            {uniqueBlocks.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end text-sm text-gray-700 mb-4">
        Showing {table.getFilteredRowModel().rows.length} of {data.length} records
      </div>

      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
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
                {row.getVisibleCells().map((cell) => (
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
          <div className="bg-white w-[550px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Surveyor Details</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <section>
                <h3 className="text-sm font-semibold mb-2">Primary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="text-sm">{safe(selected, "surveyor_name")}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">ID</div>
                    <div className="text-sm">{maskNumber(selected?.surveyor_id)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">PIN</div>
                    <div className="text-sm">{maskPIN(selected?.surveyor_pin)}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">State</div>
                    <div className="text-sm">{safe(selected, "state")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">District</div>
                    <div className="text-sm">{safe(selected, "district")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Block</div>
                    <div className="text-sm">{safe(selected, "block")}</div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Villages</h3>
                {parseVillages(selected.villages).length === 0 ? (
                  <div className="text-sm text-gray-500">No villages listed</div>
                ) : (
                  <div className="border rounded overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border">Village Code</th>
                          <th className="p-2 border">Village Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseVillages(selected.villages).map((v, idx) => (
                          <tr key={idx} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                            <td className="p-2 border">{v.village_code || "—"}</td>
                            <td className="p-2 border">{v.village_name || "—"}</td>
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
  );
}
