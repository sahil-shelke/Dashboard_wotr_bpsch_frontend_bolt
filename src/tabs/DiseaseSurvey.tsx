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
import { THEME } from "../utils/theme";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
export type DiseaseImage = {
  url: string;
  timestamp: string;
};

export type DiseaseObservationRecord = {
  farmer_name: string;
  crop_name_en: string;

  surveyor_name: string;
  surveyor_id: string;

  village_name: string;
  block_name: string;
  district_name: string;

  etl: string;
  comments: string;
  date_of_observation: string;

  image_url: string;
  part_of_plant: string;
  disease_name: string;
  time_stamp: string;
};

// ------------------------------------------------------------
// MASK FUNCTION
// ------------------------------------------------------------
function maskSurveyorId(v: string): string {
  if (!v) return "—";
  if (v.length <= 6) return "XXXXXX";
  return "XXXXXX" + v.slice(6);
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------
function parseImages(str: string): DiseaseImage[] {
  try {
    const arr = JSON.parse(str);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safe(v: any) {
  return v === null || v === undefined || v === "" ? "—" : v;
}

function getVal(obj: any, key: string) {
  return safe((obj as Record<string, any>)[key]);
}

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------
export default function DiseaseObservationTable() {
  const [data, setData] = useState<DiseaseObservationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<DiseaseObservationRecord | null>(null);

  const [imageModal, setImageModal] = useState<{
    images: DiseaseImage[];
    index: number;
  } | null>(null);

  const columnHelper = createColumnHelper<DiseaseObservationRecord>();

  // ------------------------------------------------------------
  // COLUMNS
  // ------------------------------------------------------------
  const columns = [
    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),

    // MASK SURVEYOR ID HERE
    columnHelper.accessor("surveyor_id", {
      header: "Surveyor ID",
      cell: ({ row }) => maskSurveyorId(row.original.surveyor_id),
    }),

    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("comments", { header: "Comments" }),
    columnHelper.accessor("time_stamp", { header: "Timestamp" }),
    columnHelper.accessor("image_url", { header: "Images" }),
    columnHelper.accessor("disease_name", { header: "Disease" }),
    columnHelper.accessor("etl", { header: "ETL" }),
    columnHelper.accessor("date_of_observation", { header: "Observation Date" }),
    columnHelper.accessor("part_of_plant", { header: "Part of Plant" }),

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

  // ------------------------------------------------------------
  // FETCH
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/farm-management/disease-survey");
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ------------------------------------------------------------
  // FILTERS
  // ------------------------------------------------------------
  const districts = useMemo(
    () => Array.from(new Set(data.map((d) => d.district_name))).sort(),
    [data]
  );

  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [village, setVillage] = useState("");

  const blocks = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((x) => (district ? x.district_name === district : true))
          .map((x) => x.block_name)
      )
    ).sort();
  }, [data, district]);

  const villages = useMemo(() => {
    return Array.from(
      new Set(
        data
          .filter((x) => (district ? x.district_name === district : true))
          .filter((x) => (block ? x.block_name === block : true))
          .map((x) => x.village_name)
      )
    ).sort();
  }, [data, district, block]);

  const filteredData = useMemo(() => {
    return data.filter((x) => {
      if (district && x.district_name !== district) return false;
      if (block && x.block_name !== block) return false;
      if (village && x.village_name !== village) return false;
      return true;
    });
  }, [data, district, block, village]);

  // ------------------------------------------------------------
  // TABLE INIT
  // ------------------------------------------------------------
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: false,
    crop_name_en: false,
    surveyor_name: false,
    surveyor_id: false,
    village_name: false,
    block_name: false,
    district_name: false,
    comments: false,
    time_stamp: false,
    image_url: false,
  });

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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ------------------------------------------------------------
  // CSV EXPORT (MASKING ADDED)
  // ------------------------------------------------------------
  function exportCSV() {
    const rows = table.getFilteredRowModel().rows;
    if (!rows.length) return;

    const visibleCols = table
      .getAllLeafColumns()
      .filter((c) => c.getIsVisible() && c.id !== "actions");

    const headers = visibleCols.map((c) =>
      typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
    );

    const out = rows.map((r) =>
      visibleCols
        .map((col) => {
          let v = (r.original as any)[col.id];

          if (col.id === "surveyor_id") v = maskSurveyorId(v);

          const s = safe(v);
          if (String(s).includes(",")) return `"${String(s).replace(/"/g, '""')}"`;
          return String(s);
        })
        .join(",")
    );

    const blob = new Blob([headers.join(",") + "\n" + out.join("\n")], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "disease_observation.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImageModal(null);
      if (e.key === "ArrowLeft") {
        setImageModal((prev) => (prev && prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev));
      }
      if (e.key === "ArrowRight") {
        setImageModal((prev) =>
          prev && prev.index < prev.images.length - 1
            ? { ...prev, index: prev.index + 1 }
            : prev
        );
      }
    };

    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="w-full">
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-6 w-full">
        <div className="flex justify-between mb-4">
          <button onClick={exportCSV} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            Export CSV
          </button>

          <details className="relative">
            <summary className="px-4 py-2 rounded bg-gray-700 text-white cursor-pointer">Columns</summary>
            <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded border border-gray-200 p-3 z-50 max-h-72 overflow-y-auto">
              {table.getAllLeafColumns().map((col) => (
                <label key={col.id} className="flex gap-2 text-sm mb-1">
                  <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} />
                  {String(typeof col.columnDef.header === "string" ? col.columnDef.header : col.id)}
                </label>
              ))}
            </div>
          </details>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Search</label>
            <input
              className="border rounded px-3 h-10"
              placeholder="Search everything..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">District</label>
            <select
              className="border rounded px-3 h-10"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setBlock("");
                setVillage("");
              }}
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Block</label>
            <select
              className="border rounded px-3 h-10"
              disabled={!district}
              value={block}
              onChange={(e) => {
                setBlock(e.target.value);
                setVillage("");
              }}
            >
              <option value="">All Blocks</option>
              {blocks.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium">Village</label>
            <select
              className="border rounded px-3 h-10"
              disabled={!block}
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            >
              <option value="">All Villages</option>
              {villages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

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
                  <th key={header.id} className={THEME.table.theadText} onClick={header.column.getToggleSortingHandler()}>
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
              <tr key={row.id} className={`${i % 2 === 0 ? THEME.table.rowEven : THEME.table.rowOdd} ${THEME.table.rowHover}`}>
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
        <button className="border px-3 py-1 rounded disabled:opacity-50" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
          Prev
        </button>

        <span className="text-sm">
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button className="border px-3 py-1 rounded disabled:opacity-50" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
          Next
        </button>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[520px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Disease Observation Details</h2>
              <button className="text-gray-500 hover:text-black" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div className="space-y-6">

              {/* Farmer */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Farmer & Location</h3>
                {["farmer_name", "village_name", "block_name", "district_name"].map((k) => (
                  <div key={k} className="border-b pb-2 mb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{getVal(selected, k)}</div>
                  </div>
                ))}
              </div>

              {/* Crop */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Crop Details</h3>
                {["crop_name_en", "disease_name", "etl", "part_of_plant", "date_of_observation"].map((k) => (
                  <div key={k} className="border-b pb-2 mb-2">
                    <div className="text-xs text-gray-500 uppercase">{k.replace(/_/g, " ")}</div>
                    <div className="text-sm">{getVal(selected, k)}</div>
                  </div>
                ))}
              </div>

              {/* Surveyor */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Surveyor</h3>

                <div className="border-b pb-2 mb-2">
                  <div className="text-xs text-gray-500 uppercase">Surveyor Name</div>
                  <div className="text-sm">{safe(selected.surveyor_name)}</div>
                </div>

                <div className="border-b pb-2 mb-2">
                  <div className="text-xs text-gray-500 uppercase">Surveyor ID</div>
                  <div className="text-sm">{maskSurveyorId(selected.surveyor_id)}</div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Comments</h3>
                <div className="text-sm border-b pb-2">{safe(selected.comments)}</div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Images</h3>

                <div className="grid grid-cols-2 gap-2">
                  {parseImages(selected.image_url).map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      className="w-full h-32 rounded object-cover cursor-pointer hover:opacity-75"
                      onClick={() => setImageModal({ images: parseImages(selected.image_url), index: i })}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="relative w-[90vw] max-w-xl bg-black rounded-lg p-4 flex flex-col items-center">
            <button className="absolute top-2 right-2 text-white text-xl" onClick={() => setImageModal(null)}>
              ✕
            </button>

            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
              disabled={imageModal.index === 0}
              onClick={() =>
                setImageModal((prev) =>
                  prev && prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev
                )
              }
            >
              ‹
            </button>

            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
              disabled={imageModal.index === imageModal.images.length - 1}
              onClick={() =>
                setImageModal((prev) =>
                  prev && prev.index < prev.images.length - 1
                    ? { ...prev, index: prev.index + 1 }
                    : prev
                )
              }
            >
              ›
            </button>

            <img
              src={imageModal.images[imageModal.index].url}
              className="max-h-[70vh] rounded object-contain"
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
