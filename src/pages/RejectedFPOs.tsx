import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { XCircle, Building2, MapPin, Calendar, User, Phone, Mail, MessageSquare, AlertTriangle } from 'lucide-react';

interface RejectedFPO {
  rejection_id: number;
  super_admin_id: string;
  fpo_id: number;
  comment: string;
  old_details: {
    state_name: string;
    district_name: string;
    pan: string;
    tan: string;
    name: string;
    fpo_id: number;
    gst_number: string;
    is_approved: boolean;
    office_block: string;
    office_address: string;
    registration_date: string;
    office_contact_name: string;
    office_contact_email: string;
    office_contact_number: string;
    project_manager_phone: string | null;
    fpc_registration_number: string;
    registered_company_address: string;
    responsible_wotr_staff_phone: string;
  };
  super_admin_first_name: string;
  super_admin_last_name: string;
}

const RejectedFPOs: React.FC = () => {
  const { user } = useAuth();
  const [rejectedFPOs, setRejectedFPOs] = useState<RejectedFPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFPO, setSelectedFPO] = useState<RejectedFPO | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');

  useEffect(() => {
    fetchRejectedFPOs();
  }, []);

  const fetchRejectedFPOs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/approval/rejected_fpos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRejectedFPOs(response.data);
    } catch (error: any) {
      console.error('Error fetching rejected FPOs:', error);
      toast.error(error.response?.data?.detail || 'Failed to fetch rejected FPOs');
    } finally {
      setLoading(false);
    }
  };

  const filteredFPOs = rejectedFPOs.filter(rejection => {
    const fpo = rejection.old_details;
    const matchesSearch = fpo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fpo.district_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fpo.fpc_registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === '' || fpo.state_name === filterState;
    return matchesSearch && matchesState;
  });

  const uniqueStates = [...new Set(rejectedFPOs.map(rejection => rejection.old_details.state_name))].sort();

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
          <h1 className="text-2xl font-bold text-gray-900">Rejected FPO Requests</h1>
          <p className="text-gray-600">View FPO requests that have been rejected by Super Admin</p>
        </div>
        <div className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-gray-500">{rejectedFPOs.length} rejected requests</span>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{rejectedFPOs.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">States Affected</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueStates.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <MessageSquare className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Comments</p>
              <p className="text-2xl font-bold text-gray-900">
                {rejectedFPOs.filter(r => r.comment && r.comment.trim()).length}
              </p>
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
              onChange={(e) => setFilterState(e.target.value)}
              className="form-input"
            >
              <option value="">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rejected FPOs Grid */}
      <div className="grid gap-6">
        {filteredFPOs.length === 0 ? (
          <div className="card p-12 text-center">
            <XCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rejected FPOs found</h3>
            <p className="text-gray-600">
              {searchTerm || filterState ? 'Try adjusting your search criteria.' : 'No FPO requests have been rejected.'}
            </p>
          </div>
        ) : (
          filteredFPOs.map((rejection) => {
            const fpo = rejection.old_details;
            return (
              <div key={rejection.rejection_id} className="card p-6 border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building2 className="h-6 w-6 text-red-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{fpo.name}</h3>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Rejected
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="font-medium">{fpo.district_name}, {fpo.state_name}</p>
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
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Rejected by: {rejection.super_admin_first_name} {rejection.super_admin_last_name}
                      </div>
                    </div>

                    {rejection.comment && rejection.comment.trim() && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700">{rejection.comment}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>PAN: {fpo.pan}</span>
                      <span>TAN: {fpo.tan}</span>
                      <span>GST: {fpo.gst_number}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedFPO(rejection);
                        setShowModal(true);
                      }}
                      className="btn-secondary flex items-center space-x-1"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedFPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <h2 className="text-xl font-bold text-gray-900">Rejected FPO Details</h2>
                </div>
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
              {/* Rejection Information */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-red-900">Rejection Information</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-red-700">Rejected by:</p>
                        <p className="font-medium text-red-900">
                          {selectedFPO.super_admin_first_name} {selectedFPO.super_admin_last_name}
                        </p>
                      </div>
                      {/* <div>
                        <p className="text-sm text-red-700">FPO Name:</p>
                        <p className="font-medium text-red-900">{selectedFPO.old_details.name}</p>
                      </div> */}
                    </div>
                    {selectedFPO.comment && selectedFPO.comment.trim() && (
                      <div className="mt-3">
                        <p className="text-sm text-red-700">Reason for Rejection:</p>
                        <p className="font-medium text-red-900 bg-white p-2 rounded border">
                          {selectedFPO.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FPO Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">FPO Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">FPO Name</p>
                    <p className="font-medium">{selectedFPO.old_details.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedFPO.old_details.district_name}, {selectedFPO.old_details.state_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{selectedFPO.old_details.fpc_registration_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="font-medium">{new Date(selectedFPO.old_details.registration_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Office Block</p>
                    <p className="font-medium">{selectedFPO.old_details.office_block}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{selectedFPO.old_details.office_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{selectedFPO.old_details.office_contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Email</p>
                    <p className="font-medium">{selectedFPO.old_details.office_contact_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">WOTR Staff Phone</p>
                    <p className="font-medium">{selectedFPO.old_details.responsible_wotr_staff_phone}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Registered Address</p>
                    <p className="font-medium">{selectedFPO.old_details.registered_company_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Office Address</p>
                    <p className="font-medium">{selectedFPO.old_details.office_address}</p>
                  </div>
                </div>
              </div>

              {/* Legal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Legal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">PAN</p>
                    <p className="font-medium">{selectedFPO.old_details.pan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TAN</p>
                    <p className="font-medium">{selectedFPO.old_details.tan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">GST Number</p>
                    <p className="font-medium">{selectedFPO.old_details.gst_number}</p>
                  </div>
                </div>
              </div>
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

      {/* Information Card */}
      <div className="card p-6 bg-red-50 border-red-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-900">About Rejected FPOs</h3>
            <p className="text-sm text-red-700 mt-1">
              These FPO requests have been reviewed and rejected by Super Admins. You can view the rejection 
              reasons and details to understand what needs to be improved for future submissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectedFPOs;