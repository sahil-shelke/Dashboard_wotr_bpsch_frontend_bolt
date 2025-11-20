import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapLayers, MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM, type MapLayer } from "../config/mapLayers";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapComponentProps {
  height?: string;
}

export default function MapComponent({ height = "500px" }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Map<string, L.GeoJSON>>(new Map());

  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(['maharashtra'])
  );
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<Map<string, GeoJSON.FeatureCollection>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
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
          }
        }
      } else {
        const existingLayer = layersRef.current.get(layer.id);
        if (existingLayer && mapRef.current) {
          mapRef.current.removeLayer(existingLayer);
          layersRef.current.delete(layer.id);
        }
      }
    });
  }, [visibleLayers, loadedData]);

  const toggleLayer = (layerId: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {Object.entries(groupedLayers).map(([level, layers]) => (
          <div key={level} className="flex-1 min-w-[200px]">
            <h4 className="text-sm font-semibold mb-2 capitalize">{level}</h4>
            <div className="space-y-1">
              {layers.map(layer => (
                <label
                  key={layer.id}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={visibleLayers.has(layer.id)}
                    onChange={() => toggleLayer(layer.id)}
                    disabled={loading.has(layer.id)}
                    className="cursor-pointer"
                  />
                  <span
                    className="w-4 h-4 rounded border"
                    style={{
                      backgroundColor: layer.fillColor,
                      borderColor: layer.color,
                      borderWidth: 2,
                    }}
                  />
                  <span>{layer.name}</span>
                  {loading.has(layer.id) && (
                    <span className="text-xs text-gray-500">Loading...</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
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
