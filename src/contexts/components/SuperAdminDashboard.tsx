import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { AddSupervisorPage } from './AddSupervisorPage';
import {
  Droplets,
  LogOut,
  LayoutDashboard,
  Users,
  TrendingUp,
  Award,
  FileText,
  UserPlus,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  Search,
  MapPin,
  Map,
  Building2,
  Home,
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Village Wise Report Generator', icon: FileText },
    { id: 'add-supervisor', label: 'Add Supervisor', icon: UserPlus },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'reports':
        return <VillageReportsView />;
      case 'add-supervisor':
        return <AddSupervisorPage />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        items={navItems}
        activeItem={activeView}
        onItemClick={setActiveView}
        logo={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">WGS</h1>
              <p className="text-xs text-gray-600">Super Admin</p>
            </div>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {navItems.find(item => item.id === activeView)?.label}
                </h1>
                <p className="text-xs text-gray-600">Super Admin Portal</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 px-6 lg:px-8 py-8 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

interface DashboardStats {
  states: number;
  districts: number;
  blocks: number;
  villages: number;
}

const DashboardView = () => {
  const [stats, setStats] = useState<DashboardStats>({
    states: 0,
    districts: 0,
    blocks: 0,
    villages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/api/response/approved_villages');

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();

        const uniqueVillages = data.filter(
          (village: VillageData, index: number, self: VillageData[]) =>
            index === self.findIndex((v: VillageData) => v.village_profile_id === village.village_profile_id)
        );

        const uniqueStates = new Set(data.map((v: VillageData) => v.state_name));
        const uniqueDistricts = new Set(data.map((v: VillageData) => v.district_name));
        const uniqueBlocks = new Set(data.map((v: VillageData) => v.block_name));

        setStats({
          states: uniqueStates.size,
          districts: uniqueDistricts.size,
          blocks: uniqueBlocks.size,
          villages: uniqueVillages.length,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total States', value: stats.states, icon: Map, color: 'blue' },
    { label: 'Total Districts', value: stats.districts, icon: Building2, color: 'green' },
    { label: 'Total Blocks', value: stats.blocks, icon: MapPin, color: 'amber' },
    { label: 'Total Villages', value: stats.villages, icon: Home, color: 'cyan' },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Overview
        </h2>
        <p className="text-gray-600">
          Here's an overview of water governance across all regions
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading dashboard data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      colorClasses[stat.color as keyof typeof colorClasses]
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface VillageData {
  village_profile_id: number;
  village_name: string;
  block_name: string;
  district_name: string;
  state_name: string;
  full_name: string;
  email: string;
  language_id: number;
}

const VillageReportsView = () => {
  const [villages, setVillages] = useState<VillageData[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [villageSearch, setVillageSearch] = useState<string>('');

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/api/response/approved_villages');

        if (!response.ok) {
          throw new Error('Failed to fetch villages');
        }

        const data = await response.json();

        const uniqueVillages = data.filter(
          (village: VillageData, index: number, self: VillageData[]) =>
            index === self.findIndex((v) => v.village_profile_id === village.village_profile_id)
        );

        setVillages(uniqueVillages);
      } catch (err) {
        setError('Failed to load villages. Please try again.');
        console.error('Error fetching villages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVillages();
  }, []);

  const toggleVillageSelection = (villageId: number) => {
    setSelectedVillages((prev) =>
      prev.includes(villageId)
        ? prev.filter((id) => id !== villageId)
        : [...prev, villageId]
    );
  };

  const getUniqueStates = () => {
    const states = [...new Set(villages.map((v) => v.state_name))];
    return states.sort();
  };

  const getUniqueDistricts = () => {
    const filtered = selectedState
      ? villages.filter((v) => v.state_name === selectedState)
      : villages;
    const districts = [...new Set(filtered.map((v) => v.district_name))];
    return districts.sort();
  };

  const getUniqueBlocks = () => {
    let filtered = villages;
    if (selectedState) {
      filtered = filtered.filter((v) => v.state_name === selectedState);
    }
    if (selectedDistrict) {
      filtered = filtered.filter((v) => v.district_name === selectedDistrict);
    }
    const blocks = [...new Set(filtered.map((v) => v.block_name))];
    return blocks.sort();
  };

  const filteredVillages = villages.filter((village) => {
    if (selectedState && village.state_name !== selectedState) return false;
    if (selectedDistrict && village.district_name !== selectedDistrict) return false;
    if (selectedBlock && village.block_name !== selectedBlock) return false;
    if (villageSearch) {
      const query = villageSearch.toLowerCase();
      return (
        village.village_name.toLowerCase().includes(query) ||
        village.full_name.toLowerCase().includes(query) ||
        village.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict('');
    setSelectedBlock('');
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedBlock('');
  };

  const clearFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock('');
    setVillageSearch('');
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredVillages.map((v) => v.village_profile_id);
    const allFilteredSelected = filteredIds.every((id) => selectedVillages.includes(id));

    if (allFilteredSelected) {
      setSelectedVillages(selectedVillages.filter((id) => !filteredIds.includes(id)));
    } else {
      const newSelected = [...new Set([...selectedVillages, ...filteredIds])];
      setSelectedVillages(newSelected);
    }
  };

  const handleExport = async () => {
    if (selectedVillages.length === 0) return;

    setIsExporting(true);
    setExportMessage(null);

    try {
      const exportPromises = selectedVillages.map(async (villageId) => {
        const response = await fetch(
          `http://localhost:8000/api/response/generate_report/${villageId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to generate report for village ID: ${villageId}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const villageName = villages.find((v) => v.village_profile_id === villageId)?.village_name || `village_${villageId}`;
        a.download = `report_${villageName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });

      await Promise.all(exportPromises);

      setExportMessage({
        type: 'success',
        text: `Successfully exported ${selectedVillages.length} report(s)`,
      });

      setTimeout(() => {
        setExportMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Export error:', err);
      setExportMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to export reports. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Village Wise Report Generator
        </h2>
        <p className="text-gray-600">
          Select villages and export their comprehensive water governance reports
        </p>
      </div>

      {exportMessage && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            exportMessage.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {exportMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              exportMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {exportMessage.text}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Approved Villages
              </h3>
              {!isLoading && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedVillages.length} of {filteredVillages.length} selected
                  {(selectedState || selectedDistrict || selectedBlock || villageSearch) &&
                    ` (filtered from ${villages.length} total)`}
                </p>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={selectedVillages.length === 0 || isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-2.5 px-5 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export Reports ({selectedVillages.length})
                </>
              )}
            </button>
          </div>
        </div>

        {!isLoading && !error && villages.length > 0 && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Filter Villages</h4>
              {(selectedState || selectedDistrict || selectedBlock || villageSearch) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">All States</option>
                  {getUniqueStates().map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedState}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Districts</option>
                  {getUniqueDistricts().map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Block
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  disabled={!selectedDistrict}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Blocks</option>
                  {getUniqueBlocks().map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Search Village
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={villageSearch}
                    onChange={(e) => setVillageSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading villages...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredVillages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">
              {(selectedState || selectedDistrict || selectedBlock || villageSearch)
                ? 'No villages found matching the selected filters.'
                : 'No approved villages found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVillages.length === filteredVillages.length && filteredVillages.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Village Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Block
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submitted By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVillages.map((village) => (
                  <tr
                    key={village.village_profile_id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedVillages.includes(village.village_profile_id)
                        ? 'bg-blue-50'
                        : 'bg-white'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedVillages.includes(village.village_profile_id)}
                        onChange={() => toggleVillageSelection(village.village_profile_id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {village.village_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {village.block_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {village.district_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {village.state_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {village.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {village.email}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

