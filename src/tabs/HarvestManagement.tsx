;

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useState, useEffect, useMemo } from "react";
import { THEME } from "../utils/theme";

export type HarvestItem = {
  date?: string;
  count?: number;
  production_kg_per_plot?: string | number;
};

export type HarvestingManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  plot_area: string;
  harvesting_details: string;
  harvesting_count: number;
  first_harvest?: boolean;
  // plot_area?: number;
};

const schemaFields: (keyof HarvestingManagementRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "plot_area",
  "harvesting_count",
  "first_harvest",
  "harvesting_details",
];

function mask(value: any) {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  if (s === "") return "—";
  if (s.length <= 4) return "XXXX";
  return "X".repeat(Math.max(0, s.length - 4)) + s.slice(-4);
}

function maskName(value: string) {
  if (!value) return "—";
  const parts = value.split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}

function parseHarvestData(jsonStr: string | undefined): HarvestItem[] {
  if (!jsonStr || typeof jsonStr !== "string") return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it: any) => ({
      date: it?.date ?? "",
      count: it?.count ?? undefined,
      production_kg_per_plot: it?.production_kg_per_plot ?? "",
    }));
  } catch {
    return [];
  }
}

function getStatus(record: HarvestingManagementRecord | null) {
  if (!record) return "Not Filled";

  const items = parseHarvestData(record.harvesting_details);
  const dates = items.map(i => (i.date ?? "").trim()).filter(d => d !== "");

  if (dates.length === 0) return "On-Going";
  return "Completed";
}

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
      <div className="text-xs text-gray-500 uppercase tracking-wider">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

