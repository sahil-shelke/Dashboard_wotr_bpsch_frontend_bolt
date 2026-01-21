import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, UserCheck } from 'lucide-react';

interface CEOFormData {
  fpo_id: number;
  name: string;
  gender: 'm' | 'f';
  joining_date: string;
  mobile_number: string;
  aadhar_number: string;
  education_qualification: 'illiterate' | 'secondary' | 'higher secondary' | 'diploma' | 'graduate' | 'postgraduate' | 'others';
  degree_title: string;
}

const CEOForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [ceos, setCeos] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CEOFormData>();

  useEffect(() => {
    fetchCEOs();
    fetchFPOs();
  }, []);

  const fetchCEOs = async () => {
    try {
      const response = await axios.get('/api/ceo_details/');
      setCeos(response.data);
    } catch (error) {
      // toast.error('Failed to fetch CEO details');
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

  const onSubmit = async (data: CEOFormData) => {
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/ceo_details/${editingId}`, data);
        toast.success('CEO details updated successfully!');
        setEditingId(null);
      } else {
        await axios.post('/api/ceo_details/', data);
        toast.success('CEO details created successfully!');
      }
      reset();
      fetchCEOs();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ceo: any) => {
    setEditingId(ceo.id);
    reset({
      ...ceo,
      joining_date: ceo.joining_date?.split('T')[0] || '',
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this CEO record?')) {
      try {
        await axios.delete(`/api/ceo_details/${id}`);
        toast.success('CEO record deleted successfully!');
        fetchCEOs();
      } catch (error) {
        // toast.error('Failed to delete CEO record');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCheck className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {editingId ? 'Edit CEO Details' : 'Add CEO Details'}
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
              <label className="form-label">CEO Name *</label>
              <input
                {...register('name', { required: 'CEO name is required' })}
                className="form-input"
                placeholder="Enter CEO name"
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
              <label className="form-label">Joining Date *</label>
              <input
                type="date"
                {...register('joining_date', { required: 'Joining date is required' })}
                className="form-input"
              />
              {errors.joining_date && <p className="text-red-500 text-sm mt-1">{errors.joining_date.message}</p>}
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
              <label className="form-label">Aadhar Number *</label>
              <input
                {...register('aadhar_number', { 
                  required: 'Aadhar number is required',
                  pattern: { value: /^\d{12}$/, message: 'Aadhar number must be 12 digits' }
                })}
                className="form-input"
                placeholder="Enter 12-digit Aadhar number"
                maxLength={12}
              />
              {errors.aadhar_number && <p className="text-red-500 text-sm mt-1">{errors.aadhar_number.message}</p>}
            </div>
          </div>

          {/* Education Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Education Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Education Qualification *</label>
                <select
                  {...register('education_qualification', { required: 'Education qualification is required' })}
                  className="form-input"
                >
                  <option value="">Select Qualification</option>
                  <option value="illiterate">Illiterate</option>
                  <option value="secondary">Secondary</option>
                  <option value="higher secondary">Higher Secondary</option>
                  <option value="diploma">Diploma</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="others">Others</option>
                </select>
                {errors.education_qualification && <p className="text-red-500 text-sm mt-1">{errors.education_qualification.message}</p>}
              </div>

              <div>
                <label className="form-label">Degree Title *</label>
                <input
                  {...register('degree_title', { required: 'Degree title is required' })}
                  className="form-input"
                  placeholder="Enter degree title"
                />
                {errors.degree_title && <p className="text-red-500 text-sm mt-1">{errors.degree_title.message}</p>}
              </div>
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
              <span>{loading ? 'Saving...' : editingId ? 'Update CEO' : 'Create CEO'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CEO List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing CEO Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FPO ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ceos.map((ceo) => (
                <tr key={ceo.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ceo.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ceo.gender === 'm' ? 'Male' : 'Female'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ceo.mobile_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ceo.education_qualification}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ceo.fpo_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(ceo)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ceo.id)}
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

export default CEOForm;