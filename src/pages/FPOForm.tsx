import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save } from 'lucide-react';

interface FPOFormData {
  name: string;
  state: string;
  district: string;
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
  donors: Array<{
    donor_type: 'government' | 'corporate' | 'others';
    donor_name: string;
  }>;
}

const FPOForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FPOFormData>({
    defaultValues: {
      donors: [{ donor_type: 'government', donor_name: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'donors'
  });

  useEffect(() => {
    fetchFPOs();
  }, []);

  const fetchFPOs = async () => {
    try {
      const response = await axios.get('/api/fpo/');
      setFpos(response.data);
    } catch (error) {
      // toast.error('Failed to fetch FPOs');
    }
  };

  const onSubmit = async (data: FPOFormData) => {
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/fpo/${editingId}`, data);
        toast.success('FPO updated successfully!');
        setEditingId(null);
      } else {
        await axios.post('/api/fpo/', data);
        toast.success('FPO created successfully!');
      }
      reset();
      fetchFPOs();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fpo: any) => {
    setEditingId(fpo.fpo_id);
    reset({
      ...fpo,
      registration_date: fpo.registration_date?.split('T')[0] || '',
      donors: fpo.donors || [{ donor_type: 'government', donor_name: '' }]
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this FPO?')) {
      try {
        await axios.delete(`/api/fpo/${id}`);
        toast.success('FPO deleted successfully!');
        fetchFPOs();
      } catch (error) {
        toast.error('Failed to delete FPO');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {editingId ? 'Edit FPO' : 'Add New FPO'}
        </h1>
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
              <label className="form-label">FPO Name *</label>
              <input
                {...register('name', { required: 'FPO name is required' })}
                className="form-input"
                placeholder="Enter FPO name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="form-label">State *</label>
              <input
                {...register('state', { required: 'State is required' })}
                className="form-input"
                placeholder="Enter state"
              />
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>}
            </div>

            <div>
              <label className="form-label">District *</label>
              <input
                {...register('district', { required: 'District is required' })}
                className="form-input"
                placeholder="Enter district"
              />
              {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>}
            </div>

            <div>
              <label className="form-label">FPC Registration Number *</label>
              <input
                {...register('fpc_registration_number', { required: 'Registration number is required' })}
                className="form-input"
                placeholder="Enter registration number"
              />
              {errors.fpc_registration_number && <p className="text-red-500 text-sm mt-1">{errors.fpc_registration_number.message}</p>}
            </div>

            <div>
              <label className="form-label">PAN *</label>
              <input
                {...register('pan', { 
                  required: 'PAN is required',
                  maxLength: { value: 10, message: 'PAN must be 10 characters' }
                })}
                className="form-input"
                placeholder="Enter PAN"
                maxLength={10}
              />
              {errors.pan && <p className="text-red-500 text-sm mt-1">{errors.pan.message}</p>}
            </div>

            <div>
              <label className="form-label">TAN *</label>
              <input
                {...register('tan', { 
                  required: 'TAN is required',
                  maxLength: { value: 10, message: 'TAN must be 10 characters' }
                })}
                className="form-input"
                placeholder="Enter TAN"
                maxLength={10}
              />
              {errors.tan && <p className="text-red-500 text-sm mt-1">{errors.tan.message}</p>}
            </div>

            <div>
              <label className="form-label">GST Number *</label>
              <input
                {...register('gst_number', { 
                  required: 'GST number is required',
                  maxLength: { value: 15, message: 'GST number must be 15 characters' }
                })}
                className="form-input"
                placeholder="Enter GST number"
                maxLength={15}
              />
              {errors.gst_number && <p className="text-red-500 text-sm mt-1">{errors.gst_number.message}</p>}
            </div>

            <div>
              <label className="form-label">Registration Date *</label>
              <input
                type="date"
                {...register('registration_date', { required: 'Registration date is required' })}
                className="form-input"
              />
              {errors.registration_date && <p className="text-red-500 text-sm mt-1">{errors.registration_date.message}</p>}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
            
            <div>
              <label className="form-label">Registered Company Address *</label>
              <textarea
                {...register('registered_company_address', { required: 'Address is required' })}
                className="form-input"
                rows={3}
                placeholder="Enter registered company address"
              />
              {errors.registered_company_address && <p className="text-red-500 text-sm mt-1">{errors.registered_company_address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Office Address *</label>
                <textarea
                  {...register('office_address', { required: 'Office address is required' })}
                  className="form-input"
                  rows={3}
                  placeholder="Enter office address"
                />
                {errors.office_address && <p className="text-red-500 text-sm mt-1">{errors.office_address.message}</p>}
              </div>

              <div>
                <label className="form-label">Office Block *</label>
                <input
                  {...register('office_block', { required: 'Office block is required' })}
                  className="form-input"
                  placeholder="Enter office block"
                />
                {errors.office_block && <p className="text-red-500 text-sm mt-1">{errors.office_block.message}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="form-label">Contact Name *</label>
                <input
                  {...register('office_contact_name', { required: 'Contact name is required' })}
                  className="form-input"
                  placeholder="Enter contact name"
                />
                {errors.office_contact_name && <p className="text-red-500 text-sm mt-1">{errors.office_contact_name.message}</p>}
              </div>

              <div>
                <label className="form-label">Contact Number *</label>
                <input
                  {...register('office_contact_number', { 
                    required: 'Contact number is required',
                    pattern: { value: /^[789]\d{9}$/, message: 'Invalid phone number' }
                  })}
                  className="form-input"
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
                {errors.office_contact_number && <p className="text-red-500 text-sm mt-1">{errors.office_contact_number.message}</p>}
              </div>

              <div>
                <label className="form-label">Contact Email *</label>
                <input
                  type="email"
                  {...register('office_contact_email', { required: 'Email is required' })}
                  className="form-input"
                  placeholder="Enter email address"
                />
                {errors.office_contact_email && <p className="text-red-500 text-sm mt-1">{errors.office_contact_email.message}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Responsible WOTR Staff Phone *</label>
              <input
                {...register('responsible_wotr_staff_phone', { 
                  required: 'WOTR staff phone is required',
                  pattern: { value: /^[789]\d{9}$/, message: 'Invalid phone number' }
                })}
                className="form-input"
                placeholder="Enter WOTR staff phone number"
                maxLength={10}
              />
              {errors.responsible_wotr_staff_phone && <p className="text-red-500 text-sm mt-1">{errors.responsible_wotr_staff_phone.message}</p>}
            </div>
          </div>

          {/* Donors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Donors</h3>
              <button
                type="button"
                onClick={() => append({ donor_type: 'government', donor_name: '' })}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Donor</span>
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="form-label">Donor Type</label>
                  <select
                    {...register(`donors.${index}.donor_type` as const)}
                    className="form-input"
                  >
                    <option value="government">Government</option>
                    <option value="corporate">Corporate</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Donor Name</label>
                  <input
                    {...register(`donors.${index}.donor_name` as const, { required: 'Donor name is required' })}
                    className="form-input"
                    placeholder="Enter donor name"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="btn-secondary text-red-600 hover:bg-red-50"
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
              <span>{loading ? 'Saving...' : editingId ? 'Update FPO' : 'Create FPO'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* FPO List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing FPOs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fpos.map((fpo) => (
                <tr key={fpo.fpo_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fpo.fpo_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fpo.state}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fpo.district}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fpo.fpc_registration_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(fpo)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(fpo.fpo_id)}
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

export default FPOForm;