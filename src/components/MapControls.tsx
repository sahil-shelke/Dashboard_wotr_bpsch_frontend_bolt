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
  const visibleLayerCount = visibleLayers.size;

  const visibleLayersList = Array.from(visibleLayers)
    .map(layerId => {
      for (const layers of Object.values(groupedLayers)) {
        const layer = layers.find(l => l.id === layerId);
        if (layer) return layer;
      }
      return undefined;
    })
    .filter((layer): layer is MapLayer => layer !== undefined);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Layers className="h-4 w-4" aria-hidden="true" />
            Layers ({visibleLayerCount})
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {Object.entries(groupedLayers).map(([level, layers], idx) => (
            <div key={level}>
              {idx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="capitalize">{level}</DropdownMenuLabel>
              {layers.map(layer => (
                <DropdownMenuCheckboxItem
                  key={layer.id}
                  checked={visibleLayers.has(layer.id)}
                  onCheckedChange={() => onToggleLayer(layer.id)}
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
            </div>
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

      {visibleLayerCount > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Zoom To
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Zoom to Layer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={selectedLayer || ''} onValueChange={(value) => onZoomToLayer(value)}>
              {visibleLayersList.map(layer => (
                <DropdownMenuRadioItem
                  key={layer.id}
                  value={layer.id}
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
                  {layer.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
