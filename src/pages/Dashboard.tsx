import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Clock
} from 'lucide-react';

interface Stats {
  totalFPCs: number;
  pendingRequests: number;
  approvedRequests: number;
  activeProjects: number;
  totalShareholders?: number;
  totalCEOs?: number;
  totalLicenses?: number;
  totalFinancialRecords?: number;
}

interface AnnualAgriStats {
  name: string;
  fpo_id: number;
  input_commodity_total: number;
  output_commodity_total: number;
  total_turnover: number;
}

interface StateFPOAgriStats {
  fpo_id: number;
  fpo_name: string;
  input_commodity_total: number;
  output_commodity_total: number;
  total_turnover: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalFPCs: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    activeProjects: 0,
    totalShareholders: 0,
    totalCEOs: 0,
    totalLicenses: 0,
    totalFinancialRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const [annualStats, setAnnualStats] = useState<AnnualAgriStats[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loadingAnnualStats, setLoadingAnnualStats] = useState(false);
  const [stateAgriStats, setStateAgriStats] = useState<StateFPOAgriStats[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');
  const [selectedStateFyYear, setSelectedStateFyYear] = useState<string>('');
  const [loadingStateStats, setLoadingStateStats] = useState(false);

  useEffect(() => {
    fetchDashboardStats();

    const getCurrentFY = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
      return `${fyStartYear}-${(fyStartYear + 1).toString()}`;
    };

    if (user?.role === 'agribusiness_officer') {
      setSelectedYear(getCurrentFY());
    }
    if (user?.role === 'super_admin') {
      setSelectedStateCode('27');
      setSelectedStateFyYear(getCurrentFY());
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'agribusiness_officer' && selectedYear) {
      fetchAnnualAgriStats(selectedYear);
    }
  }, [selectedYear, user]);

  useEffect(() => {
    if (user?.role === 'super_admin' && selectedStateCode && selectedStateFyYear) {
      fetchStateAgriStats(selectedStateCode, selectedStateFyYear);
    }
  }, [selectedStateCode, selectedStateFyYear, user]);

