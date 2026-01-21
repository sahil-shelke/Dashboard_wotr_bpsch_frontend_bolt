import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, DollarSign, X, Plus } from 'lucide-react';

interface FinancialFormData {
  fpo_id: number;
  authorized_capital: number;
  share_capital: number;
  reserves: number;
  income: number;
  expenditure: number;
  profit_before_tax: number;
  profit_after_tax: number;
  turnover: number;
  fy_year: string;
}

const FinancialForm: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [financials, setFinancials] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FinancialFormData>();

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
      } catch (error) {
        // toast.error('Failed to fetch FPOs');
      }
    };
    fetchFPOs();
  }, []);

  // ✅ Fetch shareholders when fpo_id changes
  useEffect(() => {
    if (fpo_id) fetchFinancials();
  }, [fpo_id]);

  const fetchFinancials = async () => {
    try {
      const response = await axios.get(`/api/financial_details/${fpo_id}`);
      setFinancials(response.data);
    } catch (error) {
      // toast.error('Failed to fetch financial details');
    }
  };



  const onSubmit = async (data: FinancialFormData) => {
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/financial_details/${editingId}`, data);
        toast.success('Financial details updated successfully!');
        setEditingId(null);
      } else {
        const payload = {
        ...data, 
        fpo_id
        }
        await axios.post('/api/financial_details/', payload);
        toast.success('Financial details created successfully!');
      }
      reset();
      setIsModalOpen(false);
      fetchFinancials();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (financial: any) => {
    setEditingId(financial.id);
    reset(financial);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this financial record?')) {
      try {
        await axios.delete(`/api/financial_details/${id}`);
        toast.success('Financial record deleted successfully!');
        fetchFinancials();
      } catch (error) {
        toast.error('Failed to delete financial record');
      }
    }
  };

  // Generate financial year options
  const generateFYOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      options.push(`${i}-${(i + 1).toString().slice(-2)}`);
    }
    return options;
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <DollarSign className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Financial Details</h1>
        </div>
        <button
          onClick={() => {
            reset();
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Financial Details</span>
        </button>
      </div>

      {/* Financial Details List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Financial Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FY Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turnover</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit (After Tax)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share Capital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financials.map((financial) => (
                <tr key={financial.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{financial.fy_year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(financial.turnover).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(financial.profit_after_tax).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(financial.share_capital).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(financial)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(financial.id)}
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

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                reset();
                setEditingId(null);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Financial Details' : 'Add Financial Details'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* FPO + FY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                  <label className="form-label">FPO Name *</label>
                  <div>{fpos[0]?.fpo_name || 'N/A'}</div>
                </div>


                <div>
                  <label className="form-label">Financial Year *</label>
                  <select
                    {...register('fy_year', { required: 'Financial year is required' })}
                    className="form-input"
                  >
                    <option value="">Select Financial Year</option>
                    {generateFYOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.fy_year && <p className="text-red-500 text-sm mt-1">{errors.fy_year.message}</p>}
                </div>
              </div>

              {/* Capital Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Authorized Capital *</label>
                  <input type="number" {...register('authorized_capital', { required: 'Required' })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Share Capital *</label>
                  <input type="number" {...register('share_capital', { required: 'Required' })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Reserves *</label>
                  <input type="number" {...register('reserves', { required: 'Required' })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Turnover *</label>
                  <input type="number" {...register('turnover', { required: 'Required' })} className="form-input" />
                </div>
              </div>

              {/* Income & Expenditure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Income *</label>
                  <input type="number" {...register('income', { required: 'Required' })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Expenditure *</label>
                  <input type="number" {...register('expenditure', { required: 'Required' })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Profit Before Tax *</label>
                  <input type="number" {...register('profit_before_tax', { required: 'Required' })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Profit After Tax *</label>
                  <input type="number" {...register('profit_after_tax', { required: 'Required' })} className="form-input" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setEditingId(null);
                    setIsModalOpen(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingId ? 'Update Financial Details' : 'Create Financial Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialForm;

