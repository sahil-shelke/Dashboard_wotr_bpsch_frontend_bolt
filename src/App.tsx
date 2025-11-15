import './App.css'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Home, Users, Tractor, Menu, X, Wheat, Droplets, Bug, Package, Activity, CloudRain } from 'lucide-react'

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

const navigation = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Farmers', path: '/farmers', icon: Users },
  { name: 'Surveyors', path: '/surveyors', icon: Activity },
  { name: 'Crops', path: '/crop-registrations', icon: Wheat },
]

const farmOps = [
  { name: 'Land Prep', path: '/land-preparation', icon: Tractor },
  { name: 'Seeds', path: '/seed-selection', icon: Package },
  { name: 'Irrigation', path: '/irrigation', icon: Droplets },
  { name: 'Nutrients', path: '/nutrient-management', icon: Activity },
  { name: 'Weeds', path: '/weed-management', icon: Wheat },
  { name: 'Pests', path: '/pest-management', icon: Bug },
  { name: 'Harvest', path: '/harvest-management', icon: Package },
]

const monitoring = [
  { name: 'Soil Manual', path: '/soil-moisture-manual', icon: Droplets },
  { name: 'Soil Sensor', path: '/soil-moisture-sensor', icon: Activity },
  { name: 'Pest Survey', path: '/pest-survey', icon: Bug },
  { name: 'Disease Survey', path: '/disease-survey', icon: Activity },
  { name: 'Plant Nutrients', path: '/plant-nutrients', icon: Wheat },
  { name: 'Weather', path: '/weather', icon: CloudRain },
]

function Navigation() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [farmOpsOpen, setFarmOpsOpen] = useState(false)
  const [monitoringOpen, setMonitoringOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Wheat className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AgriFlow
                </span>
              </Link>

              <div className="hidden lg:flex items-center gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}

                <div className="relative group">
                  <button
                    onMouseEnter={() => setFarmOpsOpen(true)}
                    onMouseLeave={() => setFarmOpsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
                  >
                    <Tractor className="w-4 h-4" />
                    Farm Operations
                  </button>
                  {farmOpsOpen && (
                    <div
                      onMouseEnter={() => setFarmOpsOpen(true)}
                      onMouseLeave={() => setFarmOpsOpen(false)}
                      className="absolute top-full left-0 mt-2 w-48 glass rounded-xl shadow-xl p-2 scale-in"
                    >
                      {farmOps.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-primary/10 transition-all"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <button
                    onMouseEnter={() => setMonitoringOpen(true)}
                    onMouseLeave={() => setMonitoringOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-all"
                  >
                    <Activity className="w-4 h-4" />
                    Monitoring
                  </button>
                  {monitoringOpen && (
                    <div
                      onMouseEnter={() => setMonitoringOpen(true)}
                      onMouseLeave={() => setMonitoringOpen(false)}
                      className="absolute top-full left-0 mt-2 w-48 glass rounded-xl shadow-xl p-2 scale-in"
                    >
                      {monitoring.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-primary/10 transition-all"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 glass">
            <div className="px-4 py-3 space-y-1">
              {[...navigation, ...farmOps, ...monitoring].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen gradient-mesh">
        <Navigation />
        <main className="pt-16">
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
      </div>
    </BrowserRouter>
  )
}

export default App
