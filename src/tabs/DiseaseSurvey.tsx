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
import { THEME } from "../utils/theme";

const SEASONS = [
  { id: 1, name: "Kharif" },
  { id: 2, name: "Rabi" },
  { id: 3, name: "Summer" },
  { id: 4, name: "Annual" },
];

type DiseaseObservation = {
  etl: string;
  comments: string;
  image_url: string;
  disease_name: string;
  created_at: string;
  time_stamp: string;
  part_of_plant: string;
  observation_id: number;
  date_of_observation: string;
};

type FarmerRecord = {
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
  disease_survey: string;
};

type FlattenedObservation = {
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
  observation_id: number;
  disease_name: string;
  part_of_plant: string;
  etl: string;
  date_of_observation: string;
  image_url: string;
  comments: string;
  time_stamp: string;
  created_at: string;
};

function maskSurveyorId(v: any): string {
  if (!v) return "—";
  const s = String(v);
  if (s.length <= 4) return "XXXX";
  return "X".repeat(s.length - 4) + s.slice(-4);
}

function maskName(v: string): string {
  if (!v) return "—";
  const parts = v.trim().split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}

function Field({ name, value }: any) {
  return (
    <div className="border-b pb-2">
      <div className="text-xs uppercase text-gray-500">{name.replace(/_/g, " ")}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}

export default function DiseaseObservationTable() {
  const [rawData, setRawData] = useState<FarmerRecord[]>([]);
  const [data, setData] = useState<FlattenedObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FlattenedObservation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    disease_name: "",
    part_of_plant: "",
    etl: "",
    date_of_observation: "",
    image_url: "",
    comments: "",
  });

  const [imageModal, setImageModal] = useState<string | null>(null);

  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSeasonId, setExportSeasonId] = useState(1);
  const [exportSeasonYear, setExportSeasonYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const columnHelper = createColumnHelper<FlattenedObservation>();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor("farmer_name", {
        header: "Farmer",
        cell: info => maskName(info.getValue()),
      }),
      columnHelper.accessor("crop_name", { header: "Crop" }),
      columnHelper.accessor("plot_area", {
        header: "Plot Area",
        cell: info => {
          const v = info.getValue();
          return v != null ? v : "—";
        }
      }),
      columnHelper.accessor("season", {
        header: "Season",
        cell: info => info.getValue() || "—"
      }),
      columnHelper.accessor("season_year", {
        header: "Season Year",
        cell: info => info.getValue() || "—"
      }),
      columnHelper.accessor("district_name", { header: "District" }),
      columnHelper.accessor("block_name", { header: "Block" }),
      columnHelper.accessor("village_name", { header: "Village" }),
      columnHelper.accessor("disease_name", { header: "Disease Name" }),
      columnHelper.accessor("date_of_observation", { header: "Observation Date" }),
      columnHelper.accessor("etl", { header: "ETL" }),
      columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
      columnHelper.accessor("surveyor_id", {
        header: "Surveyor ID",
        cell: info => maskSurveyorId(info.getValue()),
      }),
      columnHelper.accessor("part_of_plant", { header: "Part of Plant" }),
      columnHelper.accessor("comments", { header: "Comments" }),
      columnHelper.accessor("time_stamp", { header: "Timestamp" }),
      columnHelper.accessor("crop_registration_id", { header: "Crop Reg ID" }),
      columnHelper.accessor("observation_id", { header: "Observation ID" }),
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
    crop_name: true,
    plot_area: true,
    season: true,
    season_year: true,
    district_name: true,
    block_name: true,
    village_name: true,
    disease_name: true,
    date_of_observation: true,
    etl: true,
    actions: true,
    surveyor_name: false,
    surveyor_id: false,
    part_of_plant: false,
    comments: false,
    time_stamp: false,
    crop_registration_id: false,
    observation_id: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch("/api/disease_survey/dashboard/get_all_records", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const json = await res.json();
        setRawData(Array.isArray(json) ? json : []);

        const flattened: FlattenedObservation[] = [];
        json.forEach((farmer: FarmerRecord) => {
          try {
            const observations: DiseaseObservation[] = JSON.parse(farmer.disease_survey);
            observations.forEach(obs => {
              flattened.push({
                crop_registration_id: farmer.crop_registration_id,
                farmer_name: farmer.farmer_name,
                farmer_mobile: farmer.farmer_mobile,
                crop_name: farmer.crop_name,
                plot_area: farmer.plot_area,
                season: farmer.season,
                season_year: farmer.season_year,
                surveyor_name: farmer.surveyor_name,
                surveyor_id: farmer.surveyor_id,
                village_name: farmer.village_name,
                block_name: farmer.block_name,
                district_name: farmer.district_name,
                observation_id: obs.observation_id,
                disease_name: obs.disease_name,
                part_of_plant: obs.part_of_plant,
                etl: obs.etl,
                date_of_observation: obs.date_of_observation,
                image_url: obs.image_url,
                comments: obs.comments,
                time_stamp: obs.time_stamp,
                created_at: obs.created_at,
              });
            });
          } catch (e) {
            console.error("Failed to parse disease_survey for farmer:", farmer.farmer_name, e);
          }
        });

        setData(flattened);
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

      return JSON.stringify(r).toLowerCase().includes(q);
    });
  }, [data, globalFilter, districtFilter, blockFilter, villageFilter]);

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

  function exportCSV() {
    setShowExportModal(true);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("authToken");
      const url = `/api/disease_survey/dashboard/get_export_data?season_id=${exportSeasonId}&season_year=${exportSeasonYear}`;

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Export failed");

      const exportData = await res.json();

      if (!Array.isArray(exportData) || exportData.length === 0) {
        alert("No data available for export");
        return;
      }

      const headers = Object.keys(exportData[0]);

      const rows = exportData.map(row =>
        headers.map(h => {
          const v = row[h];
          if (v == null) return "";
          const s = String(v);
          if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
      );

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url2 = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url2;
      a.download = `disease_survey_${SEASONS.find(s => s.id === exportSeasonId)?.name}_${exportSeasonYear}.csv`;
      a.click();
      URL.revokeObjectURL(url2);

      setShowExportModal(false);
    } catch (error) {
      alert("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }

  async function saveRecord() {
    if (!selected) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/disease_survey/dashboard/update/${selected.observation_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            disease_name: editForm.disease_name || null,
            part_of_plant: editForm.part_of_plant || null,
            etl: editForm.etl || null,
            date_of_observation: editForm.date_of_observation || null,
            image_url: editForm.image_url || null,
            comments: editForm.comments || null,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      const updatedRecord = {
        ...selected,
        ...editForm,
      };

      setSelected(updatedRecord);
      setData(prev =>
        prev.map(item =>
          item.observation_id === selected.observation_id ? updatedRecord : item
        )
      );

      setIsEditing(false);
      alert("Successfully updated disease observation");
    } catch (error) {
      alert("Failed to update disease observation");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <div className="flex justify-between mb-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export
          </button>

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
        </div>

        <div className="flex justify-end text-sm text-gray-700 mt-4">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
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
          <div className="bg-white w-[650px] max-h-[95vh] rounded-lg shadow-xl p-5 overflow-y-auto my-8">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-3 border-b">
              <h2 className="text-lg font-semibold">Disease Observation Details</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => {
                  setSelected(null);
                  setIsEditing(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Farmer & Location</h3>
                <Field name="Farmer Name" value={maskName(selected.farmer_name)} />
                <Field name="Village" value={selected.village_name} />
                <Field name="Block" value={selected.block_name} />
                <Field name="District" value={selected.district_name} />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Surveyor</h3>
                <Field name="Surveyor Name" value={selected.surveyor_name} />
                <Field name="Surveyor ID" value={maskSurveyorId(selected.surveyor_id)} />
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold">Observation Details</h3>
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setEditForm({
                        disease_name: selected.disease_name || "",
                        part_of_plant: selected.part_of_plant || "",
                        etl: selected.etl || "",
                        date_of_observation: selected.date_of_observation || "",
                        image_url: selected.image_url || "",
                        comments: selected.comments || "",
                      });
                      setIsEditing(true);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Record
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveRecord}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Crop Name</label>
                      <input
                        type="text"
                        value={selected.crop_name}
                        disabled
                        className="w-full px-3 py-2 border rounded mt-1 bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Disease Name</label>
                      <input
                        type="text"
                        value={editForm.disease_name}
                        onChange={e => setEditForm({ ...editForm, disease_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Part of Plant</label>
                      <input
                        type="text"
                        value={editForm.part_of_plant}
                        onChange={e => setEditForm({ ...editForm, part_of_plant: e.target.value })}
                        className="w-full px-3 py-2 border rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">ETL</label>
                      <input
                        type="text"
                        value={editForm.etl}
                        onChange={e => setEditForm({ ...editForm, etl: e.target.value })}
                        className="w-full px-3 py-2 border rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date of Observation</label>
                      <input
                        type="date"
                        value={editForm.date_of_observation}
                        onChange={e =>
                          setEditForm({ ...editForm, date_of_observation: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Timestamp</label>
                      <input
                        type="text"
                        value={selected.time_stamp}
                        disabled
                        className="w-full px-3 py-2 border rounded mt-1 bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Image URL</label>
                    <textarea
                      value={editForm.image_url}
                      onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Comments</label>
                    <textarea
                      value={editForm.comments}
                      onChange={e => setEditForm({ ...editForm, comments: e.target.value })}
                      className="w-full px-3 py-2 border rounded mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field name="Crop Name" value={selected.crop_name} />
                    <Field name="Disease Name" value={selected.disease_name} />
                    <Field name="Part of Plant" value={selected.part_of_plant} />
                    <Field name="ETL" value={selected.etl} />
                    <Field name="Date of Observation" value={selected.date_of_observation} />
                    <Field name="Timestamp" value={selected.time_stamp} />
                  </div>

                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-2">Comments</div>
                    <div className="text-sm border-b pb-2">{selected.comments || "—"}</div>
                  </div>

                  {selected.image_url && (
                    <div>
                      <div className="text-xs uppercase text-gray-500 mb-2">Image</div>
                      <img
                        src={selected.image_url}
                        className="w-full max-w-md h-48 object-cover rounded cursor-pointer hover:opacity-80"
                        onClick={() => setImageModal(selected.image_url)}
                        alt="Disease observation"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {imageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative bg-black rounded-lg p-4 flex flex-col items-center max-w-4xl w-[90vw]">
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-2 right-2 text-white text-xl hover:text-gray-300"
            >
              ✕
            </button>

            <img src={imageModal} className="max-h-[85vh] object-contain rounded" alt="Full size" />
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
