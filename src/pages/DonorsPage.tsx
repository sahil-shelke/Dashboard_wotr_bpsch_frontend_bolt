import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Heart, Trash2, Edit2, X, Plus, Building2 } from 'lucide-react';

const DONOR_TYPES = [
  "Government",
  "Private Foundation",
  "Corporate",
  "International Organization",
  "NGO",
  "Individual",
  "Others"
];

interface DonorItem {
  fpo_id?: number;
  donor_type: string;
  donor_name: string;
}

interface Donor extends DonorItem {
  id: number;
  fpo_name?: string;
}

const DonorsPage: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DonorItem>();

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

  // ✅ Fetch donors when fpo_id changes
  useEffect(() => {
    if (fpo_id) fetchDonors();
  }, [fpo_id]);

  const fetchDonors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/donor/${fpo_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const donorsData = Array.isArray(response.data) ? response.data : [];
      setDonors(donorsData);
    } catch (error) {
      // toast.error('Failed to fetch donors');
      setDonors([]);
    }
  };

  const onSubmit = async (data: DonorItem) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        fpo_id: Number(data.fpo_id),
        donor_type: data.donor_type,
        donor_name: data.donor_name
      };

      if (editingDonor) {
        await axios.put(`/api/donor/${editingDonor.id}`, payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Donor updated successfully!');
      } else {
        const payload = {
          ...data,
          fpo_id
        }
        await axios.post('/api/donor/', payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Donor added successfully!');
      }

      reset();
      setEditingDonor(null);
      setShowModal(false);
      fetchDonors();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (donor: Donor) => {
    setEditingDonor(donor);
    setShowModal(true);
    setValue('fpo_id', donor.fpo_id || 0);
    setValue('donor_type', donor.donor_type);
    setValue('donor_name', donor.donor_name);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this donor record?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/donor/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Donor deleted successfully!');
        fetchDonors();
      } catch {
        // toast.error('Failed to delete donor');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDonor(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FPC Donors</h1>
          <p className="text-gray-600">Manage donor information and funding sources</p>
        </div>
        <button
          onClick={() => { reset(); setShowModal(true); }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Donor</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center">
          <Heart className="h-6 w-6 text-primary-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Donors</p>
            <p className="text-2xl font-bold text-gray-900">{donors.length}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-600">FPCs with Donors</p>
            <p className="text-2xl font-bold text-gray-900">{new Set(donors.map(d => d.fpo_id)).size}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center">
          <Heart className="h-6 w-6 text-green-600" />
          <div className="ml-4">
            <p className="text-sm text-gray-600">Government Donors</p>
            <p className="text-2xl font-bold text-gray-900">
              {donors.filter(d => d.donor_type === 'Government').length}
            </p>
          </div>
        </div>
      </div>

      {/* Donor Table */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Donor Records</h2>
        </div>

        {donors.length === 0 ? (
          <div className="p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No donors recorded</h3>
            <p className="text-gray-600 mb-4">Start by adding your first donor record.</p>
            <button
              onClick={() => { reset(); setShowModal(true); }}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Donor</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donors.map((donor) => {
                  const fpoName = fpos.find(f => f.fpo_id === donor.fpo_id)?.fpo_name || 'N/A';
                  return (
                    <tr key={donor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{donor.donor_name}</td>
                      <td className="px-6 py-4">{donor.donor_type}</td>
                      <td className="px-6 py-4 flex space-x-2">
                        <button onClick={() => handleEdit(donor)} className="text-primary-600 hover:text-primary-900">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(donor.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Donor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {editingDonor ? 'Edit Donor' : 'Add Donor'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                 <div>
                  <label className="form-label">FPO Name *</label>
                  <div>{fpos[0]?.fpo_name || 'N/A'}</div>
                </div>


              <div>
                <label className="block text-sm mb-2">Donor Type</label>
                <select {...register('donor_type', { required: 'Donor type is required' })} className="form-input">
                  <option value="">Select Donor Type</option>
                  {DONOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                {errors.donor_type && <p className="text-sm text-red-600">{errors.donor_type.message}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2">Donor Name</label>
                <input
                  type="text"
                  {...register('donor_name', { required: 'Donor name is required' })}
                  className="form-input"
                  placeholder="Enter donor name"
                />
                {errors.donor_name && <p className="text-sm text-red-600">{errors.donor_name.message}</p>}
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingDonor ? 'Update' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorsPage;
