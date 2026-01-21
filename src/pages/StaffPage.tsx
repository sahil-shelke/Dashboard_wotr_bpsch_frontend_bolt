import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Users, FileEdit as Edit, Trash2, Plus, Search, Filter } from 'lucide-react';

interface StaffFormData {
  phone_number: string;
  name: string;
  gender: 'm' | 'f';
  education_qualification: 'illiterate' | 'secondary' | 'higher secondary' | 'diploma' | 'graduate' | 'postgraduate' | 'others';
  degree_title?: string;
  date_of_joining: string;
  designation: 'ceo' | 'chairperson' | 'manager' | 'staff' | 'other';
  DIN?: string;
  fpo_id: number;
}

const StaffPage: React.FC = () => {
    const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [designationFilter, setDesignationFilter] = useState<string>('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormData>();

  useEffect(() => {
    const fetchFPOs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/fpo/approved', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFpos(response.data);
        setFpoId(response.data[0]?.fpo_id || null);
      } catch (error) {
        // toast.error('Failed to fetch FPOs');
      }
    };
    fetchFPOs();
  }, []);


    useEffect(() => {
      if (fpo_id) fetchStaff();
    }, [fpo_id]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`/api/staff/${fpo_id}`);
      setStaff(response.data);
    } catch (error) {
      // toast.error('Failed to fetch staff members');
    }
  };


  const onSubmit = async (data: StaffFormData) => {
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/staff/${editingId}`, data);
        toast.success('Staff member updated successfully!');
        setEditingId(null);
      } else {
        const payload = {
          ...data,
          fpo_id
        }
        await axios.post('/api/staff/', payload);
        toast.success('Staff member created successfully!');
      }
      reset();
      setShowForm(false);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingId(staffMember.id);
    reset({
      ...staffMember,
      date_of_joining: staffMember.date_of_joining?.split('T')[0] || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await axios.delete(`/api/staff/${id}`);
        toast.success('Staff member deleted successfully!');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to delete staff member');
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

  const designationOptions = [
    { value: 'ceo', label: 'CEO' },
    { value: 'chairperson', label: 'Chairperson' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' },
    { value: 'other', label: 'Other' }
  ];

  const filteredStaff = staff
    .filter((staffMember) => {
      const matchesSearch = !searchQuery || staffMember.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = !genderFilter || staffMember.gender === genderFilter;
      const matchesDesignation = !designationFilter || staffMember.designation === designationFilter;

      return matchesSearch && matchesGender && matchesDesignation;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
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
          <span>Add Staff Member</span>
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
                placeholder="Search staff..."
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
            <label className="form-label">Designation</label>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All</option>
              {designationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || genderFilter || designationFilter) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchQuery('');
                setGenderFilter('');
                setDesignationFilter('');
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Staff Member' : 'Add Staff Member'}
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

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                       <label className="form-label">FPO Name *</label>
                       <div>{fpos[0]?.fpo_name || 'N/A'}</div>
                     </div>
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    {...register('phone_number', { 
                      required: 'Phone number is required',
                      pattern: { value: /^[789]\d{9}$/, message: 'Invalid phone number' }
                    })}
                    className="form-input"
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    disabled={!!editingId}
                  />
                  {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>}
                  {editingId && <p className="text-sm text-gray-500 mt-1">Phone number cannot be changed</p>}
                </div>

                <div>
                  <label className="form-label">Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="form-input"
                    placeholder="Enter staff member name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
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
                  <label className="form-label">Education Qualification *</label>
                  <select
                    {...register('education_qualification', { required: 'Education qualification is required' })}
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
                  <label className="form-label">Degree Title</label>
                  <input
                    {...register('degree_title')}
                    className="form-input"
                    placeholder="Enter degree title"
                  />
                </div>

                <div>
                  <label className="form-label">Date of Joining *</label>
                  <input
                    type="date"
                    {...register('date_of_joining', { required: 'Date of joining is required' })}
                    className="form-input"
                  />
                  {errors.date_of_joining && <p className="text-red-500 text-sm mt-1">{errors.date_of_joining.message}</p>}
                </div>

                <div>
                  <label className="form-label">Designation *</label>
                  <select
                    {...register('designation', { required: 'Designation is required' })}
                    className="form-input"
                  >
                    <option value="">Select Designation</option>
                    {designationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation.message}</p>}
                </div>

                <div>
                  <label className="form-label">DIN (Optional)</label>
                  <input
                    {...register('DIN')}
                    className="form-input"
                    placeholder="Enter DIN if applicable"
                  />
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
                  <span>{loading ? 'Saving...' : editingId ? 'Update Staff' : 'Add Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((staffMember) => (
                <tr key={staffMember.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staffMember.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {designationOptions.find(d => d.value === staffMember.designation)?.label || staffMember.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.gender === 'm' ? 'Male' : 'Female'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.education_qualification}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staffMember.date_of_joining ? new Date(staffMember.date_of_joining).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(staffMember)}
                      className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(staffMember.id)}
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

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600">Get started by adding your first staff member.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPage;