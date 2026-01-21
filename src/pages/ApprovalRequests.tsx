import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Clock, FileText, User, Building2 } from 'lucide-react';

interface PendingFPO {
  fpo_id: number;
  fpo_name: string;
  state_name: string;
  district_name: string;
  fpc_registration_number: string;
  pan: string;
  tan: string;
  gst_number: string;
  pan_doc_url?: string;
  tan_doc_url?: string;
  gst_number_doc_url?: string;
  registration_date: string;
  registered_company_address: string;
  office_address: string;
  office_block: string;
  office_contact_name: string;
  office_contact_number: string;
  office_contact_email: string;
  responsible_wotr_staff_phone: string;
  donors: Array<{
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

const ApprovalRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingFPO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingFPO | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/fpo/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRequests(response.data);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      // toast.error(error.response?.data?.detail || 'Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (fpoId: number, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? '/approval/approve' : '/approval/reject';

      const payload = action === 'approve'
        ? { fpo_id: fpoId }
        : { fpo_id: fpoId, comment: comments };

      await axios.post(`/api${endpoint}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success(`FPO ${action}d successfully!`);
      setShowModal(false);
      setComments('');
      fetchPendingRequests(); // Refresh the list
    } catch (error: any) {
      console.error(`Error ${action}ing FPO:`, error);
      // toast.error(error.response?.data?.detail || `Failed to ${action} FPO`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDocument = (url: string, type: string) => {
    setSelectedDocUrl(url);
    setSelectedDocType(type);
    setShowDocModal(true);
  };

  const filteredRequests = requests.filter(request => {
    const matchesState = filterState === '' || request.state_name === filterState;
    const matchesDistrict = filterDistrict === '' || request.district_name.toLowerCase().includes(filterDistrict.toLowerCase());
    return matchesState && matchesDistrict;
  });

  const uniqueStates = [...new Set(requests.map(request => request.state_name))].sort();

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
          <h1 className="text-2xl font-bold text-gray-900">FPO Approval Requests</h1>
          <p className="text-gray-600">Review and approve pending FPO registration requests</p>
        </div>
        <div className="text-sm text-gray-500">
          {requests.length} pending requests
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by State:</label>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="form-input w-48"
          >
            <option value="">All States</option>
            {uniqueStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          
          <label className="text-sm font-medium text-gray-700">Filter by District:</label>
          <input
            type="text"
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            placeholder="Search district..."
            className="form-input w-48"
          />
          
          <div className="text-sm text-gray-500">
            Showing {filteredRequests.length} of {requests.length} requests
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRequests.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests found</h3>
            <p className="text-gray-600">
              {filterState || filterDistrict ? 'Try adjusting your filters.' : 'No FPO requests are pending approval.'}
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
                      Pending Approval
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{request.district_name}, {request.state_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Number</p>
                      <p className="font-medium">{request.fpc_registration_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration Date</p>
                      <p className="font-medium">{new Date(request.registration_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{request.office_contact_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Contact: {request.office_contact_number}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Email: {request.office_contact_email}
                    </div>
                    {request.bod_details && request.bod_details.length > 0 && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        BOD: {request.bod_details[0].name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>PAN: {request.pan}</span>
                    <span>TAN: {request.tan}</span>
                    <span>GST: {request.gst_number}</span>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowModal(true);
                      console.log('Selected Request:', request);
                    }}
                    className="btn-secondary flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Review</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Review FPO Request</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* FPO Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">FPO Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">FPO Name</p>
                    <p className="font-medium">{selectedRequest.fpo_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedRequest.district_name}, {selectedRequest.state_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{selectedRequest.fpc_registration_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="font-medium">{new Date(selectedRequest.registration_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* BOD Member Details */}
              {selectedRequest.bod_details && selectedRequest.bod_details.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">BOD Member</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{selectedRequest.bod_details[0].name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedRequest.bod_details[0].mobile_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{selectedRequest.bod_details[0].gender === 'm' ? 'Male' : 'Female'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Office Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Office Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Office Block</p>
                    <p className="font-medium">{selectedRequest.office_block}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{selectedRequest.office_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Phone</p>
                    <p className="font-medium">{selectedRequest.office_contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Email</p>
                    <p className="font-medium">{selectedRequest.office_contact_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">WOTR Staff Phone</p>
                    <p className="font-medium">{selectedRequest.responsible_wotr_staff_phone}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Registered Address</p>
                    <p className="font-medium">{selectedRequest.registered_company_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Office Address</p>
                    <p className="font-medium">{selectedRequest.office_address}</p>
                  </div>
                </div>
              </div>

              {/* Registration Documents */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Registration Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">PAN</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{selectedRequest.pan}</p>
                      {selectedRequest.pan_doc_url && (
                        <button
                          onClick={() => handleViewDocument(selectedRequest.pan_doc_url!, 'PAN')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View PAN Document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TAN</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{selectedRequest.tan}</p>
                      {selectedRequest.tan_doc_url && (
                        <button
                          onClick={() => handleViewDocument(selectedRequest.tan_doc_url!, 'TAN')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View TAN Document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">GST Number</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{selectedRequest.gst_number}</p>
                      {selectedRequest.gst_number_doc_url && (
                        <button
                          onClick={() => handleViewDocument(selectedRequest.gst_number_doc_url!, 'GST')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View GST Document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Donors */}
              {selectedRequest.donors && selectedRequest.donors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Donors</h3>
                  <div className="space-y-2">
                    {selectedRequest.donors.map((donor, index) => (
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

              {/* Comments */}
              <div>
                <label className="form-label">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="form-input"
                  rows={3}
                  placeholder="Add any comments or feedback..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(selectedRequest.fpo_id, 'reject')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4" />
                <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
              </button>
              <button
                onClick={() => handleApproval(selectedRequest.fpo_id, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                disabled={actionLoading}
              >
                <CheckCircle className="h-4 w-4" />
                <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">{selectedDocType} Document</h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
              <img
                src={selectedDocUrl}
                alt={`${selectedDocType} Document`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRequests;