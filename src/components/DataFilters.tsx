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
    <div className="bg-card rounded-2xl border shadow-lg p-6 mb-6 animate-slide-up card-shadow-hover transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filters.map((filter) => (
          <div key={filter.value} className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">{filter.label}</label>
            {filter.type === 'select' && filter.options ? (
              <select
                value={values[filter.value] || ''}
                onChange={(e) => onChange(filter.value, e.target.value)}
                className="h-11 rounded-lg border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
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
                className="h-11 rounded-lg border bg-card focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            ) : (
              <Input
                type="text"
                placeholder={filter.placeholder || `Filter by ${filter.label}`}
                value={values[filter.value] || ''}
                onChange={(e) => onChange(filter.value, e.target.value)}
                className="h-11 rounded-lg border bg-card focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <Button
          onClick={onApply}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
        >
          <Search className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="border font-medium hover:bg-accent/5 shadow-sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
