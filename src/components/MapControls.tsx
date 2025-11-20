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
  onToggleLayer: (layerId: string) => void;
  onMapTypeChange: (mapType: MapType) => void;
  onZoomToLayer: (layerId: string) => void;
}

export default function MapControls({
  groupedLayers,
  visibleLayers,
  loading,
  mapType,
  selectedLayer,
  onToggleLayer,
  onMapTypeChange,
  onZoomToLayer,
}: MapControlsProps) {
  const clusterLayers = groupedLayers['cluster'] || [];
  const visibleClusterCount = clusterLayers.filter(layer => visibleLayers.has(layer.id)).length;

  const handleClusterToggle = (layerId: string) => {
    onToggleLayer(layerId);
    if (!visibleLayers.has(layerId)) {
      setTimeout(() => onZoomToLayer(layerId), 100);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Layers className="h-4 w-4" aria-hidden="true" />
            Clusters ({visibleClusterCount})
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Select Clusters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {clusterLayers.map(layer => (
            <DropdownMenuCheckboxItem
              key={layer.id}
              checked={visibleLayers.has(layer.id)}
              onCheckedChange={() => handleClusterToggle(layer.id)}
              disabled={loading.has(layer.id)}
              className="gap-2"
            >
              <span
                className="w-3 h-3 rounded border shrink-0"
                style={{
                  backgroundColor: layer.fillColor,
                  borderColor: layer.color,
                  borderWidth: 2,
                }}
              />
              <span className="flex-1">{layer.name}</span>
              {loading.has(layer.id) && (
                <span className="text-xs text-muted-foreground">Loading...</span>
              )}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
