

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

export type SprayItem = {
  date?: string;
  name?: string;
  unit?: string;
  quantity?: string | number;
};

export type PestManagementRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;

  surveyor_name: string;
  surveyor_id: string;

  village_name: string;
  block_name: string;
  district_name: string;
  plot_area: string;
  first_pest_date: string;

  light_trap: string;
  light_trap_count: string;
  light_trap_date: string;

  pheromone_trap: string;
  pheromone_trap_count: string;
  pheromone_trap_date: string;

  sticky_trap: string;
  sticky_trap_count: string;
  sticky_trap_date: string;

  biopesticide_spray: string;
  fungicide_spray: string;
  insecticide_spray: string;
};

const schemaFields: (keyof PestManagementRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "plot_area",
  "first_pest_date",
  "light_trap",
  "light_trap_count",
  "light_trap_date",
  "pheromone_trap",
  "pheromone_trap_count",
  "pheromone_trap_date",
  "sticky_trap",
  "sticky_trap_count",
  "sticky_trap_date",
  "biopesticide_spray",
  "fungicide_spray",
  "insecticide_spray",
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

function parseSprayData(jsonStr: string | undefined): SprayItem[] {
  if (!jsonStr || typeof jsonStr !== "string") return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it: any) => ({
      date: it?.date ?? "",
      name: it?.name ?? "",
      unit: it?.unit ?? "",
      quantity: it?.quantity ?? "",
    }));
  } catch {
    return [];
  }
}

function getStatus(record: PestManagementRecord | null) {
  if (!record) return "not_filled";



  const bio = parseSprayData(record.biopesticide_spray);
  const fung = parseSprayData(record.fungicide_spray);
  const ins = parseSprayData(record.insecticide_spray);

  const sprayDates = [
    ...bio.map(i => i.date ?? ""),
    ...fung.map(i => i.date ?? ""),
    ...ins.map(i => i.date ?? ""),
  ];

  const allDates = [...sprayDates];
  const total = allDates.length;
  const filledCount = allDates.filter(d => d && String(d).trim() !== "").length;

  if (total === 0 || filledCount === 0) return "On-Going";
  if (total >= 0) return "Completed";
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

export default function PestManagementTable() {
  const [data, setData] = useState<PestManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PestManagementRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<"all" | "Completed" | "On-Going">("Completed");

  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [blockFilter, setBlockFilter] = useState<string>("");
  const [villageFilter, setVillageFilter] = useState<string>("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<PestManagementRecord>();

  const columns: ColumnDef<PestManagementRecord, any>[] = useMemo(() => {
    
    const generated: ColumnDef<PestManagementRecord, any>[] = schemaFields.map(field => {
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

      if (field === "biopesticide_spray" || field === "fungicide_spray" || field === "insecticide_spray") {
        return columnHelper.accessor(field, {
          header: String(field).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => {
            const v = info.getValue();
            if (!v) return "—";
            try {
              const parsed = JSON.parse(String(v));
              if (Array.isArray(parsed)) return `${parsed.length} items`;
              return "—";
            } catch {
              return "—";
            }
          },
        });
      }

      return columnHelper.accessor(field, {
        header: String(field).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        cell: info => {
          const v = info.getValue();
          return v === undefined || v === null || v === "" ? "—" : String(v);
        },
      });
    });
   generated.push(
  columnHelper.accessor(row => getSprayCount(row), {
    id: "spray_count",
    header: "Spray Count",
    cell: info => info.getValue(),
    sortingFn: "basic", // optional: react-table will handle it anyway
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnHelper]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/farm-management/pest-management");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("pest fetch error:", err);
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
    [
      "farmer_name",
      "crop_name_en",
      "district_name",
      "block_name",
      "village_name",
      "plot_area"

    ].forEach(f => (s[f] = true));
    return s;
  });

  const uniqueDistricts = useMemo(
    () => Array.from(new Set(data.map(r => r.district_name).filter(Boolean))).sort(),
    [data]
  );

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

  function getSprayCount(record: PestManagementRecord) {
  const bio = parseSprayData(record.biopesticide_spray);
  const fung = parseSprayData(record.fungicide_spray);
  const ins = parseSprayData(record.insecticide_spray);

  return bio.length + fung.length + ins.length;
}
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
        r.first_pest_date,
        r.light_trap,
        r.pheromone_trap,
        r.sticky_trap_date,
      ]
        .filter(Boolean)
        .map(s => String(s).toLowerCase())
        .join(" ");

      const sprays = [r.biopesticide_spray, r.fungicide_spray, r.insecticide_spray].filter(Boolean).join(" ").toLowerCase();

      return searchable.includes(g) || sprays.includes(g);
    });
  }, [data, completionFilter, districtFilter, blockFilter, villageFilter, globalFilter]);

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

  function exportCSV() {
    if (!finalData.length) return;
    const headers = schemaFields;
    const rows = finalData.map(row =>
      headers.map(h => {
        let v: any = row[h];
        if (h === "farmer_name") v = maskName(String(v));
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
    a.download = "pest_management.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-6 w-full">
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
              {uniqueDistricts.map(d => <option key={d}>{d}</option>)}
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
              {uniqueBlocks.map(b => <option key={b}>{b}</option>)}
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
              {uniqueVillages.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

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

          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            On-Going: {data.filter(r => getStatus(r) === "On-Going").length}
          </span> */}

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

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[450px] max-h-[80vh] rounded-xl shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Pest Management Details</h2>
              <button className="text-2xl" onClick={() => setSelected(null)}>×</button>
            </div>

            <div className="space-y-4">
              <Section title="Farmer & Location">
                {["farmer_name", "farmer_mobile", "village_name", "block_name", "district_name"].map(k => (
                  <Field key={k} name={k} value={
  k === "farmer_name"
    ? maskName(selected?.farmer_name)
    : k === "farmer_mobile"
    ? mask(selected?.farmer_mobile)
    : selected ? (selected as any)[k] : "—"
}
 />
                ))}
              </Section>

              <Section title="Traps">
                {[
                  "first_pest_date",
                  "light_trap",
                  "light_trap_count",
                  "light_trap_date",
                  "pheromone_trap",
                  "pheromone_trap_count",
                  "pheromone_trap_date",
                  "sticky_trap",
                  "sticky_trap_count",
                  "sticky_trap_date",
                ].map(k => (
                  <Field key={k} name={k} value={selected ? (selected as any)[k] : "—"} />
                ))}
              </Section>

              <SpraySection title="Biopesticide Spray" data={parseSprayData(selected?.biopesticide_spray)} />
              <SpraySection title="Fungicide Spray" data={parseSprayData(selected?.fungicide_spray)} />
              <SpraySection title="Insecticide Spray" data={parseSprayData(selected?.insecticide_spray)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpraySection({ title, data }: { title: string; data: SprayItem[] }) {
  return (
    <Section title={title}>
      {(!data || data.length === 0) ? (
        <div className="text-sm text-gray-500">No records found</div>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Unit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="border p-2">{item.date || "—"}</td>
                <td className="border p-2">{item.name || "—"}</td>
                <td className="border p-2">{item.quantity ?? "—"}</td>
                <td className="border p-2">{item.unit || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}
