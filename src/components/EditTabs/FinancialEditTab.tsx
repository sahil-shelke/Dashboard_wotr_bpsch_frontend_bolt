import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DollarSign, Edit, Save, X, Plus } from 'lucide-react';

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

interface Financial extends FinancialFormData {
  id: number;
}

interface FinancialEditTabProps {
  fpoId: number;
}

const FinancialEditTab: React.FC<FinancialEditTabProps> = ({ fpoId }) => {
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalData, setOriginalData] = useState<Financial | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, dirtyFields } } = useForm<FinancialFormData>({
    defaultValues: {
      fpo_id: fpoId,
      authorized_capital: 0,
      share_capital: 0,
      reserves: 0,
      income: 0,
      expenditure: 0,
      profit_before_tax: 0,
      profit_after_tax: 0,
      turnover: 0
    }
  });

  useEffect(() => {
    fetchFinancials();
  }, [fpoId]);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/financial_details/${fpoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFinancials(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch financial records');
      }
      setFinancials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (financial: Financial) => {
    setEditingId(financial.id);
    setOriginalData(financial);
    reset(financial);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(false);
    reset({
      fpo_id: fpoId,
      authorized_capital: 0,
      share_capital: 0,
      reserves: 0,
      income: 0,
      expenditure: 0,
      profit_before_tax: 0,
      profit_after_tax: 0,
      turnover: 0,
      fy_year: ''
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(true);
    reset({
      fpo_id: fpoId,
      authorized_capital: 0,
      share_capital: 0,
      reserves: 0,
      income: 0,
      expenditure: 0,
      profit_before_tax: 0,
      profit_after_tax: 0,
      turnover: 0,
      fy_year: ''
    });
  };

  const onSubmit = async (data: FinancialFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      data.fpo_id = fpoId;

      if (showAddForm) {
        await axios.post(
          '/api/financial_details/',
          data,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Financial record created successfully!');
      } else if (editingId) {
        const changedFields: Partial<FinancialFormData> = {};

        (Object.keys(dirtyFields) as Array<keyof FinancialFormData>).forEach((key) => {
          if (dirtyFields[key]) {
            changedFields[key] = data[key] as any;
          }
        });

        if (Object.keys(changedFields).length === 0) {
          toast('No changes to save');
          handleCancelEdit();
          return;
        }

        changedFields.fpo_id = fpoId;

        await axios.put(
          `/api/financial_details/${editingId}`,
          changedFields,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Financial record updated successfully!');
      }

      handleCancelEdit();
      fetchFinancials();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading financial records...</p>
      </div>
    );
  }

  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            FY Year <span className="text-red-500">*</span>
          </label>
          <input
            {...register('fy_year', { required: 'FY Year is required' })}
            className="form-input w-full"
            placeholder="e.g., 2024-25"
          />
          {errors.fy_year && (
            <p className="text-xs text-red-600 mt-1">{errors.fy_year.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Capital (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('authorized_capital', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Share Capital (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('share_capital', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reserves (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('reserves', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Income (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('income', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expenditure (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('expenditure', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profit Before Tax (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('profit_before_tax', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profit After Tax (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('profit_after_tax', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turnover (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('turnover', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>
      </div>

      <div className="flex space-x-2 pt-4 border-t">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? (showAddForm ? 'Creating...' : 'Saving...') : (showAddForm ? 'Create Record' : 'Save Changes')}
        </button>
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isSubmitting}
          className="btn-secondary flex items-center"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Financial Details
        </h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{financials.length} records</span>
          <button
            onClick={handleAddNew}
            disabled={showAddForm || editingId !== null}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-4">Add New Financial Record</h4>
          {renderForm()}
        </div>
      )}

      {financials.length === 0 && !showAddForm ? (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No financial records found for this FPC</p>
        </div>
      ) : (
        <div className="space-y-4">
          {financials.map((financial) => (
            <div key={financial.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === financial.id ? (
                renderForm()
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">FY {financial.fy_year}</h4>
                    <button
                      onClick={() => handleEdit(financial)}
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Authorized Capital</p>
                      <p className="font-medium text-gray-900">₹{financial.authorized_capital.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Share Capital</p>
                      <p className="font-medium text-gray-900">₹{financial.share_capital.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Reserves</p>
                      <p className="font-medium text-gray-900">₹{financial.reserves.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Income</p>
                      <p className="font-medium text-gray-900">₹{financial.income.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expenditure</p>
                      <p className="font-medium text-gray-900">₹{financial.expenditure.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Profit Before Tax</p>
                      <p className="font-medium text-gray-900">₹{financial.profit_before_tax.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Profit After Tax</p>
                      <p className="font-medium text-gray-900">₹{financial.profit_after_tax.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Turnover</p>
                      <p className="font-medium text-gray-900">₹{financial.turnover.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FinancialEditTab;
