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

  useEffect(() => {
    fetchDashboardStats();
    if (user?.role === 'agribusiness_officer') {
      const currentYear = new Date().getFullYear();
      const defaultYear = `${currentYear}-${(currentYear + 1).toString()}`;
      setSelectedYear(defaultYear);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'agribusiness_officer' && selectedYear) {
      fetchAnnualAgriStats(selectedYear);
    }
  }, [selectedYear, user]);

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

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {user?.role === 'super_admin' ? 'Admin Actions' : 
           user?.role === 'regional_manager' ? 'Regional Manager Actions' :
           user?.role === 'project_manager' ? 'Project Manager Actions' : 'FPC Actions'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'super_admin' && (
            <>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <CheckSquare className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">Review Approvals</h3>
                <p className="text-sm text-gray-600">Review pending FPC registration requests</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Building2 className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Manage FPCs</h3>
                <p className="text-sm text-gray-600">View and manage all FPCs</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">Manage regional managers and users</p>
              </button>
            </>
          )}
          
          {user?.role === 'regional_manager' && (
            <>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Building2 className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">Create FPC Request</h3>
                <p className="text-sm text-gray-600">Submit new FPC registration request</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <FileText className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Track Requests</h3>
                <p className="text-sm text-gray-600">Monitor status of submitted requests</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium text-gray-900">Manage Team</h3>
                <p className="text-sm text-gray-600">Oversee project managers and FPCs</p>
              </button>
            </>
          )}

          {user?.role === 'project_manager' && (
            <>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Building2 className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">My FPCs</h3>
                <p className="text-sm text-gray-600">Manage assigned FPCs</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <FileText className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Generate Reports</h3>
                <p className="text-sm text-gray-600">Create progress and status reports</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium text-gray-900">Performance</h3>
                <p className="text-sm text-gray-600">Track FPC performance metrics</p>
              </button>
            </>
          )}

          {user?.role === 'fpc_user' && (
            <>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Building2 className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-gray-900">FPO Management</h3>
                <p className="text-sm text-gray-600">Manage your FPO details and information</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Manage Members</h3>
                <p className="text-sm text-gray-600">Handle shareholder and member data</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <FileText className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium text-gray-900">Financial & Compliance</h3>
                <p className="text-sm text-gray-600">Track financial details and compliance status</p>
              </button>
            </>
          )}
        </div>
      </div>

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