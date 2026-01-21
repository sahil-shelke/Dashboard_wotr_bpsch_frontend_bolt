import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileCheck, Edit, Save, X, Plus } from 'lucide-react';

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

interface Compliance extends ComplianceFormData {
  id: number;
}

interface ComplianceEditTabProps {
  fpoId: number;
}

const STATUS_OPTIONS = ['In Process', 'Completed', 'Not Started'];

const ComplianceEditTab: React.FC<ComplianceEditTabProps> = ({ fpoId }) => {
  const [compliances, setCompliances] = useState<Compliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalData, setOriginalData] = useState<Compliance | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, dirtyFields } } = useForm<ComplianceFormData>({
    defaultValues: {
      fpo_id: fpoId,
      audit_report_completion: 'Not Started',
      dir_3_kyc: 'Not Started',
      agm: 'Not Started',
      form_adt_1: 'Not Started',
      form_aoc_4: 'Not Started',
      mgt_7: 'Not Started',
      mgt_14: 'Not Started',
      penalties: 'Not Started',
      semiannual: 'h1'
    }
  });

  useEffect(() => {
    fetchCompliances();
  }, [fpoId]);

  const fetchCompliances = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/fpc_compliance/${fpoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCompliances(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch compliance records');
      }
      setCompliances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (compliance: Compliance) => {
    setEditingId(compliance.id);
    setOriginalData(compliance);
    reset(compliance);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(false);
    reset({
      fpo_id: fpoId,
      audit_report_completion: 'Not Started',
      dir_3_kyc: 'Not Started',
      agm: 'Not Started',
      form_adt_1: 'Not Started',
      form_aoc_4: 'Not Started',
      mgt_7: 'Not Started',
      mgt_14: 'Not Started',
      penalties: 'Not Started',
      semiannual: 'h1',
      fy_year: ''
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(true);
    reset({
      fpo_id: fpoId,
      audit_report_completion: 'Not Started',
      dir_3_kyc: 'Not Started',
      agm: 'Not Started',
      form_adt_1: 'Not Started',
      form_aoc_4: 'Not Started',
      mgt_7: 'Not Started',
      mgt_14: 'Not Started',
      penalties: 'Not Started',
      semiannual: 'h1',
      fy_year: ''
    });
  };

  const onSubmit = async (data: ComplianceFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      data.fpo_id = fpoId;

      if (showAddForm) {
        await axios.post(
          '/api/fpc_compliance/',
          data,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Compliance record created successfully!');
      } else if (editingId) {
        const changedFields: Partial<ComplianceFormData> = {};

        (Object.keys(dirtyFields) as Array<keyof ComplianceFormData>).forEach((key) => {
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
          `/api/fpc_compliance/${editingId}`,
          changedFields,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Compliance record updated successfully!');
      }

      handleCancelEdit();
      fetchCompliances();
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
        <p className="ml-3 text-gray-600">Loading compliance records...</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Semiannual</label>
          <select {...register('semiannual')} className="form-input w-full">
            <option value="h1">H1</option>
            <option value="h2">H2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audit Report Completion</label>
          <select {...register('audit_report_completion')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DIR-3 KYC</label>
          <select {...register('dir_3_kyc')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AGM</label>
          <select {...register('agm')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form ADT-1</label>
          <select {...register('form_adt_1')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form AOC-4</label>
          <select {...register('form_aoc_4')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MGT-7</label>
          <select {...register('mgt_7')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MGT-14</label>
          <select {...register('mgt_14')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Penalties</label>
          <select {...register('penalties')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
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
          <FileCheck className="h-5 w-5 mr-2" />
          Compliance Records
        </h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{compliances.length} records</span>
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
          <h4 className="font-semibold text-gray-900 mb-4">Add New Compliance Record</h4>
          {renderForm()}
        </div>
      )}

      {compliances.length === 0 && !showAddForm ? (
        <div className="text-center py-8 text-gray-500">
          <FileCheck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No compliance records found for this FPC</p>
        </div>
      ) : (
        <div className="space-y-4">
          {compliances.map((compliance) => (
            <div key={compliance.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === compliance.id ? (
                renderForm()
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">FY {compliance.fy_year} - {compliance.semiannual.toUpperCase()}</h4>
                    </div>
                    <button
                      onClick={() => handleEdit(compliance)}
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Audit Report</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.audit_report_completion === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.audit_report_completion === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.audit_report_completion}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">DIR-3 KYC</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.dir_3_kyc === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.dir_3_kyc === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.dir_3_kyc}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">AGM</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.agm === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.agm === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.agm}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Form ADT-1</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.form_adt_1 === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.form_adt_1 === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.form_adt_1}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Form AOC-4</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.form_aoc_4 === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.form_aoc_4 === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.form_aoc_4}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">MGT-7</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.mgt_7 === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.mgt_7 === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.mgt_7}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">MGT-14</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.mgt_14 === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.mgt_14 === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.mgt_14}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Penalties</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        compliance.penalties === 'Completed' ? 'bg-green-100 text-green-800' :
                        compliance.penalties === 'In Process' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {compliance.penalties}
                      </span>
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

export default ComplianceEditTab;
