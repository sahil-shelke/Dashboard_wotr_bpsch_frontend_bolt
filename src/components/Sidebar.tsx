import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  Home,
  Users,
  UserCheck,
  Wheat,
  Tractor,
  Droplets,
  Package,
  Activity,
  Bug,
  Leaf,
  BarChart3,
  CloudRain,
  MapPin,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface NavItem {
  title: string
  path: string
  icon: any
}

interface NavGroup {
  title: string
  icon: any
  items: NavItem[]
}

const navigation: (NavItem | NavGroup)[] = [
  { title: 'Dashboard', path: '/', icon: Home },
  { title: 'Farmers', path: '/farmers', icon: Users },
  { title: 'Surveyors', path: '/surveyors', icon: UserCheck },
  { title: 'Crop Registrations', path: '/crop-registrations', icon: Wheat },
  {
    title: 'Farm Management',
    icon: Tractor,
    items: [
      { title: 'Land Preparation', path: '/land-preparation', icon: Tractor },
      { title: 'Seed Selection', path: '/seed-selection', icon: Package },
      { title: 'Irrigation', path: '/irrigation', icon: Droplets },
      { title: 'Nutrient Management', path: '/nutrient-management', icon: Activity },
      { title: 'Weed Management', path: '/weed-management', icon: Leaf },
      { title: 'Pest Management', path: '/pest-management', icon: Bug },
      { title: 'Harvest', path: '/harvest-management', icon: Package },
    ]
  },
  {
    title: 'Monitoring',
    icon: BarChart3,
    items: [
      { title: 'Soil Moisture (Manual)', path: '/soil-moisture-manual', icon: Droplets },
      { title: 'Soil Moisture (Sensor)', path: '/soil-moisture-sensor', icon: Activity },
      { title: 'Plant Nutrients', path: '/plant-nutrients', icon: Leaf },
      { title: 'Weather Stations', path: '/weather', icon: CloudRain },
    ]
  },
  {
    title: 'Surveys',
    icon: MapPin,
    items: [
      { title: 'Pest Survey', path: '/pest-survey', icon: Bug },
      { title: 'Disease Survey', path: '/disease-survey', icon: Activity },
    ]
  }
]

export function Sidebar() {
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<string[]>(['Farm Management', 'Monitoring', 'Surveys'])

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const isActive = (path: string) => location.pathname === path

  const isGroupActive = (items: NavItem[]) =>
    items.some(item => location.pathname === item.path)

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 sidebar-shadow flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1B5E20] rounded-lg flex items-center justify-center">
            <Wheat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AgriFlow</h1>
            <p className="text-xs text-gray-500">Farm Management</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item, index) => {
            if ('items' in item) {
              const isOpen = openGroups.includes(item.title)
              const hasActive = isGroupActive(item.items)

              return (
                <div key={index}>
                  <button
                    onClick={() => toggleGroup(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hasActive
                        ? 'bg-green-50 text-[#1B5E20]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1 animate-slide-in">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(subItem.path)
                              ? 'bg-[#1B5E20] text-white font-medium'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#1B5E20] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="px-3 py-2 bg-green-50 rounded-lg">
          <p className="text-xs font-medium text-[#1B5E20]">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">All Systems Online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
