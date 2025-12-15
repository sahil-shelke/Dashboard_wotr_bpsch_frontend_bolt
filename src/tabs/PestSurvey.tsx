

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

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
export type PestImage = {
  url: string;
  timestamp: string;
};

export type PestObservationRecord = {
  farmer_name: string;
  crop_name_en: string;
  surveyor_name: string;
  surveyor_id: string;
  village_name: string;
  block_name: string;
  district_name: string;

  crop_registration_id: string;

  etl: string;
  comments: string;
  date_of_observation: string;

  image_url: string;
  part_of_plant: string;
  pest_name: string;
  time_stamp: string;
};

// ------------------------------------------------------------
// MASKING
// ------------------------------------------------------------
function maskSurveyorId(v: string): string {
  if (!v) return "—";
  if (v.length <= 6) return "XXXXXX";
  return "XXXXXX" + v.slice(6);
}

function maskName(v: string): string {
  if (!v) return "—";
  const parts = v.trim().split(" ");
  const first = parts[0];
  parts[0] = "X".repeat(first.length);
  return parts.join(" ");
}


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function parseImages(str: string): PestImage[] {
  try {
    const parsed = JSON.parse(str);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------
export default function PestObservationTable() {
  const [data, setData] = useState<PestObservationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRecord, setSelectedRecord] = useState<PestObservationRecord | null>(null);

  const [imageModal, setImageModal] = useState<{
    images: PestImage[];
    index: number;
  } | null>(null);

  const columnHelper = createColumnHelper<PestObservationRecord>();

  // ------------------------------------------------------------
  // DISTRICT → BLOCK → VILLAGE FILTERING
  // ------------------------------------------------------------
  const [districtFilter, setDistrictFilter] = useState("");
  const [blockFilter, setBlockFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");

  const uniqueDistricts = useMemo(
    () => [...new Set(data.map((d) => d.district_name))].filter(Boolean).sort(),
    [data]
  );

  const uniqueBlocks = useMemo(() => {
    return [
      ...new Set(
        data
          .filter((r) => (!districtFilter ? true : r.district_name === districtFilter))
          .map((r) => r.block_name)
      ),
    ]
      .filter(Boolean)
      .sort();
  }, [data, districtFilter]);

  const uniqueVillages = useMemo(() => {
    return [
      ...new Set(
        data
          .filter((r) => (!districtFilter ? true : r.district_name === districtFilter))
          .filter((r) => (!blockFilter ? true : r.block_name === blockFilter))
          .map((r) => r.village_name)
      ),
    ]
      .filter(Boolean)
      .sort();
  }, [data, districtFilter, blockFilter]);

  // ------------------------------------------------------------
  // COLUMNS
  // ------------------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", {
  header: "Farmer",
  cell: ({ row }) => maskName(row.original.farmer_name),
}),

    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("pest_name", { header: "Pest Name" }),
    columnHelper.accessor("date_of_observation", { header: "Observation Date" }),
    columnHelper.accessor("etl", { header: "ETL" }),

    // Hidden by default
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),

    columnHelper.accessor("surveyor_id", {
      header: "Surveyor ID",
      cell: ({ row }) => maskSurveyorId(row.original.surveyor_id),
    }),

    columnHelper.accessor("part_of_plant", { header: "Part of Plant" }),
    columnHelper.accessor("comments", { header: "Comments" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("time_stamp", { header: "Timestamp" }),
    columnHelper.accessor("crop_registration_id", { header: "Crop Reg ID" }),
    columnHelper.accessor("image_url", { header: "Images" }),

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

  // default visibility settings
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: true,
    crop_name_en: true,
    district_name: true,
    block_name: true,
    village_name: true,
    pest_name: true,
    date_of_observation: true,
    etl: true,
    actions: true,

    surveyor_name: false,
    surveyor_id: false,
    part_of_plant: false,
    comments: false,
    time_stamp: false,
    crop_registration_id: false,
    image_url: false,
  });

  // ------------------------------------------------------------
  // FETCH
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/farm-management/pest-survey");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ------------------------------------------------------------
  // TABLE STATE + INIT
  // ------------------------------------------------------------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 });

  const finalData = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();

    return data.filter((r) => {
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

  // ------------------------------------------------------------
  // CSV EXPORT
  // ------------------------------------------------------------
  function exportCSV() {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) return;

    const visibleCols = table.getAllLeafColumns().filter((c) => c.getIsVisible() && c.id !== "actions");

    const headers = visibleCols.map((c) =>
      typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
    );

    const csvRows = rows.map((row) =>
      visibleCols
        .map((col) => {
          let v = (row.original as any)[col.id];
          if (col.id === "farmer_name") v = maskName(String(v));

          if (col.id === "surveyor_id") v = maskSurveyorId(v);

          if (v == null) return "";
          const s = String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");

const BOM = "\uFEFF"; // UTF-8 BOM
const blob = new Blob([BOM + csv], {
  type: "text/csv;charset=utf-8;",
});

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pest_observations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6">Loading...</div>;

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="w-full">
      {/* FILTER PANEL */}
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">

        {/* TOP BUTTONS */}
        <div className="flex justify-between mb-4">
          <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Export
          </button>

          <details className="relative">
            <summary className="px-4 py-2 bg-gray-700 text-white rounded cursor-pointer">
              View Additional Data
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg p-3 max-h-72 overflow-auto z-50">
              {table.getAllLeafColumns().map((col) => (
                <label key={col.id} className="flex items-center gap-2 mb-2 text-sm">
                  <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} />
                  {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                </label>
              ))}
            </div>
          </details>
        </div>

        {/* SEARCH + LOCATION FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* SEARCH */}
          <div className="flex flex-col">
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10"
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          {/* DISTRICT */}
          <div className="flex flex-col">
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setBlockFilter("");
                setVillageFilter("");
              }}
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* BLOCK */}
          <div className="flex flex-col">
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10"
              disabled={!districtFilter}
              value={blockFilter}
              onChange={(e) => {
                setBlockFilter(e.target.value);
                setVillageFilter("");
              }}
            >
              <option value="">All Blocks</option>
              {uniqueBlocks.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* VILLAGE */}
          <div className="flex flex-col">
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded px-3 h-10"
              disabled={!blockFilter}
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
            >
              <option value="">All Villages</option>
              {uniqueVillages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* COUNT */}
        <div className="flex justify-end text-sm text-gray-700 mt-4">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </div>
      </div>

      {/* TABLE */}
      <div className={THEME.table.wrapper}>
        <table className={THEME.table.table}>
          <thead className={THEME.table.thead}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
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

      {/* PAGINATION */}
      <div className="flex gap-3 items-center mt-4">
        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Prev
        </button>

        <span>Page {pagination.pageIndex + 1} / {table.getPageCount()}</span>

        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
        </button>
      </div>

      {/* VIEW MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[520px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pest Observation</h2>
              <button className="text-gray-600 hover:text-black" onClick={() => setSelectedRecord(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">

              {/* Farmer */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Farmer & Location</h3>
                {["farmer_name", "village_name", "block_name", "district_name"].map((k) => (
  <div key={k} className="border-b pb-2">
    <div className="text-xs uppercase text-gray-500">{k.replace(/_/g, " ")}</div>

    <div className="text-sm">
      {k === "farmer_name"
        ? maskName(selectedRecord.farmer_name)
        : selectedRecord[k as keyof PestObservationRecord] || "—"}
    </div>
  </div>
))}

              </div>

              {/* Crop / Pest */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Crop & Pest</h3>
                {["crop_name_en", "pest_name", "etl", "part_of_plant", "date_of_observation"].map((k) => (
                  <div key={k} className="border-b pb-2">
                    <div className="text-xs uppercase text-gray-500">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{selectedRecord[k as keyof PestObservationRecord] || "—"}</div>
                  </div>
                ))}
              </div>

              {/* Surveyor (with MASKING) */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Surveyor</h3>

                <div className="border-b pb-2">
                  <div className="text-xs uppercase text-gray-500">SURVEYOR NAME</div>
                  <div className="text-sm">{selectedRecord.surveyor_name || "—"}</div>
                </div>

                <div className="border-b pb-2">
                  <div className="text-xs uppercase text-gray-500">SURVEYOR ID</div>
                  <div className="text-sm">{maskSurveyorId(selectedRecord.surveyor_id)}</div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Comments</h3>
                <div className="border-b pb-2 text-sm">{selectedRecord.comments || "—"}</div>
              </div>

              {/* IMAGES */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Images</h3>
                <div className="grid grid-cols-2 gap-2">
                  {parseImages(selectedRecord.image_url).map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() =>
                        setImageModal({
                          images: parseImages(selectedRecord.image_url),
                          index: i,
                        })
                      }
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="relative bg-black rounded-lg p-4 flex flex-col items-center max-w-xl w-[90vw]">
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-2 right-2 text-white text-xl"
            >
              ✕
            </button>

            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-3xl"
              disabled={imageModal.index === 0}
              onClick={() =>
                setImageModal((prev) =>
                  prev ? { ...prev, index: prev.index - 1 } : prev
                )
              }
            >
              ‹
            </button>

            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-3xl"
              disabled={imageModal.index === imageModal.images.length - 1}
              onClick={() =>
                setImageModal((prev) =>
                  prev ? { ...prev, index: prev.index + 1 } : prev
                )
              }
            >
              ›
            </button>

            <img
              src={imageModal.images[imageModal.index].url}
              className="max-h-[75vh] object-contain rounded"
            />

            <div className="text-white text-sm mt-2 opacity-80">
              {imageModal.images[imageModal.index].timestamp}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
