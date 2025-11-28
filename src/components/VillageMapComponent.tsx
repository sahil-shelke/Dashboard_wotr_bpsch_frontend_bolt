import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM } from "../config/mapLayers";
import ComprehensiveFarmerModal from "./ComprehensiveFarmerModal";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface VillageMapComponentProps {
  height?: string;
  villageCode: string | null;
}

interface FarmerCompleteData {
  farmer: {
    geometry: {
      type: string;
      geometry: GeoJSON.Geometry | null;
      properties: Record<string, any> | null;
    } | null;
    farmer_id: string;
    block_code: string;
    farmer_name: string;
    surveyor_id: string;
    village_code: string;
    district_code: string;
    farmer_mobile: string;
    farmer_category: string;
  };
  crop_registration: any;
  land_preparation: any;
  seed_selection: any;
  nutrient_management: any;
  weed_management: any;
  pest_management: any;
  irrigation: any;
  harvesting_management: any;
  crop_master: any;
  village: any;
  block: any;
  district: any;
}

type MapType = "street" | "satellite";

export default function VillageMapComponent({
  height = "500px",
  villageCode,
}: VillageMapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const farmerLayerRef = useRef<L.GeoJSON | null>(null);

  const [mapType, setMapType] = useState<MapType>("satellite");
  const [farmerData, setFarmerData] = useState<FarmerCompleteData[]>([]);
  const [selectedFarmer, setSelectedFarmer] =
    useState<FarmerCompleteData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------
  // MAP INITIALIZATION
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    // Avoid container mismatch crash
    if (
      mapRef.current &&
      mapRef.current.getContainer() !== containerRef.current
    ) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(
        MAHARASHTRA_CENTER,
        MAHARASHTRA_ZOOM
      );

      baseTileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles © Esri",
          maxZoom: 18,
          minZoom: 6,
        }
      ).addTo(mapRef.current);
    }
  }, []);

  // ---------------------------------------------------------------
  // SWITCH BASEMAP
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    if (baseTileLayerRef.current) {
      mapRef.current.removeLayer(baseTileLayerRef.current);
    }

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
      baseTileLayerRef.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 18,
          minZoom: 6,
        }
      ).addTo(mapRef.current);
    }
  }, [mapType]);

  // ---------------------------------------------------------------
  // FETCH FARMERS WHEN VILLAGE CHANGES
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!villageCode) {
      setFarmerData([]);
      return;
    }

    const fetchFarmers = async () => {
      setLoadingFarmers(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/farmers/geojson/${villageCode}`
        );
        if (!response.ok) throw new Error("Failed to fetch farmer data");
        const data: FarmerCompleteData[] = await response.json();
        setFarmerData(data);
      } catch (err) {
        console.error("Error fetching farmers:", err);
        setError("Failed to load farmer data");
        setFarmerData([]);
      } finally {
        setLoadingFarmers(false);
      }
    };

    fetchFarmers();
  }, [villageCode]);

  // ---------------------------------------------------------------
  // DRAW FARMERS ON MAP (SAFE WITH NULL GEOMETRY)
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous layer
    if (farmerLayerRef.current) {
      mapRef.current.removeLayer(farmerLayerRef.current);
      farmerLayerRef.current = null;
    }

    // Filter only farmers that have valid geometry
    const validFarmers = farmerData.filter(
      (f) => f?.farmer?.geometry?.geometry
    );

    if (validFarmers.length === 0) return;

    const features: GeoJSON.Feature[] = validFarmers.map((farmerRecord) => ({
      type: "Feature",
      geometry: farmerRecord.farmer.geometry!.geometry!,
      properties: {
        ...(farmerRecord.farmer.geometry?.properties ?? {}),
        farmer_id: farmerRecord.farmer.farmer_id,
        farmer_name: farmerRecord.farmer.farmer_name,
        farmer_mobile: farmerRecord.farmer.farmer_mobile,
      },
    }));

    const featureCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    farmerLayerRef.current = L.geoJSON(featureCollection, {
      style: () => ({
        color: "#2563eb",
        weight: 2,
        opacity: 0.8,
        fillColor: "#3b82f6",
        fillOpacity: 0.3,
      }),
      onEachFeature: (feature, layer) => {
        const farmerName = feature.properties?.farmer_name || "Unknown";
        const farmerMobile = feature.properties?.farmer_mobile || "N/A";

        const tooltipContent = `
          <div style="font-family: sans-serif;">
            <strong>${farmerName}</strong><br/>
            ${farmerMobile}
          </div>
        `;

        layer.bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
          className: "custom-tooltip",
        });

        layer.on("click", () => {
          const farmer = validFarmers.find(
            (f) => f.farmer.farmer_id === feature.properties?.farmer_id
          );
          if (farmer) {
            setSelectedFarmer(farmer);
            setIsModalOpen(true);
          }
        });

        layer.on("mouseover", function () {
          this.setStyle({
            fillOpacity: 0.6,
            weight: 3,
          });
        });

        layer.on("mouseout", function () {
          this.setStyle({
            fillOpacity: 0.3,
            weight: 2,
          });
        });
      },
    }).addTo(mapRef.current);

    const bounds = farmerLayerRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [farmerData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMapType("street")}
          className={`px-4 py-2 rounded ${
            mapType === "street" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Street View
        </button>

        <button
          onClick={() => setMapType("satellite")}
          className={`px-4 py-2 rounded ${
            mapType === "satellite" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Satellite View
        </button>

        {farmerData.length > 0 && (
          <span className="text-sm text-gray-600 ml-auto">
            {farmerData.length} farmer
            {farmerData.length !== 1 ? "s" : ""} loaded
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {loadingFarmers && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          Loading farmer data...
        </div>
      )}

      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="rounded-lg border z-0 relative"
      />

      <ComprehensiveFarmerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        farmerData={selectedFarmer}
      />
    </div>
  );
}
