import './App.css'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { Separator } from '@radix-ui/react-separator'
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            
          </div>
        </header>
        {/* <LandPreparation /> */}
        {/* <IrrigationManagement /> */}
        {/* <SeedSelectionTable /> */}
      {/* <NutrientManagement /> */}
      {/* <WeedManagementTable /> */}
      {/* <PestManagementTable /> */}
      {/* <HarvestingManagementTable /> */}
      {/* <SoilManagementTable /> */}
      {/* <PestObservationTable /> */}
      {/* <DiseaseObservationTable /> */}
      {/* <PlantNutrients /> */}
      {/* <FarmerRecordsTable /> */}
      {/* <SurveyorRecordsTable /> */}
      {/* <CropRegistrationTable /> */}
      <SoilMoistureLiveTable />
      {/* <WeatherStationTable /> */}
     
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
