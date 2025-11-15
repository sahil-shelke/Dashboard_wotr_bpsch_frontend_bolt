import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { Separator } from '@radix-ui/react-separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './components/ui/breadcrumb'
import MainDashboard from './tabs/MainDashboard'
import LandPreparation from './tabs/LandPreparation'
import IrrigationManagement from './tabs/IrrigationManagement'
import SeedSelectionTable from './tabs/SeedSelection'
import NutrientManagement from './tabs/NutrientManagement'
import WeedManagementTable from './tabs/WeedManagement'
import PestManagementTable from './tabs/PestManagement'
import HarvestingManagementTable from './tabs/HarvestManagement'
import SoilManagementTable from './tabs/SoilMoistureManual'
import PestObservationTable from './tabs/PestSurvey'
import DiseaseObservationTable from './tabs/DiseaseSurvey'
import PlantNutrients from './tabs/PlantNutrients'
import FarmerRecordsTable from './tabs/Farmers'
import SurveyorRecordsTable from './tabs/Surveyors'
import CropRegistrationTable from './tabs/CropRegistrations'
import SoilMoistureLiveTable from './tabs/SoilMoistureSensor'
import WeatherStationTable from './tabs/DavisWeather'
import { Fragment } from 'react'

function AppContent() {
  const location = useLocation()

  const getBreadcrumbs = () => {
    const path = location.pathname
    if (path === '/') return [{ label: 'Dashboard', href: '/' }]

    const segments = path.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Dashboard', href: '/' }]

    const pathMap: Record<string, string> = {
      'land-preparation': 'Land Preparation',
      'irrigation': 'Irrigation Management',
      'seed-selection': 'Seed Selection',
      'nutrient-management': 'Nutrient Management',
      'weed-management': 'Weed Management',
      'pest-management': 'Pest Management',
      'harvest-management': 'Harvest Management',
      'soil-moisture-manual': 'Manual Readings',
      'soil-moisture-sensor': 'Sensor Data',
      'pest-survey': 'Pest Survey',
      'disease-survey': 'Disease Survey',
      'plant-nutrients': 'Plant Nutrients',
      'farmers': 'Farmers',
      'surveyors': 'Surveyors',
      'crop-registrations': 'Crop Registrations',
      'weather': 'Weather Stations',
    }

    segments.forEach((segment, index) => {
      const label = pathMap[segment] || segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      breadcrumbs.push({
        label,
        href: '/' + segments.slice(0, index + 1).join('/')
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full">
        <header className="flex h-16 shrink-0 items-center gap-2 bg-white border-b border-[#6D4C41]/10 sticky top-0 z-10 w-full">
          <div className="flex items-center gap-2 px-6 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <Fragment key={crumb.href}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="text-[#2E3A3F] font-medium">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href} className="text-[#2E3A3F]/70 hover:text-[#1B5E20]">{crumb.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="w-full">
        <Routes>
          <Route path="/" element={<MainDashboard />} />
          <Route path="/land-preparation" element={<LandPreparation />} />
          <Route path="/irrigation" element={<IrrigationManagement />} />
          <Route path="/seed-selection" element={<SeedSelectionTable />} />
          <Route path="/nutrient-management" element={<NutrientManagement />} />
          <Route path="/weed-management" element={<WeedManagementTable />} />
          <Route path="/pest-management" element={<PestManagementTable />} />
          <Route path="/harvest-management" element={<HarvestingManagementTable />} />
          <Route path="/soil-moisture-manual" element={<SoilManagementTable />} />
          <Route path="/soil-moisture-sensor" element={<SoilMoistureLiveTable />} />
          <Route path="/pest-survey" element={<PestObservationTable />} />
          <Route path="/disease-survey" element={<DiseaseObservationTable />} />
          <Route path="/plant-nutrients" element={<PlantNutrients />} />
          <Route path="/farmers" element={<FarmerRecordsTable />} />
          <Route path="/surveyors" element={<SurveyorRecordsTable />} />
          <Route path="/crop-registrations" element={<CropRegistrationTable />} />
          <Route path="/weather" element={<WeatherStationTable />} />
        </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
