import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, GraduationCap, Calendar, Users, Trash2, Edit2, X, Plus } from 'lucide-react';

const TRAINING_NAMES = [
  "Basic Training of BOD",
  "Basic Training of CEO",
  "RoC compliances",
  "Govt. Linkages and Schemes",
  "Vision building Training",
  "Buyer Cellar Meet",
  "Capacity Building - Mobilisation / FFS",
  "Skill Training",
  "Exposer visits",
  "Gender Training",
  "Water Budgeting Training",
  "Tally Training",
  "FPC Documentation",
  "Producer companies - Concepts and Practices",
  "Entrepreneurial approach",
  "Understanding Markets",
  "Understanding People",
  "Business Proposal and Planning",
  "Climate Resilient Agriculture & Livelihood, capacity building",
  "Import Export",
  "Branding and Packaging",
  "Others"
];

interface TrainingFormData {
  fpo_id: number;
  training_name: string;
  training_date: string;
  fpo_attendees: number;
  board_attendees: number;
  ceo_attendees: number;
  member_attendees: number;
  training_needed_on: string;
}

interface Training extends TrainingFormData {
  id: number;
  fpo_name?: string;
}

const TrainingsPage: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrainingName, setSelectedTrainingName] = useState<string>('');
  const [customTrainingName, setCustomTrainingName] = useState<string>('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TrainingFormData>({
    defaultValues: {
      fpo_attendees: 0,
      board_attendees: 0,
      ceo_attendees: 0,
      member_attendees: 0
    }
  });

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
    if (fpo_id) fetchTrainings();
  }, [fpo_id]);


  const fetchTrainings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/training/fpo/${fpo_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setTrainings(response.data);
    } catch (error: any) {
      console.error('Error fetching trainings:', error);
      // toast.error('Failed to fetch trainings');
    }
  };



  const onSubmit = async (data: TrainingFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const finalTrainingName = selectedTrainingName === 'Others' ? customTrainingName : selectedTrainingName;

      if (!finalTrainingName) {
        toast.error('Please provide a training name');
        setLoading(false);
        return;
      }

      const payload = {
        ...data,
        training_name: finalTrainingName,
        fpo_id,
        fpo_attendees: Number(data.fpo_attendees) || 0,
        board_attendees: Number(data.board_attendees) || 0,
        ceo_attendees: Number(data.ceo_attendees) || 0,
        member_attendees: Number(data.member_attendees) || 0
      };

      if (editingId) {
        await axios.put(`/api/training/${editingId}`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Training updated successfully!');
        setEditingId(null);
      } else {
        await axios.post('/api/training/', payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Training created successfully!');
      }
      reset({
        fpo_attendees: 0,
        board_attendees: 0,
        ceo_attendees: 0,
        member_attendees: 0
      });
      setSelectedTrainingName('');
      setCustomTrainingName('');
      setShowModal(false);
      fetchTrainings();
    } catch (error: any) {
      console.error('Error saving training:', error);
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (training: Training) => {
    setEditingId(training.id);
    reset(training);

    if (TRAINING_NAMES.includes(training.training_name)) {
      setSelectedTrainingName(training.training_name);
      setCustomTrainingName('');
    } else {
      setSelectedTrainingName('Others');
      setCustomTrainingName(training.training_name);
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setSelectedTrainingName('');
    setCustomTrainingName('');
    reset({
      fpo_attendees: 0,
      board_attendees: 0,
      ceo_attendees: 0,
      member_attendees: 0
    });
  };

  const handleTrainingNameChange = (value: string) => {
    setSelectedTrainingName(value);
    if (value !== 'Others') {
      setCustomTrainingName('');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this training record?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/training/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        toast.success('Training deleted successfully!');
        fetchTrainings();
      } catch (error: any) {
        console.error('Error deleting training:', error);
        toast.error('Failed to delete training');
      }
    }
  };

  const getTotalAttendees = (training: Training) => {
    return (training.fpo_attendees || 0) +
           (training.board_attendees || 0) +
           (training.ceo_attendees || 0) +
           (training.member_attendees || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FPC Trainings</h1>
          <p className="text-gray-600">Manage training programs and attendance records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Training</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-100">
              <GraduationCap className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Trainings</p>
              <p className="text-2xl font-bold text-gray-900">{trainings.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Attendees</p>
              <p className="text-2xl font-bold text-gray-900">
                {trainings.reduce((sum, t) => sum + getTotalAttendees(t), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {trainings.filter(t => {
                  if (!t.training_date) return false;
                  const date = new Date(t.training_date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trainings List */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Training Records</h2>
        </div>

        {trainings.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trainings recorded</h3>
            <p className="text-gray-600 mb-4">Start by adding your first training record.</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Training</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Training Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trainings.map((training) => (
                  <tr key={training.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{training.training_name}</div>
                      {training.training_needed_on && (
                        <div className="text-xs text-gray-500 mt-1">
                          Needs: {training.training_needed_on}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {training.training_date ? new Date(training.training_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Users className="h-4 w-4 mr-1 text-primary-600" />
                          Total: {getTotalAttendees(training)}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>FPO: {training.fpo_attendees || 0}</div>
                          <div>Board: {training.board_attendees || 0}</div>
                          <div>CEO: {training.ceo_attendees || 0}</div>
                          <div>Members: {training.member_attendees || 0}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(training)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(training.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Training Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Edit Training' : 'Add New Training'}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* FPO Selection */}
                <div>
                  <label className="form-label">FPO Name *</label>
                  <div>{fpos[0]?.fpo_name || 'N/A'}</div>
                </div>


              {/* Training Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Training Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTrainingName}
                    onChange={(e) => handleTrainingNameChange(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Select Training Name</option>
                    {TRAINING_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Training Date
                  </label>
                  <input
                    type="date"
                    {...register('training_date')}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Custom Training Name Input - shown only when "Others" is selected */}
              {selectedTrainingName === 'Others' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Training Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customTrainingName}
                    onChange={(e) => setCustomTrainingName(e.target.value)}
                    className="form-input"
                    placeholder="Enter custom training name"
                    required
                  />
                </div>
              )}

              {/* Attendees */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Number of Attendees
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">FPO Attendees</label>
                    <input
                      type="number"
                      {...register('fpo_attendees')}
                      className="form-input"
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Board Attendees</label>
                    <input
                      type="number"
                      {...register('board_attendees')}
                      className="form-input"
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">CEO Attendees</label>
                    <input
                      type="number"
                      {...register('ceo_attendees')}
                      className="form-input"
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Member Attendees</label>
                    <input
                      type="number"
                      {...register('member_attendees')}
                      className="form-input"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Training Needed On */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Needed On
                </label>
                <textarea
                  {...register('training_needed_on')}
                  className="form-input"
                  rows={3}
                  placeholder="Describe additional training needs or topics..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : editingId ? 'Update Training' : 'Save Training'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingsPage;
