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
import { Search, Eye, Tractor, MapPin, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, X } from "lucide-react";

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

function getStatus(record: LandPreparationRecord) {
  const fields = [
    record.fym_date,
    record.fym_quantity,
    record.ploughing_date,
    record.harrow_date,
  ];
  const filledCount = fields.filter(v => v && v.trim() !== "").length;

  if (filledCount === 0) return "not_filled";
  if (filledCount === fields.length) return "filled";
  return "partial";
}

export default function LandPreparationTable() {
  const [data, setData] = useState<LandPreparationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<LandPreparationRecord | null>(null);

  const [completionFilter, setCompletionFilter] = useState<"all" | "filled" | "partial" | "not_filled">("all");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const columnHelper = createColumnHelper<LandPreparationRecord>();

  const columns = [
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Farmer Mobile" }),
    columnHelper.accessor("fym_date", { header: "FYM Date" }),
    columnHelper.accessor("fym_quantity", { header: "FYM Qty" }),
    columnHelper.accessor("ploughing_date", { header: "Ploughing Date" }),
    columnHelper.accessor("harrow_date", { header: "Harrow Date" }),

    columnHelper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStatus(row.original);
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${
            status === "filled"
              ? "bg-green-100 text-green-700"
              : status === "partial"
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
          }`}>
            {status === "filled" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {status === "filled" ? "Complete" : status === "partial" ? "In Progress" : "Not Started"}
          </span>
        );
      },
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm transition-all duration-200"
          onClick={() => setSelectedRecord(row.original)}
        >
          <Eye className="w-4 h-4 inline mr-1.5" />
          View
        </button>
      ),
    }),
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/land_preparations");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: false,
    crop_name_en: false,
    surveyor_name: false,
    village_name: false,
    block_name: false,
    district_name: false,
  });

  const uniqueDistricts = [...new Set(data.map(r => r.district_name))].filter(Boolean).sort();

  const uniqueBlocks = [...new Set(
    data
      .filter(r => (districtFilter ? r.district_name === districtFilter : true))
      .map(r => r.block_name)
  )].filter(Boolean).sort();

  const uniqueVillages = [...new Set(
    data
      .filter(r => (districtFilter ? r.district_name === districtFilter : true))
      .filter(r => (blockFilter ? r.block_name === blockFilter : true))
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

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/30 via-white to-amber-50/20">
        <div className="text-center animate-fade-in">
          <Tractor className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <div className="text-xl font-medium text-foreground">Loading land preparation data...</div>
        </div>
      </div>
    );
  }

  const statusCounts = {
    filled: data.filter(r => getStatus(r) === "filled").length,
    partial: data.filter(r => getStatus(r) === "partial").length,
    notFilled: data.filter(r => getStatus(r) === "not_filled").length,
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50/30 via-white to-amber-50/20">
      <div className="w-full p-6 space-y-6">

        <div className="flex items-start justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Land Preparation Records</h1>
            <p className="text-muted-foreground mt-2 text-base">Monitor and manage land preparation activities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{statusCounts.filled}</span>
            </div>
            <div className="font-semibold">Completed</div>
            <div className="text-xs opacity-80 mt-1">All fields filled</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{statusCounts.partial}</span>
            </div>
            <div className="font-semibold">In Progress</div>
            <div className="text-xs opacity-80 mt-1">Partially completed</div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{statusCounts.notFilled}</span>
            </div>
            <div className="font-semibold">Not Started</div>
            <div className="text-xs opacity-80 mt-1">No data entered</div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-lg p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </label>
              <input
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                placeholder="Search all fields..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                District
              </label>
              <select
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Block</label>
              <select
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Village</label>
              <select
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Status</label>
              <select
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                value={completionFilter}
                onChange={e => setCompletionFilter(e.target.value as any)}
              >
                <option value="all">All Records</option>
                <option value="filled">Completed</option>
                <option value="partial">In Progress</option>
                <option value="not_filled">Not Started</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{finalData.length}</span> of <span className="font-semibold text-foreground">{data.length}</span> records
          </div>
        </div>

        <div className="w-full overflow-auto rounded-2xl border bg-card shadow-lg animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10 border-b-2">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      className="p-4 text-left font-semibold cursor-pointer hover:bg-muted/70 transition-colors duration-200"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <span className="text-primary">↑</span>}
                        {header.column.getIsSorted() === "desc" && <span className="text-primary">↓</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b hover:bg-accent/5 transition-colors duration-200"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/5 transition-all duration-200 font-medium flex items-center gap-2"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm font-medium">
            Page <span className="font-bold">{pagination.pageIndex + 1}</span> / <span className="font-bold">{table.getPageCount()}</span>
          </span>

          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/5 transition-all duration-200 font-medium flex items-center gap-2"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {selectedRecord && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
              <div className="sticky top-0 bg-gradient-primary p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Tractor className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Land Preparation Details</h2>
                    <p className="text-white/80 text-sm">Complete record information</p>
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 flex items-center justify-center"
                  onClick={() => setSelectedRecord(null)}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 100px)" }}>
                {schemaFields.map(key => (
                  <div key={key} className="flex items-center justify-between py-3 border-b">
                    <div className="text-sm font-semibold text-muted-foreground uppercase">{key.replace(/_/g, " ")}</div>
                    <div className="text-sm font-medium text-foreground">{selectedRecord[key] || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
