import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapLayers, MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM, type MapLayer } from "../config/mapLayers";
import MapControls from "./MapControls";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapComponentProps {
  height?: string;
}

type MapType = "street" | "satellite";

export default function MapComponent({ height = "500px" }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef(new Map<string, L.GeoJSON>());
  const markersRef = useRef(new Map<string, L.Marker>());
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(["maharashtra", "district"]));
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<Map<string, GeoJSON.FeatureCollection>>(new Map());
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapType>("street");

  const staticLayers = new Set(["maharashtra", "district"]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM);

      baseTileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
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

    if (mapType === "satellite") {
      baseTileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles © Esri",
          maxZoom: 18,
          minZoom: 6,
        }
      ).addTo(mapRef.current);
    } else {
      baseTileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
        minZoom: 6,
      }).addTo(mapRef.current);
    }
  }, [mapType]);

  const loadLayer = async (layer: MapLayer) => {
    if (loadedData.has(layer.id)) return;

    setLoading((prev) => new Set(prev).add(layer.id));
    setError(null);

    try {
      const response = await fetch(layer.path);
      if (!response.ok) throw new Error(`Failed to load ${layer.name}`);

      const data: GeoJSON.FeatureCollection = await response.json();

      setLoadedData((prev) => new Map(prev).set(layer.id, data));
    } catch {
      setError(`Error loading ${layer.name}`);
      setVisibleLayers((prev) => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    mapLayers.forEach((layer) => {
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
                    .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
                    .join("<br>");
                  leafletLayer.bindPopup(popupContent);
                }
              },
            }).addTo(mapRef.current);

            layersRef.current.set(layer.id, geoJsonLayer);

            if (layer.level === "cluster" && data.features.length > 0) {
              const bounds = geoJsonLayer.getBounds();
              const center = bounds.getCenter();

              const marker = L.marker(center, { title: layer.name }).addTo(mapRef.current);
              marker.bindPopup(`<strong>${layer.name}</strong>`);

              markersRef.current.set(layer.id, marker);
            }
          }
        }
      } else {
        const existing = layersRef.current.get(layer.id);
        if (existing && mapRef.current) {
          mapRef.current.removeLayer(existing);
          layersRef.current.delete(layer.id);
        }

        const marker = markersRef.current.get(layer.id);
        if (marker && mapRef.current) {
          mapRef.current.removeLayer(marker);
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
    if (staticLayers.has(layerId)) return;

    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
        if (selectedLayer === layerId) setSelectedLayer(null);
      } else next.add(layerId);
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
      <MapControls
        groupedLayers={groupedLayers}
        visibleLayers={visibleLayers}
        loading={loading}
        mapType={mapType}
        selectedLayer={selectedLayer}
        onToggleLayer={toggleLayer}
        onMapTypeChange={setMapType}
        onZoomToLayer={zoomToLayer}
      />

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="rounded-lg border z-0 relative"
      />
    </div>
  );
}
