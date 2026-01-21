import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Building2, MapPin, Calendar, Users, Phone, Mail, Eye, Trash2, Edit } from 'lucide-react';
import EditModal from '../components/EditModal';


interface FPO {
  fpo_id: number;
  fpo_name: string;
  state_code: number | null;
  district_code: number | null;
  state_name?: string;
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
  project_manager_phone?: string;
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
}

interface District {
  state_code: number;
  state_name: string;
  district_code: number;
  district_name: string;
}

const MyRequests: React.FC = () => {
  const { user } = useAuth();
  const [fpos, setFpos] = useState<FPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFPO, setSelectedFPO] = useState<FPO | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
      fetchMyFPOs();
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

  const fetchMyFPOs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/fpo/approved', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.data || !Array.isArray(response.data)) {
        setFpos([]);
        return;
      }

      const fposData = response.data.map((fpo: any) => ({
        ...fpo,
        state_name: districts.find(d => d.state_code === fpo.state_code)?.state_name || 'Unknown',
        district_name: districts.find(d => d.district_code === fpo.district_code)?.district_name || 'Unknown'
      }));

      setFpos(fposData);
      console.log('FPOs loaded:', fposData.length);
    } catch (error: any) {
      console.error('Error fetching FPOs:', error);
      if (error.response?.status !== 404) {
        // toast.error('Failed to fetch FPOs');
      }
      setFpos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fpoId: number) => {
    if (window.confirm('Are you sure you want to delete this FPO? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/fpo/${fpoId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('FPO deleted successfully!');
        fetchMyFPOs();
      } catch (error: any) {
        // toast.error(error.response?.data?.detail || 'Failed to delete FPO');
      }
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

  const filteredFPOs = fpos.filter(fpo => {
    const matchesSearch = (fpo.fpo_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (fpo.district_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (fpo.fpc_registration_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === '' || fpo.state_code === filterState;
    const matchesUserAuth = (!userAuth?.state_code || fpo.state_code === userAuth.state_code) &&
                           (!userAuth?.district_code || fpo.district_code === userAuth.district_code);
    return matchesSearch && matchesState && matchesUserAuth;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading FPCs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My FPCs</h1>
          <p className="text-gray-600">Manage the FPCs you have created</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {fpos.length} FPCs
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by FPC name, district, or registration number..."
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

      {/* FPO Grid */}
      <div className="grid gap-6">
        {filteredFPOs.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No FPCs found</h3>
            <p className="text-gray-600">
              {searchTerm || filterState ? 'Try adjusting your search criteria.' : 'No approved FPCs found.'}
            </p>
          </div>
        ) : (
          filteredFPOs.map((fpo) => (
            <div key={fpo.fpo_id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Building2 className="h-6 w-6 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{fpo.fpo_name}</h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="font-medium">{fpo.district_name || 'Unknown'}, {fpo.state_name || 'Unknown'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Number</p>
                      <p className="font-medium">{fpo.fpc_registration_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <p className="font-medium">{new Date(fpo.registration_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{fpo.office_contact_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {fpo.office_contact_number}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {fpo.office_contact_email}
                    </div>
                    {fpo.bod_details && fpo.bod_details.length > 0 && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        BOD: {fpo.bod_details[0].name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>PAN: {fpo.pan}</span>
                    <span>TAN: {fpo.tan}</span>
                    <span>GST: {fpo.gst_number}</span>
                  </div>
                </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedFPO(fpo);
                    setShowModal(true);
                  }}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedFPO(fpo);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(fpo.fpo_id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedFPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">FPO Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">FPO Name</p>
                    <p className="font-medium">{selectedFPO.fpo_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{selectedFPO.fpc_registration_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium">{selectedFPO.state_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">District</p>
                    <p className="font-medium">{selectedFPO.district_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="font-medium">{new Date(selectedFPO.registration_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Office Block</p>
                    <p className="font-medium">{selectedFPO.office_block}</p>
                  </div>
                </div>
              </div>

              {/* BOD Information */}
              {selectedFPO.bod_details && selectedFPO.bod_details.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">BOD Member Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedFPO.bod_details[0].name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium">{selectedFPO.bod_details[0].mobile_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{selectedFPO.bod_details[0].gender === 'm' ? 'Male' : 'Female'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Legal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Legal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">PAN</p>
                    <p className="font-medium">{selectedFPO.pan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TAN</p>
                    <p className="font-medium">{selectedFPO.tan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">GST Number</p>
                    <p className="font-medium">{selectedFPO.gst_number}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Registered Address</p>
                    <p className="font-medium">{selectedFPO.registered_company_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Office Address</p>
                    <p className="font-medium">{selectedFPO.office_address}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{selectedFPO.office_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{selectedFPO.office_contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Email</p>
                    <p className="font-medium">{selectedFPO.office_contact_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">WOTR Staff Phone</p>
                    <p className="font-medium">{selectedFPO.responsible_wotr_staff_phone}</p>
                  </div>
                </div>
              </div>

              {/* Donors */}
              {selectedFPO.donors && selectedFPO.donors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Donors</h3>
                  <div className="space-y-2">
                    {selectedFPO.donors.map((donor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{donor.donor_name}</p>
                          <p className="text-sm text-gray-500 capitalize">{donor.donor_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedFPO && (
        <EditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFPO(null);
          }}
          fpoId={selectedFPO.fpo_id}
          fpoName={selectedFPO.fpo_name}
        />
      )}
    </div>
  );
};

export default MyRequests;
