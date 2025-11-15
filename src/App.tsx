import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'

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

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#F5F3E7]">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto">
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
      </div>
    </BrowserRouter>
  )
}

export default App
