import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Crown } from 'lucide-react';

interface ChairpersonFormData {
  fpo_id: number;
  name: string;
  gender: 'm' | 'f';
  mobile_number: string;
  education_qualification: string;
  DIN: number;
  address: string;
}

const ChairpersonForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [chairpersons, setChairpersons] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChairpersonFormData>();

  useEffect(() => {
    fetchChairpersons();
    fetchFPOs();
  }, []);

  const fetchChairpersons = async () => {
    try {
      const response = await axios.get('/api/chairperson_details/');
      setChairpersons(response.data);
    } catch (error) {
      // toast.error('Failed to fetch chairperson details');
    }
  };

  const fetchFPOs = async () => {
    try {
      const response = await axios.get('/api/fpo/');
      setFpos(response.data);
    } catch (error) {
      // toast.error('Failed to fetch FPOs');
    }
  };

  const onSubmit = async (data: ChairpersonFormData) => {
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/chairperson_details/${editingId}`, data);
        toast.success('Chairperson details updated successfully!');
        setEditingId(null);
      } else {
        await axios.post('/api/chairperson_details/', data);
        toast.success('Chairperson details created successfully!');
      }
      reset();
      fetchChairpersons();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (chairperson: any) => {
    setEditingId(chairperson.id);
    reset(chairperson);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this chairperson record?')) {
      try {
        await axios.delete(`/api/chairperson_details/${id}`);
        toast.success('Chairperson record deleted successfully!');
        fetchChairpersons();
      } catch (error) {
        // toast.error('Failed to delete chairperson record');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {editingId ? 'Edit Chairperson Details' : 'Add Chairperson Details'}
          </h1>
        </div>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              reset();
            }}
            className="btn-secondary"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">FPO *</label>
              <select
                {...register('fpo_id', { required: 'FPO selection is required' })}
                className="form-input"
              >
                <option value="">Select FPO</option>
                {fpos.map((fpo) => (
                  <option key={fpo.fpo_id} value={fpo.fpo_id}>
                    {fpo.fpo_name}
                  </option>
                ))}
              </select>
              {errors.fpo_id && <p className="text-red-500 text-sm mt-1">{errors.fpo_id.message}</p>}
            </div>

            <div>
              <label className="form-label">Chairperson Name *</label>
              <input
                {...register('name', { required: 'Chairperson name is required' })}
                className="form-input"
                placeholder="Enter chairperson name"
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
              <label className="form-label">Mobile Number *</label>
              <input
                {...register('mobile_number', { 
                  required: 'Mobile number is required',
                  pattern: { value: /^[789]\d{9}$/, message: 'Invalid mobile number' }
                })}
                className="form-input"
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
              />
              {errors.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number.message}</p>}
            </div>

            <div>
              <label className="form-label">Education Qualification *</label>
              <input
                {...register('education_qualification', { required: 'Education qualification is required' })}
                className="form-input"
                placeholder="Enter education qualification"
              />
              {errors.education_qualification && <p className="text-red-500 text-sm mt-1">{errors.education_qualification.message}</p>}
            </div>

            <div>
              <label className="form-label">DIN (Director Identification Number) *</label>
              <input
                type="number"
                {...register('DIN', { 
                  required: 'DIN is required',
                  min: { value: 10000000, message: 'DIN must be 8 digits' },
                  max: { value: 99999999, message: 'DIN must be 8 digits' }
                })}
                className="form-input"
                placeholder="Enter 8-digit DIN"
              />
              {errors.DIN && <p className="text-red-500 text-sm mt-1">{errors.DIN.message}</p>}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
            
            <div>
              <label className="form-label">Address *</label>
              <textarea
                {...register('address', { required: 'Address is required' })}
                className="form-input"
                rows={3}
                placeholder="Enter complete address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                reset();
                setEditingId(null);
              }}
              className="btn-secondary"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : editingId ? 'Update Chairperson' : 'Create Chairperson'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Chairperson List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Chairperson Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FPO ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chairpersons.map((chairperson) => (
                <tr key={chairperson.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chairperson.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chairperson.gender === 'm' ? 'Male' : 'Female'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chairperson.mobile_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chairperson.DIN}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chairperson.fpo_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(chairperson)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(chairperson.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChairpersonForm;