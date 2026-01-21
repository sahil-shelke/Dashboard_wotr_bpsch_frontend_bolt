import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Users, Edit, Trash2, Plus, Filter } from 'lucide-react';
import ProjectManagers from './ProjectManagers';

interface AgribusinessOfficerData {
  phone_number: string;
  first_name: string;
  last_name: string;
  password: string;
  email: string;
  state_code: number | null;
  district_code: number | null;
  role_id: number;
}

interface District {
  state_code: number;
  state_name: string;
  district_code: number;
  district_name: string;
}

const AgribusinessOfficers: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState<number | null>(null);
  const [originalData, setOriginalData] = useState<Partial<AgribusinessOfficerData> | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgribusinessOfficerData>({
    defaultValues: {
      role_id: 5 // Agribusiness Officer role
    }
  });

  useEffect(() => {
    fetchOfficers();
    fetchDistricts();
  }, []);

  const fetchOfficers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/agri_business/agri_business_officers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOfficers(response.data);
    } catch (error) {
      // toast.error('Failed to fetch agribusiness officers');
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
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      toast.error('Failed to fetch districts');
    }
  };

const onSubmit = async (data: AgribusinessOfficerData) => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const finalData: AgribusinessOfficerData = {
      ...data,
      state_code: selectedStateCode,
    };

    let payloadToSend = finalData;

    // When editing → send only changed fields + phone_number
    if (editingPhone && originalData) {
      payloadToSend = Object.entries(finalData).reduce((acc, [key, value]) => {
        const origValue = (originalData as any)[key];
        if (value !== origValue && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      payloadToSend.phone_number = editingPhone; // always send phone number
    }

    if (editingPhone) {
      await axios.put(`/api/agri_business/${editingPhone}`, payloadToSend, { headers });
      toast.success('Agribusiness Officer updated successfully!');
      setEditingPhone(null);
      setOriginalData(null);
    } else {
      await axios.post('/api/agri_business/create_agri_business_officer', finalData, { headers });
      toast.success('Agribusiness Officer created successfully!');
    }

    reset();
    setShowForm(false);
    fetchOfficers();
  } catch (error: any) {
    toast.error(error.response?.data?.detail || 'Operation failed');
  } finally {
    setLoading(false);
  }
};





const handleEdit = (officer: any) => {
  setEditingPhone(officer.phone_number);

  // Set selected state and district
  setSelectedState(officer.statename);
  const selectedDistrict = districts.find(d => d.district_name === officer.districtname);
  setSelectedStateCode(selectedDistrict?.state_code || null);

  // Save original data for diff tracking
  const editableFields = {
    phone_number: officer.phone_number,
    first_name: officer.first_name,
    last_name: officer.last_name,
    email: officer.email,
    state_code: selectedDistrict?.state_code || null,
    district_code: selectedDistrict?.district_code || null,
    role_id: 5
  };
  setOriginalData(editableFields);

  reset({
    ...editableFields,
    password: ''
  });

  setShowForm(true);
};


  const handleDelete = async (phone_number: string) => {
    if (window.confirm('Are you sure you want to delete this Agribusiness Officer?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/pm/${phone_number}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Agribusiness Officer deleted successfully!');
        fetchOfficers();
      } catch (error) {
        toast.error('Failed to delete Agribusiness Officer');
      }
    }
  };



  const filteredOfficers = officers.filter(officer => {
    const matchesState = filterState === '' || officer.statename === filterState;
    const matchesDistrict = filterDistrict === '' || officer.districtname?.toLowerCase().includes(filterDistrict.toLowerCase());
    return matchesState && matchesDistrict;
  });


  const uniqueStates = [...new Set(officers.map(officer => officer.statename))].filter(Boolean).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Agri Business Officer</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPhone(null);
            reset({ role_id: 5 });
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Agribusiness Officer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">State:</label>
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
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">District:</label>
              <input
                type="text"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                placeholder="Search district..."
                className="form-input w-48"
              />
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredOfficers.length} of {officers.length} officers
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPhone ? 'Edit Agribusiness Officer' : 'Add Agribusiness Officer'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={!!editingPhone}
                  />
                  {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>}
                  {editingPhone && <p className="text-sm text-gray-500 mt-1">Phone number cannot be changed</p>}
                </div>

                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    className="form-input"
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="form-label">First Name *</label>
                  <input
                    {...register('first_name', { required: 'First name is required' })}
                    className="form-input"
                    placeholder="Enter first name"
                  />
                  {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
                </div>

                <div>
                  <label className="form-label">Last Name *</label>
                  <input
                    {...register('last_name', { required: 'Last name is required' })}
                    className="form-input"
                    placeholder="Enter last name"
                  />
                  {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
                </div>

                <div>
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    {...register('password', { minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                    className="form-input"
                    placeholder={editingPhone ? "Leave blank to keep current password" : "Enter password"}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                  {editingPhone && <p className="text-sm text-gray-500 mt-1">Leave blank to keep current password</p>}
                </div>

                <div>
                  <label className="form-label">State *</label>
                  <select
                    className="form-input"
                    {...register('state_code', { required: 'State is required', valueAsNumber: true })}
                    onChange={(e) => {
                      const code = parseInt(e.target.value);
                      setSelectedStateCode(code);
                      const selected = districts.find(d => d.state_code === code);
                      setSelectedState(selected?.state_name || '');
                    }}
                  >
                    <option value="">Select State</option>
                    {[...new Map(districts.map(d => [d.state_code, d.state_name]))]
                      .map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                  </select>
                  {errors.state_code && <p className="text-red-500 text-sm mt-1">{errors.state_code.message}</p>}
                </div>

                <div>
                  <label className="form-label">District *</label>
                  <select
                    {...register('district_code', { required: 'District is required', valueAsNumber: true })}
                    className="form-input"
                    disabled={!selectedStateCode}
                  >
                    <option value="">Select District</option>
                    {districts
                      .filter(d => d.state_code === selectedStateCode)
                      .map((district) => (
                        <option key={district.district_code} value={district.district_code.toString()}>
                          {district.district_name}
                        </option>
                      ))}
                  </select>
                  {errors.district_code && <p className="text-red-500 text-sm mt-1">{errors.district_code.message}</p>}
                </div>

                <input type="hidden" {...register('role_id')} value={5} />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPhone(null);
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
                  <span>{loading ? 'Saving...' : editingPhone ? 'Update Manager' : 'Create Manager'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Managers List */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOfficers.map((officer) => (
                <tr key={officer.phone_number}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {officer.first_name} {officer.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{officer.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{officer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{officer.statename}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{officer.districtname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(officer)}
                      className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(officer.phone_number)}
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

          {filteredOfficers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Agribusiness Officers found</h3>
              <p className="text-gray-600">
                {officers.length === 0 ? 'Get started by adding your first Agribusiness Officer.' : 'Try adjusting your filters.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgribusinessOfficers;