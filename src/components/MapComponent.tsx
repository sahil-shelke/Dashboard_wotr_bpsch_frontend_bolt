import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapComponentProps {
  geojsonData?: GeoJSON.FeatureCollection | null;
  height?: string;
}

export default function MapComponent({ geojsonData, height = "500px" }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([0, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
    if (!mapRef.current || !geojsonData) return;

    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.remove();
    }

    geojsonLayerRef.current = L.geoJSON(geojsonData, {
      style: () => ({
        color: "#2E7D32",
        weight: 2,
        opacity: 0.8,
        fillColor: "#66BB6A",
        fillOpacity: 0.3,
      }),
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const popupContent = Object.entries(feature.properties)
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join("<br>");
          layer.bindPopup(popupContent);
        }
      },
    }).addTo(mapRef.current);

    const bounds = geojsonLayerRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geojsonData]);

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}
