

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";

import { useState, useEffect, useMemo } from "react";
import { THEME } from "../utils/theme";

export type LandPreparationRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;
  fym_date: string;
  fym_quantity: string;
  ploughing_date: string;
  harrow_date: string;
};

const schemaFields: (keyof LandPreparationRecord)[] = [
  "farmer_name",
  "farmer_mobile",
  "crop_name_en",
  "surveyor_name",
  "surveyor_id",
  "village_name",
  "block_name",
  "district_name",
  "fym_date",
  "fym_quantity",
  "ploughing_date",
  "harrow_date",
];

// -----------------------------
// MASK FUNCTION
// -----------------------------
function mask(value: string) {
  if (!value) return "—";
  const s = String(value);
  return "X".repeat(Math.max(0, s.length - 4)) + s.slice(-4);
}

// -----------------------------
// STATUS
// -----------------------------
function getStatus(record: LandPreparationRecord) {
  const fields = [
    record.ploughing_date,
    record.harrow_date,
  ];

  const filledCount = fields.filter(v => v && v.trim() !== "").length;

  if (filledCount === 0) return "On-going";
  if (filledCount >= fields.length) return "Completed";
}

export default function LandPreparationTable() {
  const [data, setData] = useState<LandPreparationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LandPreparationRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<"all" | "Completed" | "On-going">("Completed");
  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnHelper = createColumnHelper<LandPreparationRecord>();

  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),

    // MASKED IN UI
    columnHelper.accessor("farmer_mobile", {
      header: "Farmer Mobile",
      cell: ({ row }) => mask(row.original.farmer_mobile),
    }),

    columnHelper.accessor("crop_name_en", { header: "Crop Name" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),

    // MASKED IN UI
    columnHelper.accessor("surveyor_id", {
      header: "Surveyor ID",
      cell: ({ row }) => mask(row.original.surveyor_id),
    }),

    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("fym_date", { header: "FYM Date" }),
    columnHelper.accessor("fym_quantity", { header: "FYM Quantity" }),
    columnHelper.accessor("ploughing_date", { header: "Ploughing Date" }),
    columnHelper.accessor("harrow_date", { header: "Harrow Date" }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button className={THEME.buttons.primary} onClick={() => setSelectedRecord(row.original)}>
          View
        </button>
      ),
    }),
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/farm-management/land_preparations");
        const json = await res.json();
        setData(json);
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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: true,
    farmer_mobile: true,
    crop_name_en: true,
    surveyor_name: true,
    surveyor_id: true,
    village_name: true,
    block_name: true,
    district_name: true,
    fym_date: false,
    fym_quantity: false,
    ploughing_date: true,
    harrow_date: true,
  });

  const uniqueDistricts = [...new Set(data.map(r => r.district_name))].filter(Boolean).sort();

  const uniqueBlocks = [...new Set(
    data.filter(r => !districtFilter || r.district_name === districtFilter)
      .map(r => r.block_name)
  )].filter(Boolean).sort();

  const uniqueVillages = [...new Set(
    data
      .filter(r => !districtFilter || r.district_name === districtFilter)
      .filter(r => !blockFilter || r.block_name === blockFilter)
      .map(r => r.village_name)
  )].filter(Boolean).sort();

  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(record => {
      if (completionFilter !== "all" && getStatus(record) !== completionFilter) return false;
      if (districtFilter && record.district_name !== districtFilter) return false;
      if (blockFilter && record.block_name !== blockFilter) return false;
      if (villageFilter && record.village_name !== villageFilter) return false;
      if (g && !JSON.stringify(record).toLowerCase().includes(g)) return false;
      return true;
    });
  }, [data, completionFilter, districtFilter, blockFilter, villageFilter, globalFilter]);

  const table = useReactTable({
    data: finalData,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // -----------------------------
  // CSV EXPORT WITH MASKING
  // -----------------------------
  function exportCSV() {
    if (!finalData.length) return;

    const headers = schemaFields;

    const rows = finalData.map(row =>
      headers.map(h => {
        let v = row[h];

        if (h === "farmer_mobile") v = mask(v);
        if (h === "surveyor_id") v = mask(v);

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
    a.download = "land_preparation.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">

      {/* FILTER PANEL */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-6 w-full">

        <div className="flex justify-between mb-4">
          <button onClick={exportCSV} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            Export CSV
          </button>

          <div className="relative inline-block text-left">
            <button
              onClick={() => setShowColumnMenu(prev => !prev)}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-200 z-50 p-3 max-h-72 overflow-y-auto">
                {schemaFields.map(col => (
                  <label key={col} className="flex items-center gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={columnVisibility[col] ?? true}
                      onChange={e =>
                        table.getColumn(col)?.toggleVisibility(e.target.checked)
                      }
                    />
                    {col.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search & filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10"
              placeholder="Search..."
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

        {/* Status + Counter */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="border rounded px-3 h-10"
            value={completionFilter}
            onChange={e => setCompletionFilter(e.target.value as any)}
          >
            <option value="all">All Records</option>
            <option value="Completed">Completed</option>
            <option value="On-going">On-going</option>
          </select>

          {/* <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
            Completed: {data.filter(r => getStatus(r) === "Completed").length}
          </span>

          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            On-going: {data.filter(r => getStatus(r) === "On-going").length}
          </span> */}


          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length} records
          </span>
        </div>
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

      {/* PAGINATION */}
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

      {/* MODAL with MASKING */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[450px] max-h-[80vh] rounded-xl shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Land Preparation Details</h2>
              <button className="text-2xl" onClick={() => setSelectedRecord(null)}>×</button>
            </div>

            <div className="space-y-4">
              {schemaFields.map(key => {
                let value: any = selectedRecord[key];

                if (key === "farmer_mobile") value = mask(value);
                if (key === "surveyor_id") value = mask(value);

                return (
                  <div key={key} className="border-b pb-2">
                    <div className="text-xs uppercase text-gray-600">{key.replace(/_/g, " ")}</div>
                    <div className="text-sm">{value || "—"}</div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
