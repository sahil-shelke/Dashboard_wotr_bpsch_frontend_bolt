
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, CheckSquare, Plus } from 'lucide-react';

interface ComplianceFormData {
  fpo_id: number;
  audit_report_completion: 'In Process' | 'Completed' | 'Not Started';
  dir_3_kyc: 'In Process' | 'Completed' | 'Not Started';
  agm: 'In Process' | 'Completed' | 'Not Started';
  form_adt_1: 'In Process' | 'Completed' | 'Not Started';
  form_aoc_4: 'In Process' | 'Completed' | 'Not Started';
  mgt_7: 'In Process' | 'Completed' | 'Not Started';
  mgt_14: 'In Process' | 'Completed' | 'Not Started';
  penalties: 'In Process' | 'Completed' | 'Not Started';
  semiannual: 'h1' | 'h2';
  fy_year: string;
}

const ComplianceForm: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [compliances, setCompliances] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ComplianceFormData>();

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
    if (fpo_id) fetchCompliances();
  }, [fpo_id]);

  const fetchCompliances = async () => {
    try {
      const response = await axios.get(`/api/fpc_compliance/${fpo_id}`);
      setCompliances(response.data);
      console.log('Fetched compliances:', response.data);
    } catch (error) {
      // toast.error('Failed to fetch compliance details');
    }
  };


  const onSubmit = async (data: ComplianceFormData) => {
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`/api/fpc_compliance/${editingId}`, data);
        toast.success('Compliance details updated successfully!');
        setEditingId(null);
      } else {
        const payload = {
          ...data, 
          fpo_id
        }
        await axios.post('/api/fpc_compliance/', payload);
        toast.success('Compliance details created successfully!');
      }
      reset();
      fetchCompliances();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (compliance: any) => {
    setEditingId(compliance.id);
    reset(compliance);
    setIsModalOpen(true);
  };

  const handleDelete = async (fpo_id: number) => {
    if (window.confirm('Are you sure you want to delete this compliance record?')) {
      try {
        await axios.delete(`/api/fpc_compliance/${fpo_id}`);
        toast.success('Compliance record deleted successfully!');
        fetchCompliances();
      } catch (error) {
        // toast.error('Failed to delete compliance record');
      }
    }
  };

  const generateFYOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      options.push(`${i}-${(i + 1).toString().slice(-2)}`);
    }
    return options;
  };

  const complianceFields = [
    { key: 'audit_report_completion', label: 'Audit Report Completion' },
    { key: 'dir_3_kyc', label: 'DIR-3 KYC' },
    { key: 'agm', label: 'AGM (Annual General Meeting)' },
    { key: 'form_adt_1', label: 'Form ADT-1' },
    { key: 'form_aoc_4', label: 'Form AOC-4' },
    { key: 'mgt_7', label: 'MGT-7' },
    { key: 'mgt_14', label: 'MGT-14' },
    { key: 'penalties', label: 'Penalties' }
  ];

  const statusOptions = ['Not Started', 'In Process', 'Completed'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Process': return 'text-yellow-600 bg-yellow-100';
      case 'Not Started': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckSquare className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">FPC Compliance</h1>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            reset();
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Compliance</span>
        </button>
      </div>

      {/* Compliance List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Compliance Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">FY Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audit Report</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AGM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {compliances.map((compliance) => (
                <tr key={compliance.id}>
                  <td className="px-6 py-4">{compliance.fy_year}</td>
                  <td className="px-6 py-4">{compliance.semiannual === 'h1' ? 'H1' : 'H2'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(compliance.audit_report_completion)}`}>
                      {compliance.audit_report_completion}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(compliance.agm)}`}>
                      {compliance.agm}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(compliance)} className="text-primary-600 hover:text-primary-900">Edit</button>
                    <button onClick={() => handleDelete(compliance.fpo_id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Compliance' : 'Add Compliance'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                <div>
                  <label className="form-label">FPO Name *</label>
                  <div>{fpos[0]?.fpo_name || 'N/A'}</div>
                </div>


                <div>
                  <label className="form-label">Financial Year *</label>
                  <select {...register('fy_year', { required: 'Financial year is required' })} className="form-input">
                    <option value="">Select Financial Year</option>
                    {generateFYOptions().map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.fy_year && <p className="text-red-500 text-sm">{errors.fy_year.message}</p>}
                </div>

                <div>
                  <label className="form-label">Semi-Annual *</label>
                  <select {...register('semiannual', { required: 'Semi-annual is required' })} className="form-input">
                    <option value="">Select Period</option>
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                  </select>
                  {errors.semiannual && <p className="text-red-500 text-sm">{errors.semiannual.message}</p>}
                </div>
              </div>

              {/* Compliance Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complianceFields.map((field) => (
                  <div key={field.key}>
                    <label className="form-label">{field.label} *</label>
                    <select
                      {...register(field.key as keyof ComplianceFormData, { required: `${field.label} is required` })}
                      className="form-input"
                    >
                      <option value="">Select Status</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    {errors[field.key as keyof ComplianceFormData] && (
                      <p className="text-red-500 text-sm">{errors[field.key as keyof ComplianceFormData]?.message}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingId ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceForm;
