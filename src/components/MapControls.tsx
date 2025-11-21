import { ChevronDown, Layers, Map } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import type { MapLayer } from "../config/mapLayers";

type MapType = 'street' | 'satellite';

interface MapControlsProps {
  groupedLayers: Record<string, MapLayer[]>;
  visibleLayers: Set<string>;
  loading: Set<string>;
  mapType: MapType;
  selectedLayer: string | null;
  showFarmers: boolean;
  farmerCount: number;
  onToggleLayer: (layerId: string) => void;
  onMapTypeChange: (mapType: MapType) => void;
  onZoomToLayer: (layerId: string) => void;
  onToggleFarmers: () => void;
}

export default function MapControls({
  groupedLayers,
  visibleLayers,
  loading,
  mapType,
  selectedLayer,
  showFarmers,
  farmerCount,
  onToggleLayer,
  onMapTypeChange,
  onZoomToLayer,
  onToggleFarmers,
}: MapControlsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        variant={showFarmers ? "default" : "outline"}
        className="gap-2"
        onClick={onToggleFarmers}
      >
        <Layers className="h-4 w-4" aria-hidden="true" />
        Farmer Plots ({farmerCount})
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Map className="h-4 w-4" aria-hidden="true" />
            {mapType === 'street' ? 'Street View' : 'Satellite View'}
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Map Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={mapType} onValueChange={(value) => onMapTypeChange(value as MapType)}>
            <DropdownMenuRadioItem value="street">
              Street View
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="satellite">
              Satellite View
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
