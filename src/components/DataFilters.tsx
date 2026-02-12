import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
  type: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface DataFiltersProps {
  filters: FilterOption[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function DataFilters({ filters, values, onChange, onApply, onReset }: DataFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-[#6D4C41]/20 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter) => (
          <div key={filter.value} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#2E3A3F]">{filter.label}</label>
            {filter.type === 'select' && filter.options ? (
              <select
                value={values[filter.value] || ''}
                onChange={(e) => onChange(filter.value, e.target.value)}
                className="h-10 rounded-md border border-[#6D4C41]/20 bg-white px-3 py-2 text-sm text-[#2E3A3F] focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
              >
                <option value="">All</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : filter.type === 'date' ? (
              <Input
                type="date"
                value={values[filter.value] || ''}
                onChange={(e) => onChange(filter.value, e.target.value)}
                className="border-[#6D4C41]/20 focus:ring-[#1B5E20]"
              />
            ) : (
              <Input
                type="text"
                placeholder={filter.placeholder || `Filter by ${filter.label}`}
                value={values[filter.value] || ''}
                onChange={(e) => onChange(filter.value, e.target.value)}
                className="border-[#6D4C41]/20 focus:ring-[#1B5E20]"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        <Button
          onClick={onApply}
          className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white"
        >
          <Search className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="border-[#6D4C41]/20 text-[#2E3A3F] hover:bg-[#7CB342]/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
