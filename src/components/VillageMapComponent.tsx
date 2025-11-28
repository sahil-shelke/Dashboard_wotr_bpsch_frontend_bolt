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

interface StationMetadata {
  station_id: number;
  station_name: string;
  latitude: string;
  longitude: string;
  elevation: string;
  village_code: string;
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
  const stationMarkerRef = useRef<L.Marker | null>(null);

  const [mapType, setMapType] = useState<MapType>("satellite");
  const [farmerData, setFarmerData] = useState<FarmerCompleteData[]>([]);
  const [selectedFarmer, setSelectedFarmer] =
    useState<FarmerCompleteData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stationData, setStationData] = useState<StationMetadata | null>(null);
  const [stationTemperature, setStationTemperature] = useState<number | null>(null);
  const [allStations, setAllStations] = useState<StationMetadata[]>([]);
  const [stationTemperatures, setStationTemperatures] = useState<Record<string, number>>({});
  const allStationMarkersRef = useRef<L.Marker[]>([]);

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
  // FETCH ALL STATIONS ON MOUNT
  // ---------------------------------------------------------------
  useEffect(() => {
    const fetchAllStations = async () => {
      try {
        const stationResponse = await fetch(`/api/villages/station_metadata`);
        if (stationResponse.ok) {
          const stations: StationMetadata[] = await stationResponse.json();
          setAllStations(stations);

          const today = new Date().toISOString().split('T')[0];
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const tempPromises = stations.map(async (station) => {
            try {
              const tempResponse = await fetch(
                `/api/farm-management/davis-weather-v_code?start_date=${thirtyDaysAgo}&end_date=${today}&village_code=${encodeURIComponent(station.village_code)}`
              );
              if (tempResponse.ok) {
                const tempData = await tempResponse.json();
                if (Array.isArray(tempData) && tempData.length > 0) {
                  const latestTemp = tempData[tempData.length - 1];
                  return [station.village_code, Number(latestTemp.temp_c ?? latestTemp.temp ?? null)];
                }
              }
            } catch {
              return null;
            }
            return null;
          });

          const temps = await Promise.all(tempPromises);
          const tempMap: Record<string, number> = {};
          temps.forEach(t => {
            if (t && t[1] !== null) {
              tempMap[t[0]] = t[1];
            }
          });
          setStationTemperatures(tempMap);
        }
      } catch (err) {
        console.error("Error fetching all stations:", err);
      }
    };

    fetchAllStations();
  }, []);

  // ---------------------------------------------------------------
  // FETCH FARMERS AND STATION WHEN VILLAGE CHANGES
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!villageCode) {
      setFarmerData([]);
      setStationData(null);
      setStationTemperature(null);
      return;
    }

    const fetchData = async () => {
      setLoadingFarmers(true);
      setError(null);

      try {
        const [farmersResponse, stationResponse] = await Promise.all([
          fetch(`/api/farmers/geojson/${villageCode}`),
          fetch(`/api/villages/station_metadata`),
        ]);

        if (!farmersResponse.ok) throw new Error("Failed to fetch farmer data");
        const farmersData: FarmerCompleteData[] = await farmersResponse.json();
        setFarmerData(farmersData);

        if (stationResponse.ok) {
          const allStations: StationMetadata[] = await stationResponse.json();
          const station = allStations.find(s => s.village_code === villageCode);
          setStationData(station || null);

          if (station) {
            const today = new Date().toISOString().split('T')[0];
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const tempResponse = await fetch(
              `/api/farm-management/davis-weather-v_code?start_date=${thirtyDaysAgo}&end_date=${today}&village_code=${encodeURIComponent(station.village_code)}`
            );

            if (tempResponse.ok) {
              const tempData = await tempResponse.json();
              if (Array.isArray(tempData) && tempData.length > 0) {
                const latestTemp = tempData[tempData.length - 1];
                setStationTemperature(Number(latestTemp.temp_c ?? latestTemp.temp ?? null));
              } else {
                setStationTemperature(null);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
        setFarmerData([]);
        setStationData(null);
        setStationTemperature(null);
      } finally {
        setLoadingFarmers(false);
      }
    };

    fetchData();
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

    if (villageCode) {
      const bounds = farmerLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [farmerData, villageCode]);

  // ---------------------------------------------------------------
  // RESET MAP VIEW WHEN NO VILLAGE SELECTED
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    if (!villageCode) {
      mapRef.current.setView(MAHARASHTRA_CENTER, MAHARASHTRA_ZOOM);
    }
  }, [villageCode]);

  // ---------------------------------------------------------------
  // DRAW ALL WEATHER STATION MARKERS WHEN NO VILLAGE SELECTED
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up all station markers
    allStationMarkersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    allStationMarkersRef.current = [];

    // If no village selected, show all stations
    if (!villageCode && allStations.length > 0) {
      allStations.forEach(station => {
        const lat = parseFloat(station.latitude);
        const lng = parseFloat(station.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        const weatherIcon = L.divIcon({
          className: 'custom-weather-icon',
          html: `
            <div style="
              background-color: #ef4444;
              border: 3px solid white;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              font-size: 18px;
            ">
              ☀️
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const temp = stationTemperatures[station.village_code];
        const tooltipContent = `
          <div style="font-family: sans-serif;">
            <strong>Weather Station</strong><br/>
            ${station.station_name}<br/>
            <small>Elevation: ${station.elevation}m</small>
            ${temp !== undefined && temp !== null ? `<br/><strong>Current Temp: ${temp.toFixed(1)}°C</strong>` : ''}
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: weatherIcon })
          .addTo(mapRef.current!)
          .bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
          });

        allStationMarkersRef.current.push(marker);
      });

      return;
    }
  }, [villageCode, allStations, stationTemperatures]);

  // ---------------------------------------------------------------
  // DRAW WEATHER STATION MARKER FOR SELECTED VILLAGE
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous marker
    if (stationMarkerRef.current) {
      mapRef.current.removeLayer(stationMarkerRef.current);
      stationMarkerRef.current = null;
    }

    if (!stationData || !villageCode) return;

    const lat = parseFloat(stationData.latitude);
    const lng = parseFloat(stationData.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const weatherIcon = L.divIcon({
      className: 'custom-weather-icon',
      html: `
        <div style="
          background-color: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          font-size: 18px;
        ">
          ☀️
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const tooltipContent = `
      <div style="font-family: sans-serif;">
        <strong>Weather Station</strong><br/>
        ${stationData.station_name}<br/>
        <small>Elevation: ${stationData.elevation}m</small>
        ${stationTemperature !== null ? `<br/><strong>Current Temp: ${stationTemperature.toFixed(1)}°C</strong>` : ''}
      </div>
    `;

    stationMarkerRef.current = L.marker([lat, lng], { icon: weatherIcon })
      .addTo(mapRef.current)
      .bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
      });
  }, [stationData, stationTemperature]);

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
