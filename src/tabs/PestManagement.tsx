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

const SEASONS = [
  { id: 1, name: "Kharif" },
  { id: 2, name: "Rabi" },
  { id: 3, name: "Summer" },
  { id: 4, name: "Annual" },
];

export type TrapApplication = {
  trap_application_id?: number;
  trap_name: string;
  trap_count: number;
  trap_application_date: string;
};

export type ControlApplication = {
  control_application_id: number;
  pesticide_type: string;
  pesticide_name: string;
  pesticide_quantity: number;
  unit: string;
  pesticide_application_date: string;
};

export type PestManagementRecord = {
  crop_registration_id: string;
  farmer_name: string;
  farmer_mobile: string;
  crop_name: string;
  plot_area: number | null;
  season: string | null;
  season_year: string | null;
  surveyor_name: string;
  surveyor_id: number;
  village_name: string;
  block_name: string;
  district_name: string;
  pest_trap_applications: string;
  pest_control_applications: string;
};

const schemaFields: (keyof PestManagementRecord)[] = [
  "farmer_name",
  "crop_name",
  "plot_area",
  "season",
  "season_year",
  "district_name",
  "block_name",
  "village_name",
  "crop_registration_id",
  "farmer_mobile",
  "surveyor_name",
  "surveyor_id",
];

