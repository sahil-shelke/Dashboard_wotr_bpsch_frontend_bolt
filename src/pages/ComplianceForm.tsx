
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, CheckSquare, Plus, Eye, FileText, Image as ImageIcon, X } from 'lucide-react';

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

const ComplianceForm: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [compliances, setCompliances] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string; type: string } | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ComplianceFormData>();

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
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Prepare compliance status object
      const complianceStatus = {
        fpo_id: fpo_id,
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

      if (editingId) {
        await axios.put(`/api/fpc_compliance/${editingId}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Compliance details updated successfully!');
        setEditingId(null);
      } else {
        await axios.post('/api/fpc_compliance/', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
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
        <label className="form-label">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type="file"
          {...register(fieldName as any, {
            required: isRequired ? `Document required when status is Completed` : false
          })}
          className="form-input"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        {file && (
          <div className="mt-2 flex items-center justify-between p-2 bg-green-50 border border-green-300 rounded">
            <div className="flex items-center space-x-2">
              {getFileIcon(file)}
              <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
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
          <p className="text-red-500 text-sm">{(errors[fieldName] as any)?.message}</p>
        )}
      </div>
    );
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
                <div>
                  <label className="form-label">Audit Report Completion *</label>
                  <select {...register('audit_report_completion', { required: 'Status is required' })} className="form-input">
                    <option value="">Select Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.audit_report_completion && <p className="text-red-500 text-sm">{errors.audit_report_completion.message}</p>}
                </div>

                {renderDocumentField('audit_report_document', 'Audit Report Document', watchedStatuses.audit_report_completion === 'Completed')}

                <div>
                  <label className="form-label">DIR-3 KYC *</label>
                  <select {...register('dir_3_kyc', { required: 'Status is required' })} className="form-input">
                    <option value="">Select Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.dir_3_kyc && <p className="text-red-500 text-sm">{errors.dir_3_kyc.message}</p>}
                </div>

                {renderDocumentField('dir_3_kyc_document', 'DIR-3 KYC Document', watchedStatuses.dir_3_kyc === 'Completed')}

                <div>
                  <label className="form-label">AGM *</label>
                  <select {...register('agm', { required: 'Status is required' })} className="form-input">
                    <option value="">Select Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.agm && <p className="text-red-500 text-sm">{errors.agm.message}</p>}
                </div>

                {renderDocumentField('agm_document', 'AGM Document', watchedStatuses.agm === 'Completed')}

                <div>
                  <label className="form-label">Form ADT-1 *</label>
                  <select {...register('form_adt_1', { required: 'Status is required' })} className="form-input">
                    <option value="">Select Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.form_adt_1 && <p className="text-red-500 text-sm">{errors.form_adt_1.message}</p>}
                </div>

                {renderDocumentField('form_adt_1_document', 'Form ADT-1 Document', watchedStatuses.form_adt_1 === 'Completed')}

                <div>
                  <label className="form-label">Form AOC-4 *</label>
                  <select {...register('form_aoc_4', { required: 'Status is required' })} className="form-input">
                    <option value="">Select Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.form_aoc_4 && <p className="text-red-500 text-sm">{errors.form_aoc_4.message}</p>}
                </div>

                {renderDocumentField('form_aoc_4_document', 'Form AOC-4 Document', watchedStatuses.form_aoc_4 === 'Completed')}

                <div>
                  <label className="form-label">MGT-7 *</label>
                  <select {...register('mgt_7', { required: 'Status is required' })} className="form-input">
                    <option value="">Select Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.mgt_7 && <p className="text-red-500 text-sm">{errors.mgt_7.message}</p>}
                </div>

                {renderDocumentField('mgt_7_document', 'MGT-7 Document', watchedStatuses.mgt_7 === 'Completed')}

                <div>
                  <label className="form-label">MGT-14 *</label>
                  <select {...register('mgt_14', { required: 'Status is required' })} className="form-input">
                    <option value="">Select Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.mgt_14 && <p className="text-red-500 text-sm">{errors.mgt_14.message}</p>}
                </div>

                {renderDocumentField('mgt_14_document', 'MGT-14 Document', watchedStatuses.mgt_14 === 'Completed')}
              </div>

              {/* Penalties Field */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="form-label">Penalties (Optional)</label>
                  <textarea
                    {...register('penalties')}
                    className="form-input"
                    placeholder="Enter any penalties or notes..."
                    rows={3}
                  />
                </div>
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

export default ComplianceForm;
