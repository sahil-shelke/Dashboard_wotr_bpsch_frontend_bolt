import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, X, Calendar, TrendingUp, Eye, BarChart3 } from 'lucide-react';

interface FPO {
  fpo_id: number;
  name: string;
  state_code: number;
  district_code: number;
}

interface CommodityEntry {
  commodity: string;
  volume_tonnes: number | null;
  turnover: number | null;
}

interface AgriBusinessData {
  commodity: string;
  volume_tonnes: number;
  turnover: number;
  fy_month: string;
  fy_year: string;
}

const COMMODITIES = ['Input', 'Cotton', 'Maize', 'Wheat', 'Rice', 'Soybean', 'Pulses', 'Vegetables', 'Fruits', 'Other'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Agribusiness: React.FC = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState('');
  const [fyYear, setFyYear] = useState('');
  const [fpoList, setFpoList] = useState<FPO[]>([]);
  const [selectedFPO, setSelectedFPO] = useState<FPO | null>(null);
  const [entries, setEntries] = useState<CommodityEntry[]>([
    { commodity: '', volume_tonnes: null, turnover: null }
  ]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewFPOList, setViewFPOList] = useState<FPO[]>([]);
  const [selectedViewFPO, setSelectedViewFPO] = useState<FPO | null>(null);
  const [selectedViewYear, setSelectedViewYear] = useState<string>('');
  const [agriData, setAgriData] = useState<AgriBusinessData[]>([]);
  const [loadingViewData, setLoadingViewData] = useState(false);
  const [loadingFPOList, setLoadingFPOList] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleSubmitPeriod = async () => {
    if (!month || !fyYear) {
      toast.error('Please select both month and financial year');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.get('/api/agri_business/', { headers });
      setFpoList(response.data);
      console.log('Fetched FPOs:', response.data);
      setShowModal(true);
      toast.success('FPO list loaded successfully');
    } catch (error) {
      console.error('Error fetching FPOs:', error);
      toast.error('Failed to load FPO list');
    } finally {
      setLoading(false);
    }
  };

  const handleFPOSelect = (fpo: FPO) => {
    setSelectedFPO(fpo);
    toast.success(`Selected: ${fpo.name}`);
  };

  const addEntry = () => {
    setEntries([...entries, { commodity: '', volume_tonnes: 0, turnover: 0 }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);
    } else {
      toast.error('At least one entry is required');
    }
  };

  const updateEntry = (index: number, field: keyof CommodityEntry, value: string | number) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      [field]: value
    };
    setEntries(newEntries);
  };

  const handleSubmitData = async () => {
    if (!selectedFPO) {
      toast.error('Please select an FPO');
      return;
    }

const invalidEntries = entries.filter(entry => {
  return (
    !entry.commodity?.trim?.() || // empty or undefined commodity
    entry.volume_tonnes == null || entry.volume_tonnes <= 0 ||
    entry.turnover == null || entry.turnover <= 0
  );
});

    if (invalidEntries.length > 0) {
      toast.error('Please fill all fields with valid values');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const promises = entries.map(entry =>
        axios.post('/api/agri_business/', {
          fpo_id: selectedFPO.fpo_id,
          state_code: selectedFPO.state_code,
          district_code: selectedFPO.district_code,
          commodity: entry.commodity,
          volume_tonnes: entry.volume_tonnes,
          turnover: entry.turnover,
          fy_year: fyYear,
          fy_month: month
        }, { headers })
      );

      await Promise.all(promises);

      toast.success('All entries submitted successfully');
      setEntries([{ commodity: '', volume_tonnes: 0, turnover: 0 }]);
      setSelectedFPO(null);
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error('Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  };

  const generateFYYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(`${i}-${i + 1}`);
    }
    return years;
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFPO(null);
    setEntries([{ commodity: '', volume_tonnes: 0, turnover: 0 }]);
    setMonth('');
    setFyYear('');
  };

  useEffect(() => {
    const loadFPOListForView = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await axios.get('/api/agri_business/', { headers });
        setViewFPOList(response.data);
      } catch (error) {
        console.error('Error fetching FPOs:', error);
        toast.error('Failed to load FPO list');
      } finally {
        setLoadingFPOList(false);
      }
    };

    loadFPOListForView();
  }, []);

  const handleViewFPOClick = async (fpo: FPO) => {
    setSelectedViewFPO(fpo);
    setSelectedViewYear('');
    setShowViewModal(true);
    setLoadingViewData(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`/api/agri_business/${fpo.fpo_id}`, { headers });
      setAgriData(response.data);
      toast.success(`Loaded data for ${fpo.name}`);
    } catch (error) {
      console.error('Error fetching agribusiness data:', error);
      toast.error('Failed to load agribusiness data');
      setAgriData([]);
    } finally {
      setLoadingViewData(false);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedViewYear(year);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedViewFPO(null);
    setSelectedViewYear('');
    setAgriData([]);
  };

  const groupDataByMonth = () => {
    const grouped: { [key: string]: AgriBusinessData[] } = {};
    const filteredData = selectedViewYear
      ? agriData.filter(item => item.fy_year === selectedViewYear)
      : agriData;

    filteredData.forEach(item => {
      const key = `${item.fy_month} ${item.fy_year}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  const calculateMonthTotal = (monthData: AgriBusinessData[]) => {
    return monthData.reduce((sum, item) => sum + item.turnover, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agribusiness Data Entry</h1>
          <p className="text-gray-600">Track commodity volumes and turnover for FPOs</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Select Period</h2>
              <p className="text-blue-100 text-sm">Choose month and financial year to begin</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Month</span>
              </label>
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={showModal}
                >
                  <option value="">Select Month</option>
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {month && (
                <div className="mt-2 flex items-center space-x-1 text-xs text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Selected</span>
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Financial Year</span>
              </label>
              <div className="relative">
                <select
                  value={fyYear}
                  onChange={(e) => setFyYear(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 appearance-none cursor-pointer hover:border-green-300 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={showModal}
                >
                  <option value="">Select FY</option>
                  {generateFYYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {fyYear && (
                <div className="mt-2 flex items-center space-x-1 text-xs text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Selected</span>
                </div>
              )}
            </div>
          </div>

          {month && fyYear && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Period Selected</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You've selected <span className="font-bold">{month} {fyYear}</span>. Click the button below to load FPC data.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmitPeriod}
              disabled={loading || showModal || !month || !fyYear}
              className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-60"
            >
              <span className="flex items-center space-x-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span>Load FPC</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add Agribusiness Data</h2>
                <p className="text-sm text-gray-600 mt-1">Period: {month} {fyYear}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select FPO *
                </label>
                <select
                  value={selectedFPO?.fpo_id || ''}
                  onChange={(e) => {
                    const fpo = fpoList.find(f => f.fpo_id === parseInt(e.target.value));
                    if (fpo) handleFPOSelect(fpo);
                  }}
                  className="input"
                >
                  <option value="">Select FPO</option>
                  {fpoList.map(fpo => (
                    <option key={fpo.fpo_id} value={fpo.fpo_id}>{fpo.name}</option>
                  ))}
                </select>
              </div>

              {selectedFPO && (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedFPO.name}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Commodity Entries</h3>
                      <button
                        onClick={addEntry}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Entry</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {entries.map((entry, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Entry {index + 1}</h4>
                            {entries.length > 1 && (
                              <button
                                onClick={() => removeEntry(index)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Commodity *
                              </label>
                              <select
                                value={entry.commodity}
                                onChange={(e) => updateEntry(index, 'commodity', e.target.value)}
                                className="input"
                              >
                                <option value="">Select Commodity</option>
                                {COMMODITIES.map(commodity => (
                                  <option key={commodity} value={commodity}>{commodity}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Volume (Tonnes) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                
                                value={entry.volume_tonnes ?? ''}
                                onChange={(e) => updateEntry(index, 'volume_tonnes', parseFloat(e.target.value))}
                                className="input"
                                placeholder="Enter volume"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Turnover (₹) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                
                                value={entry.turnover ?? ''}
                                onChange={(e) => updateEntry(index, 'turnover', parseFloat(e.target.value))}
                                className="input"
                                placeholder="Enter turnover"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSubmitData}
                      disabled={submitting}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{submitting ? 'Submitting...' : 'Submit Entries'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">View Agribusiness Data</h2>
              <p className="text-green-100 text-sm">Click on any FPO to view their agribusiness records</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loadingFPOList ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : viewFPOList.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No FPOs Available</h3>
              <p className="text-gray-600">No FPOs found in the system</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {viewFPOList.map(fpo => (
                <button
                  key={fpo.fpo_id}
                  onClick={() => handleViewFPOClick(fpo)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{fpo.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">FPO ID: {fpo.fpo_id}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedViewFPO?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Agribusiness Data Records
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select
                    value={selectedViewYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-blue-300"
                  >
                    <option value="">All Years</option>
                    {generateFYYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingViewData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 font-medium">Loading data...</p>
                  </div>
                </div>
              ) : agriData.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
                  <p className="text-gray-600">
                    No agribusiness records found for {selectedViewFPO?.name}
                    {selectedViewYear && ` in ${selectedViewYear}`}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                    <p className="text-blue-700 text-sm">
                      Showing {Object.keys(groupDataByMonth()).length} month(s) with {agriData.length} total records
                      {selectedViewYear && ` for ${selectedViewYear}`}
                    </p>
                  </div>

                  {Object.entries(groupDataByMonth()).map(([monthYear, monthData]) => {
                    const total = calculateMonthTotal(monthData);
                    return (
                      <div key={monthYear} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                        <div className="bg-blue-600 px-4 py-3">
                          <h4 className="font-bold text-white text-lg">{monthYear}</h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Commodity</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Volume (Tonnes)</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Turnover (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthData.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.commodity}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.volume_tonnes.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{item.turnover.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="bg-blue-100 border-t-2 border-blue-500">
                                <td className="px-4 py-3 text-sm font-bold text-gray-900">Total Turnover</td>
                                <td className="px-4 py-3"></td>
                                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">₹{total.toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agribusiness;
