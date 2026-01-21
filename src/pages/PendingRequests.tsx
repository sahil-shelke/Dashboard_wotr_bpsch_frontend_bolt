import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Clock, Building2, MapPin, Calendar, User, Phone, Mail } from 'lucide-react';

interface PendingFPO {
  fpo_id: number;
  fpo_name: string;
  state_code: number | null;
  state_name?: string;
  district_code: number | null;
  district_name?: string;
  fpc_registration_number: string;
  pan: string;
  tan: string;
  gst_number: string;
  registration_date: string;
  registered_company_address: string;
  office_address: string;
  office_block: string;
  office_contact_name: string;
  office_contact_number: string;
  office_contact_email: string;
  responsible_wotr_staff_phone: string;
  donors?: Array<{
    donor_type: 'government' | 'corporate' | 'others';
    donor_name: string;
  }>;
  bod_details?: Array<{
    mobile_number: string;
    name: string;
    gender: 'm' | 'f';
    education_qualification?: string;
    DIN?: number;
    address?: string;
  }>;
  submitted_at?: string;
  submitted_by?: string;
}

interface District {
  state_code: number;
  state_name: string;
  district_code: number;
  district_name: string;
}

const PendingRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingFPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<number | ''>('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [userAuth, setUserAuth] = useState<{ state_code: number | null; district_code: number | null } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([fetchUserAuth(), fetchDistricts()]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  useEffect(() => {
    if (districts.length > 0) {
      fetchPendingRequests();
    }
  }, [districts.length]);

  const fetchUserAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUserAuth(response.data);
      console.log('User Auth:', response.data);
    } catch (error: any) {
      console.error('Error fetching user auth:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/districts/districts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDistricts(response.data);
      console.log('Districts loaded:', response.data.length);
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      // toast.error('Failed to fetch districts');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/fpo/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !Array.isArray(response.data)) {
        setRequests([]);
        return;
      }

      const requestsData = response.data.map((request: any) => ({
        ...request,
        state_name: districts.find(d => d.state_code === request.state_code)?.state_name || 'Unknown',
        district_name: districts.find(d => d.district_code === request.district_code)?.district_name || 'Unknown'
      }));

      setRequests(requestsData);
      console.log('Pending requests loaded:', requestsData.length);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      if (error.response?.status !== 404) {
        // toast.error(error.response?.data?.detail || 'Failed to fetch pending requests');
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const availableStates = districts.length > 0
    ? districts
        .filter(d => !userAuth?.state_code || d.state_code === userAuth.state_code)
        .reduce((acc, d) => {
          if (!acc.find(s => s.code === d.state_code)) {
            acc.push({ code: d.state_code, name: d.state_name });
          }
          return acc;
        }, [] as Array<{ code: number; name: string }>)
    : [];

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (request.fpo_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.district_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.fpc_registration_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === '' || request.state_code === filterState;
    const matchesUserAuth = (!userAuth?.state_code || request.state_code === userAuth.state_code) &&
                           (!userAuth?.district_code || request.district_code === userAuth.district_code);
    return matchesSearch && matchesState && matchesUserAuth;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading pending requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending FPO Requests</h1>
          <p className="text-gray-600">View FPO requests that are awaiting Super Admin approval</p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-gray-500">{requests.length} pending requests</span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">States Covered</p>
              <p className="text-2xl font-bold text-gray-900">{availableStates.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Districts</p>
              <p className="text-2xl font-bold text-gray-900">{[...new Set(requests.map(r => r.district_name).filter(Boolean))].length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by FPO name, district, or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="form-input"
            >
              <option value="">All States</option>
              {availableStates.map(state => (
                <option key={state.code} value={state.code}>{state.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pending Requests Grid */}
      <div className="grid gap-6">
        {filteredRequests.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests found</h3>
            <p className="text-gray-600">
              {searchTerm || filterState ? 'Try adjusting your search criteria.' : 'All FPO requests have been processed.'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.fpo_id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Building2 className="h-6 w-6 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{request.fpo_name}</h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Awaiting Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="font-medium">{request.district_name || 'Unknown'}, {request.state_name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Number</p>
                      <p className="font-medium">{request.fpc_registration_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="font-medium">{new Date(request.registration_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{request.office_contact_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {request.office_contact_number}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {request.office_contact_email}
                    </div>
                    {request.bod_details && request.bod_details.length > 0 && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        BOD: {request.bod_details[0].name}
                      </div>
                    )}
                    {request.responsible_wotr_staff_phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        <span className="text-xs">WOTR: {request.responsible_wotr_staff_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>PAN: {request.pan}</span>
                    <span>TAN: {request.tan}</span>
                    <span>GST: {request.gst_number}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-700 font-medium">Pending</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Information Card */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">ℹ</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">About Pending Requests</h3>
            <p className="text-sm text-blue-700 mt-1">
              These FPO requests are currently awaiting approval from Super Admins. Once approved,
              they will appear in your "My Approved FPCs" section and can be managed through the
              various data entry forms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingRequests;
