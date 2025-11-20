import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";

import { Fragment, useEffect, useState } from "react";

// PAGES
import LoginPage from "./tabs/LoginPage";
import MainDashboard from "./tabs/MainDashboard";
import LandPreparation from "./tabs/LandPreparation";
import IrrigationManagement from "./tabs/IrrigationManagement";
import SeedSelectionTable from "./tabs/SeedSelection";
import NutrientManagement from "./tabs/NutrientManagement";
import WeedManagementTable from "./tabs/WeedManagement";
import PestManagementTable from "./tabs/PestManagement";
import HarvestingManagementTable from "./tabs/HarvestManagement";
import SoilManagementTable from "./tabs/SoilMoistureManual";
import PestObservationTable from "./tabs/PestSurvey";
import DiseaseObservationTable from "./tabs/DiseaseSurvey";
import PlantNutrients from "./tabs/PlantNutrients";
import FarmerRecordsTable from "./tabs/Farmers";
import SurveyorRecordsTable from "./tabs/Surveyors";
import CropRegistrationTable from "./tabs/CropRegistrations";
import SoilMoistureLiveTable from "./tabs/SoilMoistureSensor";
import WeatherStationTable from "./tabs/DavisWeather";

// ---------------------------------------------------
//  SESSION VALIDATION USING TOKEN + VERIFY SESSION
// ---------------------------------------------------
function useSessionCheck() {
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const token = localStorage.getItem("authToken");

        // If token missing, session invalid
        if (!token) {
          setVerified(false);
          setChecking(false);
          return;
        }

        const res = await fetch("http://localhost:5000/login/verify-session", {
          method: "GET",
          credentials: "include",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await res.json();

        // backend response:
        // { "email": "...", "valid": true }
        if (data?.valid === true) {
          setVerified(true);
        } else {
          setVerified(false);
        }
      } catch (err) {
        setVerified(false);
      }

      setChecking(false);
    }

    verify();
  }, []);

  return { checking, verified };
}

// ---------------------------------------------------
//  PROTECTED ROUTE WRAPPER
// ---------------------------------------------------
function Protected({ children }: any) {
  const { checking, verified } = useSessionCheck();

  if (checking) return <div className="p-6">Checking session...</div>;

  if (!verified) return <Navigate to="/login" replace />;

  return children;
}

// ---------------------------------------------------
//  MAIN APP CONTENT + SIDEBAR + HEADER
// ---------------------------------------------------
function AppContent() {
  const location = useLocation();

  // Hide sidebar + header on login page
  const hideLayout = location.pathname === "/login";

  const getBreadcrumbs = () => {
    const path = location.pathname;

    if (path === "/")
      return [{ label: "Dashboard", href: "/" }];

    const segments = path.split("/").filter(Boolean);
    const breadcrumbs = [{ label: "Dashboard", href: "/" }];

    const pathMap: Record<string, string> = {
      "land-preparation": "Land Preparation",
      irrigation: "Irrigation Management",
      "seed-selection": "Seed Selection",
      "nutrient-management": "Nutrient Management",
      "weed-management": "Weed Management",
      "pest-management": "Pest Management",
      "harvest-management": "Harvest Management",
      "soil-moisture-manual": "Manual Readings",
      "soil-moisture-sensor": "Sensor Data",
      "pest-survey": "Pest Survey",
      "disease-survey": "Disease Survey",
      "plant-nutrients": "Plant Nutrients",
      farmers: "Farmers",
      surveyors: "Surveyors",
      "crop-registrations": "Crop Registrations",
      weather: "Weather Stations",
    };

    segments.forEach((segment, index) => {
      const label =
        pathMap[segment] ||
        segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      breadcrumbs.push({
        label,
        href: "/" + segments.slice(0, index + 1).join("/"),
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // LOGIN PAGE (no layout)
  if (hideLayout) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  // LOGGED IN LAYOUT
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />

      <div className="ml-64 w-[calc(100%-16rem)] h-screen flex flex-col">
        
        {/* TOP HEADER */}
        <header className="flex h-16 items-center gap-2 bg-white border-b sticky top-0 px-6 z-10">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <Fragment key={crumb.href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* MAIN CONTENT */}
        <main className="w-full bg-[#F5E9D4]/20 overflow-auto flex-1">
          <div className="w-full p-6">
            <Routes>
              <Route path="/" element={<Protected><MainDashboard /></Protected>} />
              <Route path="/land-preparation" element={<Protected><LandPreparation /></Protected>} />
              <Route path="/irrigation" element={<Protected><IrrigationManagement /></Protected>} />
              <Route path="/seed-selection" element={<Protected><SeedSelectionTable /></Protected>} />
              <Route path="/nutrient-management" element={<Protected><NutrientManagement /></Protected>} />
              <Route path="/weed-management" element={<Protected><WeedManagementTable /></Protected>} />
              <Route path="/pest-management" element={<Protected><PestManagementTable /></Protected>} />
              <Route path="/harvest-management" element={<Protected><HarvestingManagementTable /></Protected>} />
              <Route path="/soil-moisture-manual" element={<Protected><SoilManagementTable /></Protected>} />
              <Route path="/soil-moisture-sensor" element={<Protected><SoilMoistureLiveTable /></Protected>} />
              <Route path="/pest-survey" element={<Protected><PestObservationTable /></Protected>} />
              <Route path="/disease-survey" element={<Protected><DiseaseObservationTable /></Protected>} />
              <Route path="/plant-nutrients" element={<Protected><PlantNutrients /></Protected>} />
              <Route path="/farmers" element={<Protected><FarmerRecordsTable /></Protected>} />
              <Route path="/surveyors" element={<Protected><SurveyorRecordsTable /></Protected>} />
              <Route path="/crop-registrations" element={<Protected><CropRegistrationTable /></Protected>} />
              <Route path="/weather" element={<Protected><WeatherStationTable /></Protected>} />

              {/* fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>

      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
