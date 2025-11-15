interface LocationFiltersProps {
  districtFilter: string;
  blockFilter: string;
  villageFilter: string;
  onDistrictChange: (value: string) => void;
  onBlockChange: (value: string) => void;
  onVillageChange: (value: string) => void;
  uniqueDistricts: string[];
  uniqueBlocks: string[];
  uniqueVillages: string[];
}

export function LocationFilters({
  districtFilter,
  blockFilter,
  villageFilter,
  onDistrictChange,
  onBlockChange,
  onVillageChange,
  uniqueDistricts,
  uniqueBlocks,
  uniqueVillages,
}: LocationFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#2E3A3F]">District</label>
        <select
          className="h-10 rounded-md border border-[#6D4C41]/20 bg-white px-3 py-2 text-sm text-[#2E3A3F] focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
          value={districtFilter}
          onChange={e => onDistrictChange(e.target.value)}
        >
          <option value="">All Districts</option>
          {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#2E3A3F]">Block</label>
        <select
          className="h-10 rounded-md border border-[#6D4C41]/20 bg-white px-3 py-2 text-sm text-[#2E3A3F] focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
          value={blockFilter}
          onChange={e => onBlockChange(e.target.value)}
        >
          <option value="">All Blocks</option>
          {uniqueBlocks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[#2E3A3F]">Village</label>
        <select
          className="h-10 rounded-md border border-[#6D4C41]/20 bg-white px-3 py-2 text-sm text-[#2E3A3F] focus:outline-none focus:ring-2 focus:ring-[#1B5E20]"
          value={villageFilter}
          onChange={e => onVillageChange(e.target.value)}
        >
          <option value="">All Villages</option>
          {uniqueVillages.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
    </>
  );
}