  const generateFYYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear.toString()}`);
    }
    return years;
  };

const fetchAnnualAgriStats = async (year: string) => {
  setLoadingAnnualStats(true);
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await axios.get(`/api/dashboard/agri_business_annual_stats`, {
      headers,
      params: { fy_year: year }
    });
    setAnnualStats(response.data);
    console.log(response.data)
  } catch (error) {
    console.error('Error fetching annual agribusiness stats:', error);
    toast.error('Failed to load annual statistics');
    setAnnualStats([]);
  } finally {
    setLoadingAnnualStats(false);
  }
};

const fetchStateAgriStats = async (stateCode: string, fyYear: string) => {
  setLoadingStateStats(true);
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await axios.get('/api/dashboard/agri-business/state/', {
      headers,
      params: {
        state_code: stateCode,
        fy_year: fyYear
      }
    });
    setStateAgriStats(response.data);
    console.log('State agri stats:', response.data);
  } catch (error) {
    console.error('Error fetching state agribusiness stats:', error);
    toast.error('Failed to load state statistics');
    setStateAgriStats([]);
  } finally {
    setLoadingStateStats(false);
  }
};

const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      let totalFPCs = 0;
      let pendingRequests = 0;
      let approvedRequests = 0;

      // For Super Admin, fetch dynamic counts
      if (user?.role === 'super_admin') {
        try {
          // Fetch approved FPCs count
          const approvedResponse = await axios.get('/api/fpo/approved', { headers });
          approvedRequests = approvedResponse.data.length;
          totalFPCs = approvedRequests; // Total FPCs = Approved FPCs for now
        } catch (error) {
          console.log('Approved FPCs endpoint not accessible');
        }

        try {
          // Fetch pending FPCs count
          const pendingResponse = await axios.get('/api/fpo/pending', { headers });
          pendingRequests = pendingResponse.data.length;
          // Add pending to total count
          totalFPCs += pendingRequests;
        } catch (error) {
          console.log('Pending FPCs endpoint not accessible');
        }
      } else {
        // For other roles, try to fetch FPOs
        try {
          const fpoResponse = await axios.get('/api/fpo/approved', { headers });
          totalFPCs = fpoResponse.data.length;
          approvedRequests = totalFPCs;
        } catch (error) {
          console.log('FPO endpoint not accessible for this user');
        }
      }

      // Fetch additional stats for FPC users and admins
      let additionalStats = {};
      if (user?.role === 'fpc_user' || user?.role === 'super_admin') {
        try {
          const [shareholderRes, ceoRes, licenseRes, financialRes] = await Promise.allSettled([
            axios.get('/api/shareholder/', { headers }),
            axios.get('/api/ceo_details/', { headers }),
            axios.get('/api/licenses/', { headers }),
            axios.get('/api/financial_details/', { headers })
          ]);

          additionalStats = {
            totalShareholders: shareholderRes.status === 'fulfilled' ? shareholderRes.value.data.length : 0,
            totalCEOs: ceoRes.status === 'fulfilled' ? ceoRes.value.data.length : 0,
            totalLicenses: licenseRes.status === 'fulfilled' ? licenseRes.value.data.length : 0,
            totalFinancialRecords: financialRes.status === 'fulfilled' ? financialRes.value.data.length : 0
          };
        } catch (error) {
          console.log('Some endpoints not accessible');
        }
      }

      setStats({
        totalFPCs,
        pendingRequests,
        approvedRequests,
        activeProjects: user?.role === 'super_admin' ? 45 : user?.role === 'regional_manager' ? 25 : 4, // Mock data for now
        ...additionalStats
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to mock data
      setStats({
        totalFPCs: user?.role === 'super_admin' ? 70 : user?.role === 'regional_manager' ? 30 : 5,
        pendingRequests: user?.role === 'super_admin' ? 12 : 3,
        approvedRequests: user?.role === 'super_admin' ? 58 : 27,
        activeProjects: user?.role === 'super_admin' ? 45 : user?.role === 'regional_manager' ? 25 : 4
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = () => {
    const baseCards = [
      {
        title: user?.role === 'super_admin' ? 'Total FPCs' : user?.role === 'regional_manager' ? 'My FPCs' : 'Assigned FPCs',
        value: stats.totalFPCs,
        icon: Building2,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      }
    ];

    // Add FPC-specific stats for FPC users
    if (user?.role === 'fpc_user') {
      baseCards.push(
        {
          title: 'Total Shareholders',
          value: stats.totalShareholders || 0,
          icon: Users,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'Active Licenses',
          value: stats.totalLicenses || 0,
          icon: FileText,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        },
        {
          title: 'Financial Records',
          value: stats.totalFinancialRecords || 0,
          icon: TrendingUp,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        }
      );
    }

    if (user?.role === 'super_admin' || user?.role === 'regional_manager') {
      baseCards.push(
        {
          title: 'Pending Requests',
          value: stats.pendingRequests,
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        },
        {
          title: 'Approved Requests',
          value: stats.approvedRequests,
          icon: CheckSquare,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      );
    }

    baseCards.push({
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    });

    return baseCards;
  };

  const calculateTotals = () => {
    const totals = annualStats.reduce((acc, item) => ({
      input_commodity_total: acc.input_commodity_total + item.input_commodity_total,
      output_commodity_total: acc.output_commodity_total + item.output_commodity_total,
      total_turnover: acc.total_turnover + item.total_turnover
    }), { input_commodity_total: 0, output_commodity_total: 0, total_turnover: 0 });
    return totals;
  };

  const calculateStateTotals = () => {
    const totals = stateAgriStats.reduce((acc, item) => ({
      input_commodity_total: acc.input_commodity_total + item.input_commodity_total,
      output_commodity_total: acc.output_commodity_total + item.output_commodity_total,
      total_turnover: acc.total_turnover + item.total_turnover
    }), { input_commodity_total: 0, output_commodity_total: 0, total_turnover: 0 });
    return totals;
  };

  const getMaxTurnover = () => {
    if (stateAgriStats.length === 0) return 0;
    return Math.max(...stateAgriStats.map(item => item.total_turnover));
  };

const INDIAN_STATES = [
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '27', name: 'Maharashtra' },
  { code: '36', name: 'Telangana' },
  { code: '8',  name: 'Rajasthan' }
];


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 capitalize">Welcome, {user?.firstName} ({user?.role.replace('_', ' ')})</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCards().map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* State-wise FPO Agribusiness Statistics for Super Admin */}
      {user?.role === 'super_admin' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">FPO Agribusiness Statistics by State (Filtered View)</h2>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">State:</label>
              <select
                value={selectedStateCode}
                onChange={(e) => setSelectedStateCode(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Choose state</option>
                {INDIAN_STATES.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
              <label className="text-sm font-medium text-gray-700">Financial Year:</label>
              <select
                value={selectedStateFyYear}
                onChange={(e) => setSelectedStateFyYear(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                <option value="">Choose FY</option>
                {generateFYYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingStateStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : !selectedStateCode || !selectedStateFyYear ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select State and Financial Year</h3>
              <p className="text-gray-600">Choose both a state and financial year to view FPO agribusiness statistics</p>
            </div>
          ) : stateAgriStats.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">No agribusiness statistics found for {INDIAN_STATES.find(s => s.code === selectedStateCode)?.name} in {selectedStateFyYear}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Input Commodity</p>
                  <p className="text-2xl font-bold text-blue-900">₹{calculateStateTotals().input_commodity_total.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-700 mb-1">Total Output Commodity</p>
                  <p className="text-2xl font-bold text-green-900">₹{calculateStateTotals().output_commodity_total.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-700 mb-1">Total Turnover</p>
                  <p className="text-2xl font-bold text-orange-900">₹{calculateStateTotals().total_turnover.toLocaleString()}</p>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Turnover Comparison</h3>
                <div className="space-y-3">
                  {stateAgriStats.map((item) => {
                    const maxTurnover = getMaxTurnover();
                    const percentage = maxTurnover > 0 ? (item.total_turnover / maxTurnover) * 100 : 0;
                    return (
                      <div key={item.fpo_id} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700 truncate max-w-xs">{item.fpo_name}</span>
                          <span className="text-gray-600 ml-2">₹{item.total_turnover.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border border-gray-300">FPO Name</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 border border-gray-300">Input Commodity</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 border border-gray-300">Output Commodity</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 border border-gray-300">Total Turnover</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateAgriStats.map((item, idx) => (
                      <tr key={item.fpo_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">{item.fpo_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">₹{item.input_commodity_total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">₹{item.output_commodity_total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">₹{item.total_turnover.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-100 font-bold">
                      <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300">Grand Total</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">₹{calculateStateTotals().input_commodity_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">₹{calculateStateTotals().output_commodity_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">₹{calculateStateTotals().total_turnover.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annual Agribusiness Statistics for Agribusiness Officers */}
      {user?.role === 'agribusiness_officer' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Annual Agribusiness Statistics</h2>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Financial Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {generateFYYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingAnnualStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : annualStats.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">No agribusiness statistics found for {selectedYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border border-gray-300">FPO Name</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 border border-gray-300">Input</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 border border-gray-300">Output</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 border border-gray-300">Total Turnover</th>
                  </tr>
                </thead>
                <tbody>
                  {annualStats.map((item, idx) => (
                    <tr key={item.fpo_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">{item.input_commodity_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">{item.output_commodity_total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">{item.total_turnover.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-100 font-bold">
                    <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300">Percent Total</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">{calculateTotals().input_commodity_total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">{calculateTotals().output_commodity_total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right border border-gray-300">{calculateTotals().total_turnover.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm text-gray-700">
                {user?.role === 'super_admin' ? 'New FPC request submitted by Regional Manager' :
                 user?.role === 'regional_manager' ? 'FPC request approved by Super Admin' :
                 user?.role === 'project_manager' ? 'New FPC assigned to your management' :
                 'Profile setup reminder - complete your FPC details'}
              </span>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-sm text-gray-700">
                {user?.role === 'super_admin' ? '3 pending approval requests require attention' :
                 user?.role === 'regional_manager' ? 'Monthly report submission due in 3 days' :
                 user?.role === 'project_manager' ? 'FPC performance review scheduled' :
                 'Document verification pending'}
              </span>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;