import React, { useState, useEffect } from 'react';
import { set, useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Users, FileEdit as Edit, Trash2, Plus, Search, Filter } from 'lucide-react';

interface ShareholderFormData {
  fpo_id: number;
  member_name: string;
  member_phone_number: string;
  gender: 'm' | 'f';
  date_of_birth: string;
  date_of_share_taken: string;
  sharemoney_deposited_by_member?: string;
  number_of_share_alloted_amount?: string;
  folio_share_distinctive_no?: string;
  status_of_member?: string;
  land_holding_of_shares_in_acres?: string;
  share_transfer?: string;
  position_of_member: 'Director' | 'Promoter' | 'Member';
  is_scst?: boolean;
  education_qualification?: 'illiterate' | 'secondary' | 'higher secondary' | 'diploma' | 'graduate' | 'postgraduate' | 'others';
  din?: number;
  date_of_joining?: string;
}

interface Shareholder extends ShareholderFormData {
  id: number;
}

const ShareholdersPage: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ShareholderFormData>();
  const selectedPosition = watch('position_of_member');

  // ✅ Fetch all FPOs once on mount
  useEffect(() => {
    const fetchFPOs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/fpo/approved', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFpos(response.data);
        setFpoId(response.data[0]?.fpo_id || null);
        console.log('Fetched FPOs:', response.data);
      } catch (error) {
        // toast.error('Failed to fetch FPOs');
      }
    };
    fetchFPOs();
  }, []);

  // ✅ Fetch shareholders when fpo_id changes
  useEffect(() => {
    if (fpo_id) fetchShareholders();
  }, [fpo_id]);

  // ✅ Fetch shareholders filtered by fpo_id
  const fetchShareholders = async () => {
    try {
      if (!fpo_id) {
        console.warn('No FPO selected');
        return;
      }
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/shareholder/${fpo_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShareholders(response.data);
    } catch (error) {
      // toast.error('Failed to fetch shareholders');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ShareholderFormData) => {
    setLoading(true);
    try {
      // If not Director, remove director-specific fields
      if (data.position_of_member !== 'Director') {
        data.date_of_joining = undefined;
        data.education_qualification = undefined;
        data.din = undefined;
      }

      if (editingId) {
        await axios.put(`/api/shareholder/${editingId}`, data);
        toast.success('Shareholder updated successfully!');
        setEditingId(null);
      } else {
        const payload = {
          ...data, 
          fpo_id
        }
        await axios.post('/api/shareholder/', payload);
        toast.success('Shareholder created successfully!');
      }
      reset();
      setShowForm(false);
      fetchShareholders();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shareholder: any) => {
    setEditingId(shareholder.id);
    reset({
      ...shareholder,
      date_of_birth: shareholder.date_of_birth?.split('T')[0] || '',
      date_of_share_taken: shareholder.date_of_share_taken?.split('T')[0] || '',
      date_of_joining: shareholder.date_of_joining?.split('T')[0] || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this shareholder?')) {
      try {
        await axios.delete(`/api/shareholder/${id}`);
        toast.success('Shareholder deleted successfully!');
        fetchShareholders();
      } catch (error) {
        // toast.error('Failed to delete shareholder');
      }
    }
  };

  const educationOptions = [
    'illiterate',
    'secondary',
    'higher secondary',
    'diploma',
    'graduate',
    'postgraduate',
    'others'
  ];

  const positionOptions = ['Director', 'Promoter', 'Member'];

  const filteredShareholders = shareholders
    .filter((shareholder) => {
      const matchesSearch = !searchQuery || shareholder.member_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = !genderFilter || shareholder.gender === genderFilter;
      const matchesPosition = !positionFilter || shareholder.position_of_member === positionFilter;

      return matchesSearch && matchesGender && matchesPosition;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Shareholders Management</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            reset();
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Shareholder</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Search by Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shareholders..."
                className="form-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All</option>
              <option value="m">Male</option>
              <option value="f">Female</option>
            </select>
          </div>

          <div>
            <label className="form-label">Position</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All</option>
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || genderFilter || positionFilter) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchQuery('');
                setGenderFilter('');
                setPositionFilter('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Shareholder' : 'Add Shareholder'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                  <label className="form-label">FPO Name *</label>
                  <div>{fpos[0]?.fpo_name || 'N/A'}</div>
                </div>


                  <div>
                    <label className="form-label">Member Name *</label>
                    <input
                      {...register('member_name', { required: 'Member name is required' })}
                      className="form-input"
                      placeholder="Enter member name"
                    />
                    {errors.member_name && <p className="text-red-500 text-sm mt-1">{errors.member_name.message}</p>}
                  </div>


                                    <div>
                    <label className="form-label">Member Phone Number *</label>
                    <input
                      {...register('member_phone_number', { required: 'Member phone number is required', pattern: { value: /^[6789]\d{9}$/, message: 'Invalid phone number' } })}
                      className="form-input"
                      placeholder="Enter member phone number"
                    />
                    {errors.member_name && <p className="text-red-500 text-sm mt-1">{errors.member_name.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Gender *</label>
                    <select
                      {...register('gender', { required: 'Gender is required' })}
                      className="form-input"
                    >
                      <option value="">Select Gender</option>
                      <option value="m">Male</option>
                      <option value="f">Female</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      {...register('date_of_birth', { required: 'Date of birth is required' })}
                      className="form-input"
                    />
                    {errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Date of Share Taken *</label>
                    <input
                      type="date"
                      {...register('date_of_share_taken', { required: 'Date of share taken is required' })}
                      className="form-input"
                    />
                    {errors.date_of_share_taken && <p className="text-red-500 text-sm mt-1">{errors.date_of_share_taken.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Position of Member *</label>
                    <select
                      {...register('position_of_member', { required: 'Position is required' })}
                      className="form-input"
                    >
                      <option value="">Select Position</option>
                      {positionOptions.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                    {errors.position_of_member && <p className="text-red-500 text-sm mt-1">{errors.position_of_member.message}</p>}
                  </div>
                </div>
              </div>

              {/* Director-specific fields */}
              {selectedPosition === 'Director' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Director Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="form-label">Date of Joining *</label>
                      <input
                        type="date"
                        {...register('date_of_joining', { 
                          required: selectedPosition === 'Director' ? 'Date of joining is required for Directors' : false 
                        })}
                        className="form-input"
                      />
                      {errors.date_of_joining && <p className="text-red-500 text-sm mt-1">{errors.date_of_joining.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Education Qualification *</label>
                      <select
                        {...register('education_qualification', { 
                          required: selectedPosition === 'Director' ? 'Education qualification is required for Directors' : false 
                        })}
                        className="form-input"
                      >
                        <option value="">Select Education</option>
                        {educationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                      {errors.education_qualification && <p className="text-red-500 text-sm mt-1">{errors.education_qualification.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">DIN *</label>
                      <input
                        type="number"
                        {...register('din', { 
                          required: selectedPosition === 'Director' ? 'din is required for Directors' : false 
                        })}
                        className="form-input"
                        placeholder="Enter din"
                      />
                      {errors.din && <p className="text-red-500 text-sm mt-1">{errors.din.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Share Money Deposited</label>
                    <input
                      type="text"
                      
                      {...register('sharemoney_deposited_by_member')}
                      className="form-input"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="form-label">Number of Shares Allotted</label>
                    <input
                      type="text"

                      {...register('number_of_share_alloted_amount')}
                      className="form-input"
                      placeholder="Enter share amount"
                    />
                  </div>

                  <div>
                    <label className="form-label">Land Holding (Acres)</label>
                    <input
                      type="text"
                      
                      {...register('land_holding_of_shares_in_acres')}
                      className="form-input"
                      placeholder="Enter land holding in acres"
                    />
                  </div>

                  <div>
                    <label className="form-label">Folio/Share Distinctive No.</label>
                    <input
                      {...register('folio_share_distinctive_no')}
                      className="form-input"
                      placeholder="Enter folio number"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Status of Member</label>
                    <input
                      {...register('status_of_member')}
                      className="form-input"
                      placeholder="Enter member status"
                    />
                  </div>

                  <div>
                    <label className="form-label">Share Transfer</label>
                    <input
                      {...register('share_transfer')}
                      className="form-input"
                      placeholder="Enter share transfer details"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_scst')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    SC/ST Member
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    reset();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingId ? 'Update Shareholder' : 'Add Shareholder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shareholders List */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share Money</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SC/ST</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShareholders.map((shareholder) => (
                <tr key={shareholder.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shareholder.member_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.gender === 'm' ? 'Male' : 'Female'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.position_of_member}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shareholder.sharemoney_deposited_by_member ? `₹${(shareholder.sharemoney_deposited_by_member).toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.is_scst ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(shareholder)}
                      className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(shareholder.id)}
                      className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredShareholders.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shareholders found</h3>
              <p className="text-gray-600">Get started by adding your first shareholder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareholdersPage;