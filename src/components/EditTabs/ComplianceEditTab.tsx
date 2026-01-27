import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileCheck, Edit, Save, X, Plus, Eye, FileText, Image as ImageIcon } from 'lucide-react';

interface ComplianceFormData {
  fpo_id: number;
  audit_report_completion: 'In Process' | 'Completed' | 'Not Started';
  dir_3_kyc: 'In Process' | 'Completed' | 'Not Started';
  agm: 'In Process' | 'Completed' | 'Not Started';
  form_adt_1: 'In Process' | 'Completed' | 'Not Started';
  form_aoc_4: 'In Process' | 'Completed' | 'Not Started';
  mgt_7: 'In Process' | 'Completed' | 'Not Started';
  mgt_14: 'In Process' | 'Completed' | 'Not Started';
  penalties?: string;
  semiannual: 'h1' | 'h2';
  fy_year: string;
  audit_report_document?: FileList;
  dir_3_kyc_document?: FileList;
  agm_document?: FileList;
  form_adt_1_document?: FileList;
  form_aoc_4_document?: FileList;
  mgt_7_document?: FileList;
  mgt_14_document?: FileList;
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
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string; type: string } | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, dirtyFields } } = useForm<ComplianceFormData>({
    defaultValues: {
      fpo_id: fpoId,
      audit_report_completion: 'Not Started',
      dir_3_kyc: 'Not Started',
      agm: 'Not Started',
      form_adt_1: 'Not Started',
      form_aoc_4: 'Not Started',
      mgt_7: 'Not Started',
      mgt_14: 'Not Started',
      penalties: '',
      semiannual: 'h1'
    }
  });

  const watchedStatuses = {
    audit_report_completion: watch('audit_report_completion'),
    dir_3_kyc: watch('dir_3_kyc'),
    agm: watch('agm'),
    form_adt_1: watch('form_adt_1'),
    form_aoc_4: watch('form_aoc_4'),
    mgt_7: watch('mgt_7'),
    mgt_14: watch('mgt_14')
  };

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

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <ImageIcon className="h-5 w-5 text-blue-600" />;
  };

  const openPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type;
    setPreviewFile({ file, url, type });
  };

  const closePreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const renderDocumentField = (
    fieldName: keyof ComplianceFormData,
    label: string,
    isRequired: boolean
  ) => {
    const file = watch(fieldName as any)?.[0];
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type="file"
          {...register(fieldName as any, {
            required: isRequired ? `Document required when status is Completed` : false
          })}
          className="form-input w-full"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        {file && (
          <div className="mt-2 flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded">
            <div className="flex items-center space-x-2">
              {getFileIcon(file)}
              <span className="text-sm text-gray-700">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={() => openPreview(file)}
              className="p-1 hover:bg-green-100 rounded-full transition-colors"
              title="Preview document"
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        )}
        {errors[fieldName] && (
          <p className="text-xs text-red-600 mt-1">{(errors[fieldName] as any)?.message}</p>
        )}
      </div>
    );
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
      penalties: '',
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
      penalties: '',
      semiannual: 'h1',
      fy_year: ''
    });
  };

  const onSubmit = async (data: ComplianceFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();

      // Prepare compliance status object
      const complianceStatus = {
        audit_report_completion: data.audit_report_completion,
        dir_3_kyc: data.dir_3_kyc,
        agm: data.agm,
        form_adt_1: data.form_adt_1,
        form_aoc_4: data.form_aoc_4,
        mgt_7: data.mgt_7,
        mgt_14: data.mgt_14,
        fy_year: data.fy_year,
        semiannual: data.semiannual,
        penalties: data.penalties || ''
      };

      formData.append('compliance', JSON.stringify(complianceStatus));

      // Add document files if provided
      if (data.audit_report_document?.[0]) {
        formData.append('audit_report_document', data.audit_report_document[0]);
      }
      if (data.dir_3_kyc_document?.[0]) {
        formData.append('dir_3_kyc_document', data.dir_3_kyc_document[0]);
      }
      if (data.agm_document?.[0]) {
        formData.append('agm_document', data.agm_document[0]);
      }
      if (data.form_adt_1_document?.[0]) {
        formData.append('form_adt_1_document', data.form_adt_1_document[0]);
      }
      if (data.form_aoc_4_document?.[0]) {
        formData.append('form_aoc_4_document', data.form_aoc_4_document[0]);
      }
      if (data.mgt_7_document?.[0]) {
        formData.append('mgt_7_document', data.mgt_7_document[0]);
      }
      if (data.mgt_14_document?.[0]) {
        formData.append('mgt_14_document', data.mgt_14_document[0]);
      }

      if (showAddForm) {
        await axios.post(
          '/api/fpc_compliance/',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        toast.success('Compliance record created successfully!');
      } else if (editingId) {
        await axios.put(
          `/api/fpc_compliance/${editingId}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
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

        {renderDocumentField('audit_report_document', 'Audit Report Document', watchedStatuses.audit_report_completion === 'Completed')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">DIR-3 KYC</label>
          <select {...register('dir_3_kyc')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {renderDocumentField('dir_3_kyc_document', 'DIR-3 KYC Document', watchedStatuses.dir_3_kyc === 'Completed')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AGM</label>
          <select {...register('agm')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {renderDocumentField('agm_document', 'AGM Document', watchedStatuses.agm === 'Completed')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form ADT-1</label>
          <select {...register('form_adt_1')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {renderDocumentField('form_adt_1_document', 'Form ADT-1 Document', watchedStatuses.form_adt_1 === 'Completed')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Form AOC-4</label>
          <select {...register('form_aoc_4')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {renderDocumentField('form_aoc_4_document', 'Form AOC-4 Document', watchedStatuses.form_aoc_4 === 'Completed')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MGT-7</label>
          <select {...register('mgt_7')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {renderDocumentField('mgt_7_document', 'MGT-7 Document', watchedStatuses.mgt_7 === 'Completed')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MGT-14</label>
          <select {...register('mgt_14')} className="form-input w-full">
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {renderDocumentField('mgt_14_document', 'MGT-14 Document', watchedStatuses.mgt_14 === 'Completed')}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Penalties (Optional)</label>
          <textarea
            {...register('penalties')}
            className="form-input w-full"
            placeholder="Enter any penalties or notes..."
            rows={3}
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

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closePreview}>
          <div className="relative max-w-5xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  {getFileIcon(previewFile.file)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
                    <p className="text-sm text-gray-600">{previewFile.file.name}</p>
                  </div>
                </div>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  title="Close preview"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              <div className="overflow-auto max-h-[calc(90vh-80px)] bg-gray-100 flex items-center justify-center p-4">
                {previewFile.type === 'application/pdf' ? (
                  <iframe
                    src={previewFile.url}
                    className="w-full h-[calc(90vh-120px)] bg-white rounded"
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={previewFile.url}
                    alt="Document preview"
                    className="max-w-full max-h-full object-contain rounded"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceEditTab;
