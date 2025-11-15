import { useEffect, useState } from 'react'
import { Users, UserCheck, Droplets, AlertTriangle, TrendingUp, Calendar, MapPin, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function MainDashboard() {
  const [stats, setStats] = useState({
    farmers: 0,
    surveyors: 0,
    irrigationEvents: 0,
    alerts: 0
  })

  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [farmersRes, surveyorsRes, irrigationRes] = await Promise.all([
          fetch('http://localhost:5000/api/farmers'),
          fetch('http://localhost:5000/api/surveyors'),
          fetch('http://localhost:5000/api/farm-management/irrigation')
        ])

        const farmers = await farmersRes.json()
        const surveyors = await surveyorsRes.json()
        const irrigation = await irrigationRes.json()

        setStats({
          farmers: Array.isArray(farmers) ? farmers.length : 0,
          surveyors: Array.isArray(surveyors) ? surveyors.length : 0,
          irrigationEvents: Array.isArray(irrigation) ? irrigation.length : 0,
          alerts: 12
        })

        setActivities([
          { action: 'New farmer registered', user: 'System', time: '5 mins ago', type: 'success' },
          { action: 'Irrigation scheduled', user: 'John Doe', time: '12 mins ago', type: 'info' },
          { action: 'Pest alert triggered', user: 'Alert System', time: '1 hour ago', type: 'warning' },
          { action: 'Harvest completed', user: 'Mike Smith', time: '2 hours ago', type: 'success' },
          { action: 'Soil moisture low', user: 'Sensor #42', time: '3 hours ago', type: 'warning' },
        ])

      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const cropDistribution = [
    { name: 'Wheat', value: 400, color: '#7CB342' },
    { name: 'Rice', value: 300, color: '#1B5E20' },
    { name: 'Cotton', value: 200, color: '#388E3C' },
    { name: 'Sugarcane', value: 100, color: '#C5E1A5' },
  ]

  const farmOperations = [
    { month: 'Jan', completed: 40, pending: 10 },
    { month: 'Feb', completed: 55, pending: 15 },
    { month: 'Mar', completed: 65, pending: 8 },
    { month: 'Apr', completed: 78, pending: 12 },
    { month: 'May', completed: 85, pending: 5 },
    { month: 'Jun', completed: 92, pending: 8 },
  ]

  const weatherTrends = [
    { day: 'Mon', temp: 28, humidity: 65 },
    { day: 'Tue', temp: 30, humidity: 60 },
    { day: 'Wed', temp: 32, humidity: 58 },
    { day: 'Thu', temp: 29, humidity: 70 },
    { day: 'Fri', temp: 27, humidity: 75 },
    { day: 'Sat', temp: 26, humidity: 80 },
    { day: 'Sun', temp: 28, humidity: 68 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your farms today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card card-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Farmers</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.farmers}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12% this month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#1B5E20]" />
            </div>
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Surveyors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.surveyors}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+5% this month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Irrigation Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.irrigationEvents}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-cyan-600">
                <Activity className="w-4 h-4" />
                <span>Last 30 days</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <Droplets className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="stat-card card-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.alerts}</p>
              <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Requires attention</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Farm Operations Progress</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]">
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={farmOperations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#1B5E20" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#FFA000" name="Pending" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Crop Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={cropDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {cropDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Weather Trends</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weatherTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="temp" stroke="#FF6F00" strokeWidth={2} name="Temperature (°C)" />
              <Line type="monotone" dataKey="humidity" stroke="#1B5E20" strokeWidth={2} name="Humidity (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.user} · {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-[#1B5E20] hover:bg-green-50 rounded-lg transition-colors">
            View All Activities
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Farm Locations</h2>
          <button className="flex items-center gap-2 text-sm font-medium text-[#1B5E20] hover:text-green-700">
            <MapPin className="w-4 h-4" />
            View Map
          </button>
        </div>
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Interactive map will be displayed here</p>
            <p className="text-xs text-gray-400 mt-1">Showing {stats.farmers} farm locations</p>
          </div>
        </div>
      </div>
    </div>
  )
}