function mask(value: any) {
  if (!value) return "—";
  const s = String(value);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function maskName(value: string) {
  if (!value) return "—";
  const parts = value.split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}

function getApplicationCount(r: PestManagementRecord) {
  try {
    const traps: TrapApplication[] = JSON.parse(r.pest_trap_applications || "[]");
    const controls: ControlApplication[] = JSON.parse(r.pest_control_applications || "[]");
    return traps.length + controls.length;
  } catch {
    return 0;
  }
}

function getTotalPesticide(r: PestManagementRecord) {
  try {
    const controls: ControlApplication[] = JSON.parse(r.pest_control_applications || "[]");
    return controls.reduce((sum, c) => {
      const quantity = c.pesticide_quantity || 0;
      const unit = (c.unit || "").toLowerCase();
      const quantityInKg = unit === "gm" || unit === "g" ? quantity / 1000 : quantity;
      return sum + quantityInKg;
    }, 0);
  } catch {
    return 0;
  }
}

function getStatus(r: PestManagementRecord) {
  return getApplicationCount(r) > 0 ? "completed" : "ongoing";
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">
        {name.replace(/_/g, " ")}
      </div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

export default function PestManagementTable() {
  const [data, setData] = useState<PestManagementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PestManagementRecord | null>(null);
  const [editingTraps, setEditingTraps] = useState<TrapApplication[]>([]);
  const [editingControls, setEditingControls] = useState<ControlApplication[]>([]);
  const [isEditingTraps, setIsEditingTraps] = useState(false);
  const [isEditingControls, setIsEditingControls] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [completionFilter, setCompletionFilter] =
    useState<"all" | "completed" | "ongoing">("completed");

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSeasonId, setExportSeasonId] = useState(1);
  const [exportSeasonYear, setExportSeasonYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const columnHelper = createColumnHelper<PestManagementRecord>();

  const columns = useMemo<ColumnDef<PestManagementRecord, any>[]>(() => {
    const generated: ColumnDef<PestManagementRecord, any>[] = schemaFields.map(field => {
      if (field === "farmer_name") {
        return columnHelper.accessor(field, {
          header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => maskName(info.getValue()),
        });
      }

      if (field === "farmer_mobile" || field === "surveyor_id") {
        return columnHelper.accessor(field, {
          header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          cell: info => mask(info.getValue()),
        });
      }

      return columnHelper.accessor(field, {
        header: field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        cell: info => {
          const v = info.getValue();
          if (v === null || v === undefined) return "—";
          return String(v);
        },
      });
    });

    generated.push(
      columnHelper.accessor(row => getApplicationCount(row), {
        id: "application_count",
        header: "Application Count",
        enableSorting: true,
        sortingFn: "basic",
        cell: info => info.getValue(),
      })
    );

    generated.push(
      columnHelper.accessor(row => getTotalPesticide(row), {
        id: "total_pesticide",
        header: "Total Pesticide (kg)",
        enableSorting: true,
        sortingFn: "basic",
        cell: info => info.getValue().toFixed(2),
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
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/pest_management/dashboard/get_all_records", {
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

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const v: VisibilityState = {};
    schemaFields.forEach(f => (v[f] = false));

    v["farmer_name"] = true;
    v["crop_name"] = true;
    v["plot_area"] = true;
    v["season"] = true;
    v["season_year"] = true;
    v["district_name"] = true;
    v["block_name"] = true;
    v["village_name"] = true;
    v["application_count"] = true;
    v["total_pesticide"] = true;

    return v;
  });

  const uniqueDistricts = useMemo(
    () => [...new Set(data.map(r => r.district_name).filter(Boolean))].sort(),
    [data]
  );

  const uniqueBlocks = useMemo(
    () =>
      [...new Set(
        data
          .filter(r => !districtFilter || r.district_name === districtFilter)
          .map(r => r.block_name)
          .filter(Boolean)
      )].sort(),
    [data, districtFilter]
  );

  const uniqueVillages = useMemo(
    () =>
      [...new Set(
        data
          .filter(r => !districtFilter || r.district_name === districtFilter)
          .filter(r => !blockFilter || r.block_name === blockFilter)
          .map(r => r.village_name)
          .filter(Boolean)
      )].sort(),
    [data, districtFilter, blockFilter]
  );

  const finalData = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();

    return data.filter(r => {
      if (completionFilter !== "all" && getStatus(r) !== completionFilter) return false;
      if (districtFilter && r.district_name !== districtFilter) return false;
      if (blockFilter && r.block_name !== blockFilter) return false;
      if (villageFilter && r.village_name !== villageFilter) return false;
      if (g && !JSON.stringify(r).toLowerCase().includes(g)) return false;
      return true;
    });
  }, [
    data,
    globalFilter,
    completionFilter,
    districtFilter,
    blockFilter,
    villageFilter,
  ]);

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

  function exportCSV() {
    setShowExportModal(true);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `/api/pest_management/dashboard/get_export_data?season_id=${exportSeasonId}&season_year=${exportSeasonYear}`;

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Export failed");

      const exportData = await res.json();

      const trapData = exportData.pest_trap_applications || [];
      const controlData = exportData.pest_control_applications || [];

      if (trapData.length === 0 && controlData.length === 0) {
        alert("No data available for export");
        return;
      }

      if (trapData.length > 0) {
        const trapHeaders = Object.keys(trapData[0]);
        const trapRows = trapData.map((row: any) =>
          trapHeaders.map(h => {
            const v = row[h];
            if (v == null) return "";
            const s = String(v);
            if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
        );

        const trapCsv = [trapHeaders.join(","), ...trapRows.map(r => r.join(","))].join("\n");
        const BOM = "\uFEFF";
        const trapBlob = new Blob([BOM + trapCsv], {
          type: "text/csv;charset=utf-8;",
        });

        const trapUrl = URL.createObjectURL(trapBlob);
        const trapLink = document.createElement("a");
        trapLink.href = trapUrl;
        trapLink.download = `pest_trap_application_${SEASONS.find(s => s.id === exportSeasonId)?.name}_${exportSeasonYear}.csv`;
        trapLink.click();
        URL.revokeObjectURL(trapUrl);
      }

      if (controlData.length > 0) {
        const controlHeaders = Object.keys(controlData[0]);
        const controlRows = controlData.map((row: any) =>
          controlHeaders.map(h => {
            const v = row[h];
            if (v == null) return "";
            const s = String(v);
            if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
        );

        const controlCsv = [controlHeaders.join(","), ...controlRows.map(r => r.join(","))].join("\n");
        const BOM = "\uFEFF";
        const controlBlob = new Blob([BOM + controlCsv], {
          type: "text/csv;charset=utf-8;",
        });

        const controlUrl = URL.createObjectURL(controlBlob);
        const controlLink = document.createElement("a");
        controlLink.href = controlUrl;
        controlLink.download = `pest_control_application_${SEASONS.find(s => s.id === exportSeasonId)?.name}_${exportSeasonYear}.csv`;
        controlLink.click();
        URL.revokeObjectURL(controlUrl);
      }

      setShowExportModal(false);
    } catch (error) {
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }

  async function saveTraps() {
    if (!selected || editingTraps.length === 0) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      for (const trap of editingTraps) {
        if (!trap.trap_application_id) continue;

        const response = await fetch(
          `/api/pest_management/dashboard/update/trap/${trap.trap_application_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              crop_registration_id: selected.crop_registration_id,
              traps: [{
                trap_name: trap.trap_name,
                trap_count: trap.trap_count,
                trap_application_date: trap.trap_application_date,
              }],
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to update");
      }

      const updatedSelected = {
        ...selected,
        pest_trap_applications: JSON.stringify(editingTraps),
      };
      setSelected(updatedSelected);

      setData(prev =>
        prev.map(item =>
          item.crop_registration_id === selected.crop_registration_id
            ? updatedSelected
            : item
        )
      );

      setIsEditingTraps(false);
      alert("Successfully updated trap applications");
    } catch (error) {
      alert("Failed to update trap applications");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveControls() {
    if (!selected || editingControls.length === 0) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      for (const control of editingControls) {
        const response = await fetch(
          `/api/pest_management/dashboard/update/control/${control.control_application_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              crop_registration_id: selected.crop_registration_id,
              applications: [{
                pesticide_type: control.pesticide_type,
                pesticide_name: control.pesticide_name,
                pesticide_quantity: control.pesticide_quantity,
                unit: control.unit,
                pesticide_application_date: control.pesticide_application_date,
              }],
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to update");
      }

      const updatedSelected = {
        ...selected,
        pest_control_applications: JSON.stringify(editingControls),
      };
      setSelected(updatedSelected);

      setData(prev =>
        prev.map(item =>
          item.crop_registration_id === selected.crop_registration_id
            ? updatedSelected
            : item
        )
      );

      setIsEditingControls(false);
      alert("Successfully updated control applications");
    } catch (error) {
      alert("Failed to update control applications");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">

      <div className="bg-white border rounded-lg p-4 mb-6">

        <div className="flex justify-between mb-4">
          <button onClick={exportCSV} className="px-4 py-2 rounded bg-green-600 text-white">
            Export
          </button>

          <div className="relative">
            <button
              className="px-4 py-2 rounded bg-gray-700 text-white"
              onClick={() => setShowColumnMenu(p => !p)}
            >
              View Additional Data
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-60 p-3 z-50 max-h-72 overflow-y-auto">
                {[...schemaFields, "application_count", "total_pesticide"].map(col => (
                  <label key={col} className="flex gap-2 text-sm mb-2">
                    <input
                      type="checkbox"
                      checked={table.getColumn(col)?.getIsVisible() ?? false}
                      onChange={e =>
                        table.getColumn(col)?.toggleVisibility(e.target.checked)
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

          <div>
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded h-10 px-3 w-full"
              placeholder="Search..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded h-10 px-3 w-full"
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueDistricts.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded h-10 px-3 w-full"
              disabled={!districtFilter}
              value={blockFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All</option>
              {uniqueBlocks.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded h-10 px-3 w-full"
              disabled={!blockFilter}
              value={villageFilter}
              onChange={e => setVillageFilter(e.target.value)}
            >
              <option value="">All</option>
              {uniqueVillages.map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">

          <select
            className="border rounded px-3 h-10"
            value={completionFilter}
            onChange={e => setCompletionFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="ongoing">On-going</option>
          </select>

          <span className="ml-auto text-sm text-gray-600">
            Showing {finalData.length} of {data.length}
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

      <div className="flex gap-4 items-center mt-4">
        <button
          className="border px-3 py-2 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span className="text-sm font-medium">
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

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
          <div className="bg-white w-[900px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Pest Management Details</h2>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    getStatus(selected) === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {getStatus(selected) === "completed" ? "Completed" : "On-going"}
                </span>
              </div>

              <button
                className="text-gray-500 hover:text-black"
                onClick={() => {
                  setSelected(null);
                  setIsEditingTraps(false);
                  setIsEditingControls(false);
                  setEditingTraps([]);
                  setEditingControls([]);
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <Field name="Farmer Name" value={maskName(selected.farmer_name)} />
              <Field name="Farmer Mobile" value={mask(selected.farmer_mobile)} />
              <Field name="Crop Name" value={selected.crop_name} />
              <Field name="Surveyor Name" value={selected.surveyor_name} />
              <Field name="Surveyor ID" value={mask(selected.surveyor_id)} />
              <Field name="Village" value={selected.village_name} />
              <Field name="Block" value={selected.block_name} />
              <Field name="District" value={selected.district_name} />
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold">Trap Applications</h3>
                {!isEditingTraps ? (
                  <button
                    onClick={() => {
                      try {
                        const traps = JSON.parse(selected.pest_trap_applications || "[]");
                        setEditingTraps(traps);
                        setIsEditingTraps(true);
                      } catch {
                        alert("Error loading trap applications");
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Traps
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveTraps}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingTraps(false);
                        setEditingTraps([]);
                      }}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Trap Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Trap Count</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Application Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      try {
                        const traps: TrapApplication[] = isEditingTraps
                          ? editingTraps
                          : JSON.parse(selected.pest_trap_applications || "[]");

                        if (traps.length === 0) {
                          return (
                            <tr>
                              <td colSpan={3} className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-500">
                                No trap applications recorded
                              </td>
                            </tr>
                          );
                        }

                        return traps.map((trap, idx) => (
                          <tr key={trap.trap_application_id || idx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingTraps ? (
                                <input
                                  type="text"
                                  value={trap.trap_name}
                                  onChange={(e) => {
                                    const updated = [...editingTraps];
                                    updated[idx].trap_name = e.target.value;
                                    setEditingTraps(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              ) : (
                                trap.trap_name
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingTraps ? (
                                <input
                                  type="number"
                                  value={trap.trap_count}
                                  onChange={(e) => {
                                    const updated = [...editingTraps];
                                    updated[idx].trap_count = parseInt(e.target.value) || 0;
                                    setEditingTraps(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              ) : (
                                trap.trap_count
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingTraps ? (
                                <input
                                  type="date"
                                  value={trap.trap_application_date}
                                  onChange={(e) => {
                                    const updated = [...editingTraps];
                                    updated[idx].trap_application_date = e.target.value;
                                    setEditingTraps(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              ) : (
                                trap.trap_application_date
                              )}
                            </td>
                          </tr>
                        ));
                      } catch {
                        return (
                          <tr>
                            <td colSpan={3} className="border border-gray-300 px-3 py-2 text-center text-sm text-red-500">
                              Error loading trap applications
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold">Control Applications (Pesticides)</h3>
                {!isEditingControls ? (
                  <button
                    onClick={() => {
                      try {
                        const controls = JSON.parse(selected.pest_control_applications || "[]");
                        setEditingControls(controls);
                        setIsEditingControls(true);
                      } catch {
                        alert("Error loading control applications");
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Controls
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveControls}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingControls(false);
                        setEditingControls([]);
                      }}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Type</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Pesticide Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Quantity</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Unit</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Application Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      try {
                        const controls: ControlApplication[] = isEditingControls
                          ? editingControls
                          : JSON.parse(selected.pest_control_applications || "[]");

                        if (controls.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-500">
                                No control applications recorded
                              </td>
                            </tr>
                          );
                        }

                        return controls.map((control, idx) => (
                          <tr key={control.control_application_id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingControls ? (
                                <input
                                  type="text"
                                  value={control.pesticide_type}
                                  onChange={(e) => {
                                    const updated = [...editingControls];
                                    updated[idx].pesticide_type = e.target.value;
                                    setEditingControls(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              ) : (
                                control.pesticide_type
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingControls ? (
                                <input
                                  type="text"
                                  value={control.pesticide_name}
                                  onChange={(e) => {
                                    const updated = [...editingControls];
                                    updated[idx].pesticide_name = e.target.value;
                                    setEditingControls(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              ) : (
                                control.pesticide_name
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingControls ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={control.pesticide_quantity}
                                  onChange={(e) => {
                                    const updated = [...editingControls];
                                    updated[idx].pesticide_quantity = parseFloat(e.target.value) || 0;
                                    setEditingControls(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              ) : (
                                control.pesticide_quantity.toFixed(2)
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingControls ? (
                                <select
                                  value={control.unit}
                                  onChange={(e) => {
                                    const updated = [...editingControls];
                                    updated[idx].unit = e.target.value;
                                    setEditingControls(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                >
                                  <option value="kg">kg</option>
                                  <option value="gm">gm</option>
                                  <option value="g">g</option>
                                  <option value="ml">ml</option>
                                  <option value="l">l</option>
                                </select>
                              ) : (
                                control.unit
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 py-2 text-sm">
                              {isEditingControls ? (
                                <input
                                  type="date"
                                  value={control.pesticide_application_date}
                                  onChange={(e) => {
                                    const updated = [...editingControls];
                                    updated[idx].pesticide_application_date = e.target.value;
                                    setEditingControls(updated);
                                  }}
                                  className="w-full px-2 py-1 border rounded"
                                />
                              ) : (
                                control.pesticide_application_date
                              )}
                            </td>
                          </tr>
                        ));
                      } catch {
                        return (
                          <tr>
                            <td colSpan={5} className="border border-gray-300 px-3 py-2 text-center text-sm text-red-500">
                              Error loading control applications
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-sm font-medium">
                Total Pesticide: {isEditingControls
                  ? (() => {
                      const total = editingControls.reduce((sum, c) => {
                        const quantity = c.pesticide_quantity || 0;
                        const unit = (c.unit || "").toLowerCase();
                        const quantityInKg = unit === "gm" || unit === "g" ? quantity / 1000 : quantity;
                        return sum + quantityInKg;
                      }, 0);
                      return total.toFixed(2);
                    })()
                  : getTotalPesticide(selected).toFixed(2)
                } kg
              </div>
            </div>

          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[450px] rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Export Data</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setShowExportModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Season</label>
                <select
                  className="border rounded px-3 h-10"
                  value={exportSeasonId}
                  onChange={e => setExportSeasonId(Number(e.target.value))}
                >
                  {SEASONS.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Season Year</label>
                <input
                  type="number"
                  className="border rounded px-3 h-10"
                  value={exportSeasonYear}
                  onChange={e => setExportSeasonYear(Number(e.target.value))}
                  min="2000"
                  max="2100"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isExporting ? "Exporting..." : "Export"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