export default function HarvestingManagementTable() {
  const [data, setData] = useState<HarvestingManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HarvestingManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<"all" | "Completed" | "On-Going">("Completed");

  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [blockFilter, setBlockFilter] = useState<string>("");
  const [villageFilter, setVillageFilter] = useState<string>("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<HarvestingManagementRecord>();

  const columns: ColumnDef<HarvestingManagementRecord, any>[] = useMemo(() => {
    const generated: ColumnDef<HarvestingManagementRecord, any>[] = schemaFields.map(field => {
      if (field === "farmer_name") {
  return columnHelper.accessor(field, {
    header: String(field).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    cell: info => maskName(info.getValue()),
  });
}

      if (field === "farmer_mobile" || field === "surveyor_id") {
        return columnHelper.accessor(field, {
          header: String(field).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => mask(info.getValue()),
        });
      }

      if (field === "harvesting_details") {
        return columnHelper.accessor(field, {
          header: "Harvesting Details",
          cell: info => {
            const v = info.getValue();
            if (!v) return "—";
            try {
              const parsed = JSON.parse(String(v));
              if (Array.isArray(parsed)) return `${parsed.length} records`;
            } catch {}
            return "—";
          },
        });
      }

      if (field === "first_harvest") {
        return columnHelper.accessor(field, {
          header: "First Harvest",
          cell: info => (info.getValue() ? "Yes" : "No"),
        });
      }

      return columnHelper.accessor(field, {
        header: String(field).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        cell: info => info.getValue() ?? "—",
      });
    });
    generated.push(
  columnHelper.accessor(row => getTotalProduction(row), {
    id: "total_production",
    header: "Total Production (kg)",
    cell: info => info.getValue(),
    sortingFn: "basic",
  })
);




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
  }, [columnHelper]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/farm-management/harvesting-management");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("harvest fetch error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const s: VisibilityState = {};
    schemaFields.forEach(f => (s[f] = false));
    ["farmer_name", "crop_name_en","district_name", "block_name", "village_name","plot_area", "total_production", "actions"].forEach(
      f => (s[f] = true)
    );
    return s;
  });

  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name).filter(Boolean))).sort(),
    [data]
  );

  function getTotalProduction(record: HarvestingManagementRecord) {
  const list = parseHarvestData(record.harvesting_details);
  return list.reduce(
    (sum, it) => sum + (parseFloat(it.production_kg_per_plot as any) || 0),
    0
  );
}



  const uniqueBlocks = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(r => (!districtFilter ? true : r.district_name === districtFilter))
          .map(r => r.block_name)
          .filter(Boolean)
      )
    ).sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter(r => (!districtFilter ? true : r.district_name === districtFilter))
          .filter(r => (!blockFilter ? true : r.block_name === blockFilter))
          .map(r => r.village_name)
          .filter(Boolean)
      )
    ).sort();
  }, [data, districtFilter, blockFilter]);

  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(r => {
      if (completionFilter !== "all" && getStatus(r) !== completionFilter) return false;
      if (districtFilter && r.district_name !== districtFilter) return false;
      if (blockFilter && r.block_name !== blockFilter) return false;
      if (villageFilter && r.village_name !== villageFilter) return false;

      if (!g) return true;

      const searchable = [
        r.farmer_name,
        r.farmer_mobile,
        r.crop_name_en,
        r.surveyor_name,
        r.surveyor_id,
        r.village_name,
        r.block_name,
        r.district_name,
        String(r.harvesting_count || ""),
        r.harvesting_details || "",
      ]
        .filter(Boolean)
        .map(s => String(s).toLowerCase())
        .join(" ");

      return searchable.includes(g);
    });
  }, [data, completionFilter, districtFilter, blockFilter, villageFilter, globalFilter]);

  /** CSV EXPORT */
  function exportCSV() {
    if (!finalData.length) return;

    const headers = schemaFields.map(h => String(h));
    const rows = finalData.map(row =>
      headers.map(h => {
        let v: any = (row as any)[h];
        if (h === "farmer_name") v = maskName(String(v));
        if (h === "farmer_mobile" || h === "surveyor_id") v = mask(v);
        if (v == null) return "";
        const s = String(v);
        if (s.includes(",") || s.includes('"') || s.includes("\n"))
          return `"${s.replace(/"/g, '""')}"`;
        return s;
      })
    );

    const BOM = "\uFEFF";
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "harvesting_management.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

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
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">
      {/* Top Filters + CSV */}
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6 w-full">
        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Export
          </button>

          <div className="relative inline-block text-left">
            <button
              onClick={() => setShowColumnMenu(prev => !prev)}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              View Additional Data
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 p-3 max-h-72 overflow-y-auto">
                {schemaFields.map(col => (
                  <label key={col} className="flex items-center gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={table.getColumn(String(col))?.getIsVisible() ?? false}
                      onChange={e =>
                        table.getColumn(String(col))?.toggleVisibility(e.target.checked)
                      }
                    />
                    {String(col).replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10"
              placeholder="Search all fields..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10"
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
              className="border rounded px-3 h-10"
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
              className="border rounded px-3 h-10"
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

        {/* Counts */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-3 h-10"
            value={completionFilter}
            onChange={e => setCompletionFilter(e.target.value as any)}
          >
            <option value="all">All Records</option>
            <option value="Completed">Completed</option>
            <option value="On-Going">On-Going</option>
          </select>

          {/* <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
            Completed: {data.filter(r => getStatus(r) === "Completed").length}
          </span>

          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
            On-Going: {data.filter(r => getStatus(r) === "On-Going").length}
          </span> */}

          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length} records
          </span>
        </div>
      </div>

      {/* Table */}
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
              <tr key={row.id} className={`${i % 2 === 0 ? THEME.table.rowEven : THEME.table.rowOdd}`}>
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
      <div className="flex gap-4 items-center mt-4">
        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span className="text-sm">Page {pagination.pageIndex + 1} / {table.getPageCount()}</span>

        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {/* MODAL */}
      {selected && (() => {
        const harvestList = parseHarvestData(selected.harvesting_details);
        const totalProduction = harvestList.reduce(
          (sum, it) => sum + (parseFloat(it.production_kg_per_plot as any) || 0),
          0
        );

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[480px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Harvesting Management Details</h2>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      getStatus(selected) === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {getStatus(selected)}
                  </span>
                </div>

                <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <Section title="Farmer & Location">
                  <Field name="farmer_name" value={maskName(selected.farmer_name)} />
                  <Field name="farmer_mobile" value={mask(selected.farmer_mobile)} />
                  <Field name="village_name" value={selected.village_name} />
                  <Field name="block_name" value={selected.block_name} />
                  <Field name="district_name" value={selected.district_name} />
                </Section>

                <Section title="Crop Details">
                  <Field name="crop_name_en" value={selected.crop_name_en} />
                  <Field name="surveyor_name" value={selected.surveyor_name} />
                  <Field name="surveyor_id" value={mask(selected.surveyor_id)} />
                </Section>

                <Section title="Harvest Summary">
                  <Field name="harvesting_count" value={selected.harvesting_count} />
                  <Field name="first_harvest" value={selected.first_harvest ? "Yes" : "No"} />
                </Section>

                <Section title="Harvesting Details">
                  {harvestList.length === 0 ? (
                    <div className="text-sm text-gray-500">No harvesting records</div>
                  ) : (
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2">Date</th>
                          <th className="border p-2">Count</th>
                          <th className="border p-2">Production (kg)</th>
                        </tr>
                      </thead>

                      <tbody>
                        {harvestList.map((it, i) => (
                          <tr key={i}>
                            <td className="border p-2">{it.date || "—"}</td>
                            <td className="border p-2">{it.count ?? "—"}</td>
                            <td className="border p-2">{it.production_kg_per_plot ?? "—"}</td>
                          </tr>
                        ))}

                        {/* TOTAL ROW */}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="border p-2">Total</td>
                          <td className="border p-2">—</td>
                          <td className="border p-2">{totalProduction}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </Section>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
