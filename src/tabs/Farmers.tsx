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
import { Search, Eye, User, Phone, MapPin, ChevronLeft, ChevronRight, Columns3, X } from "lucide-react";

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

export default function FarmerRecordsTable() {
  const [data, setData] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FarmerRecord | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columnHelper = createColumnHelper<FarmerRecord>();

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
        return <span className="px-2 py-1 bg-accent/20 text-accent font-semibold rounded-full text-xs">{arr.length}</span>;
      },
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm transition-all duration-200"
          onClick={() => setSelected(row.original)}
        >
          <Eye className="w-4 h-4 inline mr-1.5" />
          View
        </button>
      ),
    }),
  ];

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_id: false,
    farmer_category: false,
    block_code: false,
    district_code: false,
    village_code: false,
  });

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

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50/30 via-white to-amber-50/20">
        <div className="text-center animate-fade-in">
          <User className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <div className="text-xl font-medium text-foreground">Loading farmers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50/30 via-white to-amber-50/20">
      <div className="w-full max-w-none p-6 space-y-6">

        <div className="flex items-start justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Farmer Records</h1>
            <p className="text-muted-foreground mt-2 text-base">Manage and view farmer information across all regions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-card border rounded-lg shadow-sm">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-lg font-bold text-foreground ml-2">{data.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-lg p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </label>
              <input
                placeholder="Search all fields..."
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                District
              </label>
              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setBlockFilter("");
                  setVillageFilter("");
                }}
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              >
                <option value="">All Districts</option>
                {uniqueDistricts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Block</label>
              <select
                value={blockFilter}
                onChange={(e) => {
                  setBlockFilter(e.target.value);
                  setVillageFilter("");
                }}
                disabled={!districtFilter}
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Blocks</option>
                {uniqueBlocks.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Village</label>
              <select
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                disabled={!blockFilter}
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Villages</option>
                {uniqueVillages.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <details className="group">
            <summary className="px-4 py-2 bg-card border rounded-lg cursor-pointer hover:shadow-md transition-all duration-200 flex items-center gap-2">
              <Columns3 className="w-4 h-4" />
              <span className="font-medium text-sm">Toggle Columns</span>
            </summary>
            <div className="mt-2 p-4 bg-card border rounded-lg shadow-lg absolute z-10">
              <div className="grid grid-cols-2 gap-2">
                {table.getAllLeafColumns().map((col) => (
                  <label key={col.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent/5 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{col.id}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>

          <span className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{table.getFilteredRowModel().rows.length}</span> of <span className="font-semibold text-foreground">{data.length}</span> farmers
          </span>
        </div>

        <div className="w-full overflow-auto rounded-2xl border bg-card shadow-lg animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10 border-b-2">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4 text-left cursor-pointer font-semibold text-foreground hover:bg-muted/70 transition-colors duration-200"
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
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 text-foreground">
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

          <span className="text-sm font-medium text-foreground">
            Page <span className="font-bold">{pagination.pageIndex + 1}</span> of <span className="font-bold">{table.getPageCount()}</span>
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

        {selected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
              <div className="sticky top-0 bg-gradient-primary p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Farmer Details</h2>
                    <p className="text-white/80 text-sm">Complete farmer information</p>
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200 flex items-center justify-center"
                  onClick={() => setSelected(null)}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 100px)" }}>

                <section className="bg-muted/30 rounded-xl p-5 border">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
                    <User className="w-5 h-5 text-primary" />
                    Primary Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Farmer ID</div>
                      <div className="text-sm font-medium text-foreground">{safeVal(selected, "farmer_id")}</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Name</div>
                      <div className="text-sm font-medium text-foreground">{safeVal(selected, "farmer_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Mobile</div>
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {safeVal(selected, "farmer_mobile")}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Surveyor ID</div>
                      <div className="text-sm font-medium text-foreground">{safeVal(selected, "surveyor_id")}</div>
                    </div>
                  </div>
                </section>

                <section className="bg-muted/30 rounded-xl p-5 border">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    Location Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Village</div>
                      <div className="text-sm font-medium text-foreground">{safeVal(selected, "village_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Block</div>
                      <div className="text-sm font-medium text-foreground">{safeVal(selected, "block_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">District</div>
                      <div className="text-sm font-medium text-foreground">{safeVal(selected, "district_name")}</div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Category</div>
                      <div className="text-sm font-medium text-foreground">{safeVal(selected, "farmer_category")}</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-foreground">
                    <span className="w-5 h-5 flex items-center justify-center bg-accent/20 text-accent rounded">
                      {parseCropRegs(selected?.crop_registrations).length}
                    </span>
                    Crop Registrations
                  </h3>

                  {parseCropRegs(selected?.crop_registrations).length === 0 ? (
                    <div className="text-sm text-muted-foreground bg-muted/30 p-8 rounded-xl text-center border">
                      No crop registrations found
                    </div>
                  ) : (
                    <div className="overflow-auto border rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3 border-b text-left font-semibold">Crop ID</th>
                            <th className="p-3 border-b text-left font-semibold">Plot Area</th>
                            <th className="p-3 border-b text-left font-semibold">Season</th>
                            <th className="p-3 border-b text-left font-semibold">Year</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseCropRegs(selected?.crop_registrations).map((c, idx) => (
                            <tr key={idx} className="hover:bg-accent/5 transition-colors">
                              <td className="p-3 border-b">{c.crop_id || "—"}</td>
                              <td className="p-3 border-b">{c.plot_area || "—"}</td>
                              <td className="p-3 border-b">{c.season || "—"}</td>
                              <td className="p-3 border-b">{c.year || "—"}</td>
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
