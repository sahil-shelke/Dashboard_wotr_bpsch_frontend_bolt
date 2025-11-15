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

import { useEffect, useState } from "react";

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export type DiseaseImage = {
  url: string;
  timestamp: string;
};

export type DiseaseObservationRecord = {
  farmer_name: string;
  farmer_mobile: string;
  crop_name_en: string;

  surveyor_name: string;
  surveyor_id: string;

  village_name: string;
  block_name: string;
  district_name: string;

  crop_registration_id: string; // hidden

  etl: string;
  comments: string;
  date_of_observation: string;

  image_url: string; // JSON array string
  part_of_plant: string;
  disease_name: string;
  time_stamp: string;
};

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function parseImages(str: string): DiseaseImage[] {
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

export default function DiseaseObservationTable() {
  const [data, setData] = useState<DiseaseObservationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRecord, setSelectedRecord] =
    useState<DiseaseObservationRecord | null>(null);

  const [imageModal, setImageModal] = useState<{
    images: DiseaseImage[];
    index: number;
  } | null>(null);

  const columnHelper = createColumnHelper<DiseaseObservationRecord>();

  // ------------------------------------------------------------
  // COLUMNS — approved visible set
  // ------------------------------------------------------------

  const columns = [
    // hidden but searchable
    columnHelper.accessor("farmer_name", { header: "Farmer Name" }),
    columnHelper.accessor("crop_name_en", { header: "Crop" }),
    columnHelper.accessor("surveyor_name", { header: "Surveyor Name" }),
    columnHelper.accessor("village_name", { header: "Village" }),
    columnHelper.accessor("block_name", { header: "Block" }),
    columnHelper.accessor("district_name", { header: "District" }),
    columnHelper.accessor("comments", { header: "Comments" }),
    columnHelper.accessor("time_stamp", { header: "Timestamp" }),
    columnHelper.accessor("image_url", { header: "Images" }),
    columnHelper.accessor("crop_registration_id", { header: "Crop Reg ID" }),

    // visible
    columnHelper.accessor("surveyor_id", { header: "Surveyor ID" }),
    columnHelper.accessor("farmer_mobile", { header: "Mobile" }),
    columnHelper.accessor("disease_name", { header: "Disease" }),
    columnHelper.accessor("etl", { header: "ETL" }),
    columnHelper.accessor("date_of_observation", {
      header: "Observation Date",
    }),
    columnHelper.accessor("part_of_plant", { header: "Part Of Plant" }),

    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setSelectedRecord(row.original)}
        >
          View
        </button>
      ),
    }),
  ];

  // ------------------------------------------------------------
  // FETCH DATA
  // ------------------------------------------------------------

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "http://localhost:5000/api/farm-management/disease-survey"
        );
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ------------------------------------------------------------
  // TABLE STATE
  // ------------------------------------------------------------

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    farmer_name: false,
    crop_name_en: false,
    surveyor_name: false,
    village_name: false,
    block_name: false,
    district_name: false,
    comments: false,
    time_stamp: false,
    image_url: false,
    crop_registration_id: false,
  });

  // ------------------------------------------------------------
  // TABLE INIT
  // ------------------------------------------------------------

  const table = useReactTable({
    data,
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

  // ------------------------------------------------------------
  // GLOBAL KEY HANDLER (stable hook order)
  // ------------------------------------------------------------

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setImageModal((prev) => (prev ? null : prev));

      if (e.key === "ArrowLeft") {
        setImageModal((prev) =>
          prev && prev.index > 0
            ? { ...prev, index: prev.index - 1 }
            : prev
        );
      }

      if (e.key === "ArrowRight") {
        setImageModal((prev) =>
          prev && prev.index < prev.images.length - 1
            ? { ...prev, index: prev.index + 1 }
            : prev
        );
      }
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="w-full min-h-screen bg-[#F5E9D4]/20">
      <div className="w-full max-w-none p-6">
      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <input
          placeholder="Search..."
          className="border px-3 py-2 rounded-md w-60"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <span className="text-gray-700 text-sm font-medium">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} records
        </span>

        <details className="border px-3 py-2 rounded cursor-pointer">
          <summary>Columns</summary>
          <div className="mt-2 flex flex-col gap-1">
            {table.getAllLeafColumns().map((col) => (
              <label key={col.id} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={col.getIsVisible()}
                  onChange={col.getToggleVisibilityHandler()}
                />
                {col.id}
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-auto border rounded-lg">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 font-semibold border-b border-gray-300 cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
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
                className={`border-b ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition-colors`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 border-gray-200">
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
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Prev
        </button>

        <span>
          Page {pagination.pageIndex + 1} / {table.getPageCount()}
        </span>

        <button
          className="border px-3 py-1 rounded disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>

      {/* VIEW MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[520px] max-h-[90vh] rounded-lg shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Disease Observation Details</h2>

              <button
                className="text-gray-500 hover:text-black"
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              {/* Farmer & Location */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Farmer & Location</h3>

                {[
                  "farmer_name",
                  "farmer_mobile",
                  "village_name",
                  "block_name",
                  "district_name",
                ].map((key) => (
                  <div key={key} className="border-b pb-2">
                    <div className="text-xs uppercase text-gray-500">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm">
                      {selectedRecord[key as keyof DiseaseObservationRecord] ||
                        "—"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Crop */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Crop Details</h3>

                {[
                  "crop_name_en",
                  "disease_name",
                  "etl",
                  "part_of_plant",
                  "date_of_observation",
                ].map((key) => (
                  <div key={key} className="border-b pb-2">
                    <div className="text-xs uppercase text-gray-500">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm">
                      {selectedRecord[key as keyof DiseaseObservationRecord] ||
                        "—"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Comments</h3>
                <div className="border-b pb-2 text-sm">
                  {selectedRecord.comments || "—"}
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Images</h3>

                <div className="grid grid-cols-2 gap-2">
                  {parseImages(selectedRecord.image_url).map((img, i) => (
                    <img
                      key={i}
                      src={img.url}
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-75"
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

      {/* IMAGE MODAL */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative w-[90vw] max-w-xl bg-black rounded-lg p-4 flex flex-col items-center">

            {/* Close */}
            <button
              className="absolute top-2 right-2 text-white text-xl"
              onClick={() => setImageModal(null)}
            >
              ✕
            </button>

            {/* Prev */}
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
              disabled={imageModal.index === 0}
              onClick={() =>
                setImageModal((prev) =>
                  prev && prev.index > 0
                    ? { ...prev, index: prev.index - 1 }
                    : prev
                )
              }
            >
              ‹
            </button>

            {/* Next */}
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-3xl px-2"
              disabled={imageModal.index === imageModal.images.length - 1}
              onClick={() =>
                setImageModal((prev) =>
                  prev &&
                  prev.index < prev.images.length - 1
                    ? { ...prev, index: prev.index + 1 }
                    : prev
                )
              }
            >
              ›
            </button>

            {/* MAIN IMAGE */}
            <img
              src={imageModal.images[imageModal.index].url}
              className="max-h-[70vh] rounded object-contain"
            />

            {/* Timestamp */}
            <div className="text-white text-sm mt-2 opacity-80">
              {imageModal.images[imageModal.index].timestamp}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
