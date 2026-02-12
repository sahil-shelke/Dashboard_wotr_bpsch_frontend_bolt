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

import { useEffect, useMemo, useState, useRef } from "react";
import { THEME } from "../utils/theme";

const SEASONS = [
  { id: 1, name: "Kharif" },
  { id: 2, name: "Rabi" },
  { id: 3, name: "Summer" },
  { id: 4, name: "Annual" },
];

type SoilTestingRecord = {
  report_id: number;
  farmer_name: string;
  farmer_mobile: string;
  season_id: number;
  season_year: number;
  ph: number;
  ec: number;
  oc: number;
  n: number;
  p: number;
  k: number;
  zn: number;
  fe: number;
  mn: number;
  cu: number;
  village_name: string;
  block_name: string;
  district_name: string;
};

function maskName(v: string): string {
  if (!v) return "—";
  const parts = v.trim().split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}

function maskMobile(v: any): string {
  if (!v) return "—";
  const s = String(v);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

export default function SoilTestingReportTable() {
  const [data, setData] = useState<SoilTestingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SoilTestingRecord | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [editForm, setEditForm] = useState({
    ph: 0,
    ec: 0,
    oc: 0,
    n: 0,
    p: 0,
    k: 0,
    zn: 0,
    fe: 0,
    mn: 0,
    cu: 0,
  });

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columnHelper = createColumnHelper<SoilTestingRecord>();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor("farmer_name", {
        header: "Farmer",
        cell: info => maskName(info.getValue()),
      }),
      columnHelper.accessor("farmer_mobile", {
        header: "Mobile",
        cell: info => maskMobile(info.getValue()),
      }),
      columnHelper.accessor("season_id", {
        header: "Season",
        cell: info => {
          const season = SEASONS.find(s => s.id === info.getValue());
          return season?.name || "—";
        }
      }),
      columnHelper.accessor("season_year", {
        header: "Season Year",
        cell: info => info.getValue() || "—"
      }),
      columnHelper.accessor("district_name", { header: "District" }),
      columnHelper.accessor("block_name", { header: "Block" }),
      columnHelper.accessor("village_name", { header: "Village" }),
      columnHelper.accessor("ph", {
        header: "pH",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("ec", {
        header: "EC",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("oc", {
        header: "OC",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("n", {
        header: "N",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("p", {
        header: "P",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("k", {
        header: "K",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("zn", {
        header: "Zn",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("fe", {
        header: "Fe",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("mn", {
        header: "Mn",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("cu", {
        header: "Cu",
        cell: info => {
          const val = info.getValue();
          return val != null ? val.toFixed(2) : "—";
        },
      }),
      columnHelper.accessor("report_id", { header: "Report ID" }),
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
  }, []);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: true,
    farmer_mobile: false,
    season_id: true,
    season_year: true,
    district_name: true,
    block_name: true,
    village_name: true,
    ph: true,
    ec: true,
    oc: true,
    n: true,
    p: true,
    k: true,
    zn: false,
    fe: false,
    mn: false,
    cu: false,
    report_id: false,
    actions: true,
  });

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/soil_moisture_report/dashboard/get_all_records", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const uniqueDistricts = useMemo(
    () => [...new Set(data.map(d => d.district_name))].filter(Boolean).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return [...new Set(
      data
        .filter(r => !districtFilter || r.district_name === districtFilter)
        .map(r => r.block_name)
    )].filter(Boolean).sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return [...new Set(
      data
        .filter(r => !districtFilter || r.district_name === districtFilter)
        .filter(r => !blockFilter || r.block_name === blockFilter)
        .map(r => r.village_name)
    )].filter(Boolean).sort();
  }, [data, districtFilter, blockFilter]);

  const uniqueSeasons = useMemo(() => {
    return [...new Set(data.map(d => d.season_id))].filter(Boolean).sort();
  }, [data]);

  const uniqueYears = useMemo(() => {
    return [...new Set(data.map(d => d.season_year))].filter(Boolean).sort((a, b) => b - a);
  }, [data]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const finalData = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();

    return data.filter(r => {
      if (districtFilter && r.district_name !== districtFilter) return false;
      if (blockFilter && r.block_name !== blockFilter) return false;
      if (villageFilter && r.village_name !== villageFilter) return false;
      if (seasonFilter && r.season_id !== Number(seasonFilter)) return false;
      if (yearFilter && r.season_year !== Number(yearFilter)) return false;

      return JSON.stringify(r).toLowerCase().includes(q);
    });
  }, [data, globalFilter, districtFilter, blockFilter, villageFilter, seasonFilter, yearFilter]);

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

  async function handleExport() {
    try {
      const token = localStorage.getItem("authToken");
      const url = `/api/soil_moisture_report/dashboard/get_export_data`;

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `soil_testing_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert("Failed to export data");
    }
  }

  async function handleUpload() {
    if (!uploadFile) {
      alert("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/soil_moisture_report/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");

      alert("File uploaded successfully");
      setShowUploadModal(false);
      setUploadFile(null);

      const dataRes = await fetch("/api/soil_moisture_report/dashboard/get_all_records", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const json = await dataRes.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }

  async function saveRecord(reportId: number) {
    if (!reportId) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/soil_moisture_report/dashboard/update/${reportId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      const updatedRecord = {
        ...data.find(r => r.report_id === reportId)!,
        ...editForm,
      };

      if (selected?.report_id === reportId) {
        setSelected(updatedRecord);
      }

      setData(prev =>
        prev.map(item =>
          item.report_id === reportId ? updatedRecord : item
        )
      );

      setEditingId(null);
      alert("Successfully updated soil testing report");
    } catch (error) {
      alert("Failed to update soil testing report");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload File
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export
            </button>
          </div>

          <details className="relative">
            <summary className="px-4 py-2 bg-gray-700 text-white rounded cursor-pointer">
              View Additional Data
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg p-3 max-h-72 overflow-auto z-50">
              {table.getAllLeafColumns().map(col => (
                <label key={col.id} className="flex items-center gap-2 mb-2 text-sm">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              {uniqueDistricts.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10"
              disabled={!districtFilter}
              value={blockFilter}
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
              disabled={!blockFilter}
              value={villageFilter}
              onChange={e => setVillageFilter(e.target.value)}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Season</label>
            <select
              className="border rounded px-3 h-10"
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
            >
              <option value="">All Seasons</option>
              {uniqueSeasons.map(s => {
                const season = SEASONS.find(season => season.id === s);
                return (
                  <option key={s} value={s}>
                    {season?.name || s}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Year</label>
            <select
              className="border rounded px-3 h-10"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
            >
              <option value="">All Years</option>
              {uniqueYears.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end text-sm text-gray-700 mt-4">
          Showing {finalData.length} records
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
            {table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={`${idx % 2 === 0 ? THEME.table.rowEven : THEME.table.rowOdd} ${THEME.table.rowHover}`}
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

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white w-[900px] max-h-[95vh] rounded-lg shadow-xl p-5 overflow-y-auto my-8">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-3 border-b">
              <h2 className="text-lg font-semibold">Soil Testing Report Details</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => {
                  setSelected(null);
                  setEditingId(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Farmer & Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field name="Farmer Name" value={maskName(selected.farmer_name)} />
                  <Field name="Mobile" value={maskMobile(selected.farmer_mobile)} />
                  <Field name="Village" value={selected.village_name} />
                  <Field name="Block" value={selected.block_name} />
                  <Field name="District" value={selected.district_name} />
                  <Field name="Season" value={SEASONS.find(s => s.id === selected.season_id)?.name || "—"} />
                  <Field name="Season Year" value={selected.season_year} />
                  <Field name="Report ID" value={selected.report_id} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Soil Parameters</h3>
                {editingId === selected.report_id ? (
                  <div className="grid grid-cols-2 gap-3">
                    {["ph", "ec", "oc", "n", "p", "k", "zn", "fe", "mn", "cu"].map(param => (
                      <div key={param} className="flex flex-col">
                        <label className="text-xs uppercase text-gray-500">{param}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm[param as keyof typeof editForm]}
                          onChange={e => setEditForm({ ...editForm, [param]: parseFloat(e.target.value) || 0 })}
                          className="border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Field name="pH" value={selected.ph?.toFixed(2)} />
                    <Field name="EC" value={selected.ec?.toFixed(2)} />
                    <Field name="OC" value={selected.oc?.toFixed(2)} />
                    <Field name="N" value={selected.n?.toFixed(2)} />
                    <Field name="P" value={selected.p?.toFixed(2)} />
                    <Field name="K" value={selected.k?.toFixed(2)} />
                    <Field name="Zn" value={selected.zn?.toFixed(2)} />
                    <Field name="Fe" value={selected.fe?.toFixed(2)} />
                    <Field name="Mn" value={selected.mn?.toFixed(2)} />
                    <Field name="Cu" value={selected.cu?.toFixed(2)} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6">
                {editingId === selected.report_id ? (
                  <>
                    <button
                      onClick={() => saveRecord(selected.report_id)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditForm({
                        ph: selected.ph ?? 0,
                        ec: selected.ec ?? 0,
                        oc: selected.oc ?? 0,
                        n: selected.n ?? 0,
                        p: selected.p ?? 0,
                        k: selected.k ?? 0,
                        zn: selected.zn ?? 0,
                        fe: selected.fe ?? 0,
                        mn: selected.mn ?? 0,
                        cu: selected.cu ?? 0,
                      });
                      setEditingId(selected.report_id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[450px] rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Upload Soil Testing Report</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Select Excel or CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="border rounded px-3 py-2 text-sm"
                />
                {uploadFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {uploadFile.name}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
