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
        <label className="text-sm font-semibold text-foreground">District</label>
        <select
          className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          value={districtFilter}
          onChange={e => onDistrictChange(e.target.value)}
        >
          <option value="">All Districts</option>
          {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">Block</label>
        <select
          className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          value={blockFilter}
          disabled={!districtFilter}
          onChange={e => onBlockChange(e.target.value)}
        >
          <option value="">All Blocks</option>
          {uniqueBlocks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">Village</label>
        <select
          className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          value={villageFilter}
          disabled={!blockFilter}
          onChange={e => onVillageChange(e.target.value)}
        >
          <option value="">All Villages</option>
          {uniqueVillages.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
    </>
  );
}
