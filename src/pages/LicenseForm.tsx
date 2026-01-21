
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, FileText, Plus, Upload, X, Eye } from 'lucide-react';

interface LicenseFormData {
  fpo_id: number;
  category: 'seed' | 'fertilizer' | 'pesticide' | 'food' | 'apmc_mandi' | 'direct_marketing' | 'organic' | 'udyam' | 'drone' | 'pollution' | 'shop_act' | 'brand' | 'other';
  other_category_name?: string;
  license_number: string;
  license_date?: string;
  license_expiry?: string;
}

const LicenseForm: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LicenseFormData>();
  const selectedCategory = watch('category');

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
    if (fpo_id) fetchLicenses();
  }, [fpo_id]);


  const fetchLicenses = async () => {
    try {
      const response = await axios.get(`/api/licenses/${fpo_id}`);
      setLicenses(response.data);
    } catch (error) {
      // toast.error('Failed to fetch licenses');
    }
  };



  const onSubmit = async (data: LicenseFormData) => {
    setLoading(true);
    try {
      const processedData = {
        ...data,
        license_date: data.license_date || null,
        license_expiry: data.license_expiry || null,
        other_category_name: data.category === 'other' ? data.other_category_name : null
      };
      console.log('Updated License ID:', editingId);

      if (editingId) {
        const formData = new FormData();
        formData.append('license_details', JSON.stringify(processedData));
        if (licenseFile) {
          formData.append('license_document', licenseFile);
        }
        await axios.put(`/api/licenses/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('License updated successfully!');
        setEditingId(null);
      } else {
        const formData = new FormData();
        const payload = {
          ...processedData,
          fpo_id
        };
        formData.append('license_details', JSON.stringify(payload));
        if (licenseFile) {
          formData.append('license_document', licenseFile);
        }
        await axios.post('/api/licenses/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('License created successfully!');
      }
      reset();
      setLicenseFile(null);
      setIsModalOpen(false);
      fetchLicenses();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (license: any) => {
    setEditingId(license.id);
    reset({
      ...license,
      license_date: license.license_date?.split('T')[0] || '',
      license_expiry: license.license_expiry?.split('T')[0] || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this license?')) {
      try {
        await axios.delete(`/api/licenses/${id}`);
        toast.success('License deleted successfully!');
        fetchLicenses();
      } catch (error) {
        toast.error('Failed to delete license');
      }
    }
  };

  const licenseCategories = [
    { value: 'seed', label: 'Seed License' },
    { value: 'fertilizer', label: 'Fertilizer License' },
    { value: 'pesticide', label: 'Pesticide License' },
    { value: 'food', label: 'Food License' },
    { value: 'apmc_mandi', label: 'APMC Mandi License' },
    { value: 'direct_marketing', label: 'Direct Marketing License' },
    { value: 'organic', label: 'Organic License' },
    { value: 'udyam', label: 'Udyam License' },
    { value: 'drone', label: 'Drone License' },
    { value: 'pollution', label: 'Pollution License' },
    { value: 'shop_act', label: 'Shop Act License' },
    { value: 'brand', label: 'Brand License' },
    { value: 'other', label: 'Other License' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
        </div>
        <button
          onClick={() => { setIsModalOpen(true); reset(); setEditingId(null); }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New License</span>
        </button>
      </div>

      {/* License List */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Licenses</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium">License Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenses.map((license) => (
                <tr key={license.id}>
                  <td className="px-6 py-4">
                    {license.category === 'other'
                      ? license.other_category_name
                      : licenseCategories.find(cat => cat.value === license.category)?.label || license.category}
                  </td>
                  <td className="px-6 py-4">{license.license_number}</td>
                  <td className="px-6 py-4">{license.license_date ? new Date(license.license_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4">{license.license_expiry ? new Date(license.license_expiry).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(license)} className="text-primary-600 hover:text-primary-900">Edit</button>
                    <button onClick={() => handleDelete(license.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Edit License' : 'Add New License'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>





            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* <div>
                  <label className="form-label">FPO *</label>
                  <select {...register('fpo_id', { required: 'FPO selection is required' })} className="form-input">
                    <option value="">Select FPO</option>
                    {fpos.map((fpo) => (
                      <option key={fpo.fpo_id} value={fpo.fpo_id}>{fpo.fpo_name}</option>
                    ))}
                  </select>
                  {errors.fpo_id && <p className="text-red-500 text-sm">{errors.fpo_id.message}</p>}
                </div> */}




                <div>
                  <label className="form-label">FPO Name *</label>
                  <div>{fpos[0]?.fpo_name || 'N/A'}</div>
                </div>


                <div>
                  <label className="form-label">License Category *</label>
                  <select {...register('category', { required: 'License category is required' })} className="form-input">
                    <option value="">Select Category</option>
                    {licenseCategories.map((category) => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                </div>

                {selectedCategory === 'other' && (
                  <div className="md:col-span-2">
                    <label className="form-label">Other Category Name *</label>
                    <input {...register('other_category_name', { required: 'Other category name is required' })} className="form-input" placeholder="Enter category" />
                    {errors.other_category_name && <p className="text-red-500 text-sm">{errors.other_category_name.message}</p>}
                  </div>
                )}

                <div>
                  <label className="form-label">License Number *</label>
                  <input {...register('license_number', { required: 'License number is required' })} className="form-input" placeholder="Enter license number" />
                  {errors.license_number && <p className="text-red-500 text-sm">{errors.license_number.message}</p>}
                </div>

                <div>
                  <label className="form-label">License Date</label>
                  <input type="date" {...register('license_date')} className="form-input" />
                </div>

                <div>
                  <label className="form-label">License Expiry</label>
                  <input type="date" {...register('license_expiry')} className="form-input" />
                </div>
              </div>

              <div>
                <label className="form-label">License Document (Image/PDF)</label>
                <div className="mt-1">
                  <input
                    id="license-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('File size must be less than 5MB');
                          e.target.value = '';
                          return;
                        }
                        setLicenseFile(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="license-upload"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {licenseFile ? 'Change Document' : 'Upload License Document'}
                    </span>
                  </label>
                  {licenseFile && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{licenseFile.name}</p>
                          <span className="text-xs text-gray-500">({(licenseFile.size / 1024).toFixed(2)} KB)</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const url = URL.createObjectURL(licenseFile);
                            window.open(url, '_blank');
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Preview document"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLicenseFile(null);
                            const input = document.getElementById('license-upload') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Remove document"
                        >
                          <X className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => { reset(); setIsModalOpen(false); setEditingId(null); setLicenseFile(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingId ? 'Update License' : 'Create License'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseForm;