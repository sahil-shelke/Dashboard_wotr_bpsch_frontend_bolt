import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Shield } from 'lucide-react';

interface BODFormData {
  mobile_number: string;
  fpo_id: number;
  name: string;
  gender: 'm' | 'f';
  education_qualification: string;
  DIN: number;
  address: string;
}

const BODForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [bods, setBods] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BODFormData>();

  useEffect(() => {
    fetchBODs();
    fetchFPOs();
  }, []);

  const fetchBODs = async () => {
    try {
      const response = await axios.get('/api/bod_details/');
      setBods(response.data);
    } catch (error) {
      // toast.error('Failed to fetch BOD details');
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

  const onSubmit = async (data: BODFormData) => {
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/bod_details/${editingId}`, data);
        toast.success('BOD details updated successfully!');
        setEditingId(null);
      } else {
        await axios.post('/api/bod_details/', data);
        toast.success('BOD details created successfully!');
      }
      reset();
      fetchBODs();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bod: any) => {
    setEditingId(bod.mobile_number);
    reset(bod);
  };

  const handleDelete = async (mobile_number: string) => {
    if (window.confirm('Are you sure you want to delete this BOD record?')) {
      try {
        await axios.delete(`/api/bod_details/${mobile_number}`);
        toast.success('BOD record deleted successfully!');
        fetchBODs();
      } catch (error) {
        // toast.error('Failed to delete BOD record');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {editingId ? 'Edit BOD Details' : 'Add BOD Details'}
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
              <label className="form-label">Mobile Number * (Primary Key)</label>
              <input
                {...register('mobile_number', { 
                  required: 'Mobile number is required',
                  pattern: { value: /^[789]\d{9}$/, message: 'Invalid mobile number' }
                })}
                className="form-input"
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                disabled={!!editingId}
              />
              {errors.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number.message}</p>}
              {editingId && <p className="text-sm text-gray-500 mt-1">Mobile number cannot be changed</p>}
            </div>

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
              <label className="form-label">BOD Member Name *</label>
              <input
                {...register('name', { required: 'BOD member name is required' })}
                className="form-input"
                placeholder="Enter BOD member name"
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
              <span>{loading ? 'Saving...' : editingId ? 'Update BOD' : 'Create BOD'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* BOD List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing BOD Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FPO ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bods.map((bod) => (
                <tr key={bod.mobile_number}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bod.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bod.mobile_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bod.gender === 'm' ? 'Male' : 'Female'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bod.DIN}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bod.fpo_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(bod)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bod.mobile_number)}
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

export default BODForm;