import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronDown, Layers, Map } from "lucide-react";
import { mapLayers, MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM, type MapLayer } from "../config/mapLayers";
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
import { Button } from "./ui/button";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapComponentProps {
  height?: string;
}

type MapType = 'street' | 'satellite';

export default function MapComponent({ height = "500px" }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Map<string, L.GeoJSON>>(new Map());
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(['maharashtra'])
  );
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<Map<string, GeoJSON.FeatureCollection>>(new Map());
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapType>('street');

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM);

      baseTileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 6,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !baseTileLayerRef.current) return;

    mapRef.current.removeLayer(baseTileLayerRef.current);

    if (mapType === 'satellite') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 18,
          minZoom: 6,
        }
      ).addTo(mapRef.current);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 6,
        }
      ).addTo(mapRef.current);
    }
  }, [mapType]);

  const loadLayer = async (layer: MapLayer) => {
    if (loadedData.has(layer.id)) return;

    setLoading(prev => new Set(prev).add(layer.id));
    setError(null);

    try {
      const response = await fetch(layer.path);
      if (!response.ok) {
        throw new Error(`Failed to load ${layer.name}`);
      }
      const data = await response.json();
      setLoadedData(prev => new Map(prev).set(layer.id, data));
    } catch (err) {
      setError(`Error loading ${layer.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setVisibleLayers(prev => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    } finally {
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    mapLayers.forEach(layer => {
      if (visibleLayers.has(layer.id)) {
        if (!loadedData.has(layer.id)) {
          loadLayer(layer);
        } else if (!layersRef.current.has(layer.id)) {
          const data = loadedData.get(layer.id);
          if (data) {
            const geoJsonLayer = L.geoJSON(data, {
              style: () => ({
                color: layer.color,
                weight: layer.weight,
                opacity: 0.8,
                fillColor: layer.fillColor,
                fillOpacity: layer.fillOpacity,
              }),
              onEachFeature: (feature, leafletLayer) => {
                if (feature.properties) {
                  const popupContent = Object.entries(feature.properties)
                    .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                    .join("<br>");
                  leafletLayer.bindPopup(popupContent);
                }
              },
            }).addTo(mapRef.current!);

            layersRef.current.set(layer.id, geoJsonLayer);

            if (layer.level === 'cluster' && data.features.length > 0) {
              const bounds = geoJsonLayer.getBounds();
              const center = bounds.getCenter();

              const marker = L.marker(center, {
                title: layer.name,
              }).addTo(mapRef.current!);

              marker.bindPopup(`<strong>${layer.name}</strong>`);
              markersRef.current.set(layer.id, marker);
            }
          }
        }
      } else {
        const existingLayer = layersRef.current.get(layer.id);
        if (existingLayer && mapRef.current) {
          mapRef.current.removeLayer(existingLayer);
          layersRef.current.delete(layer.id);
        }

        const existingMarker = markersRef.current.get(layer.id);
        if (existingMarker && mapRef.current) {
          mapRef.current.removeLayer(existingMarker);
          markersRef.current.delete(layer.id);
        }
      }
    });
  }, [visibleLayers, loadedData]);

  const zoomToLayer = (layerId: string) => {
    if (!mapRef.current) return;

    const geoJsonLayer = layersRef.current.get(layerId);
    if (geoJsonLayer) {
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        setSelectedLayer(layerId);
      }
    }
  };

  const toggleLayer = (layerId: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
        if (selectedLayer === layerId) {
          setSelectedLayer(null);
        }
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const groupedLayers = mapLayers.reduce((acc, layer) => {
    if (!acc[layer.level]) acc[layer.level] = [];
    acc[layer.level].push(layer);
    return acc;
  }, {} as Record<string, MapLayer[]>);

  const visibleLayerCount = visibleLayers.size;

  return (
    <div className="space-y-4">
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
                    onCheckedChange={() => toggleLayer(layer.id)}
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
            <DropdownMenuRadioGroup value={mapType} onValueChange={(value) => setMapType(value as MapType)}>
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
              <DropdownMenuRadioGroup value={selectedLayer || ''} onValueChange={(value) => zoomToLayer(value)}>
                {Array.from(visibleLayers)
                  .map(layerId => mapLayers.find(l => l.id === layerId))
                  .filter((layer): layer is MapLayer => layer !== undefined)
                  .map(layer => (
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

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div ref={containerRef} style={{ height, width: "100%" }} className="rounded-lg border" />
    </div>
  );
}
