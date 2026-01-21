import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, Edit, Save, X, Plus } from 'lucide-react';

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

interface TrainingEditTabProps {
  fpoId: number;
}

const TrainingEditTab: React.FC<TrainingEditTabProps> = ({ fpoId }) => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalData, setOriginalData] = useState<Training | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, dirtyFields } } = useForm<TrainingFormData>({
    defaultValues: {
      fpo_id: fpoId,
      training_name: TRAINING_NAMES[0],
      fpo_attendees: 0,
      board_attendees: 0,
      ceo_attendees: 0,
      member_attendees: 0
    }
  });

  useEffect(() => {
    fetchTrainings();
  }, [fpoId]);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/training/fpo/${fpoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTrainings(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch trainings');
      }
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (training: Training) => {
    setEditingId(training.id);
    setOriginalData(training);
    reset({
      ...training,
      training_date: training.training_date?.split('T')[0] || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(false);
    reset({
      fpo_id: fpoId,
      training_name: TRAINING_NAMES[0],
      training_date: '',
      fpo_attendees: 0,
      board_attendees: 0,
      ceo_attendees: 0,
      member_attendees: 0,
      training_needed_on: ''
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(true);
    reset({
      fpo_id: fpoId,
      training_name: TRAINING_NAMES[0],
      training_date: '',
      fpo_attendees: 0,
      board_attendees: 0,
      ceo_attendees: 0,
      member_attendees: 0,
      training_needed_on: ''
    });
  };

  const onSubmit = async (data: TrainingFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      data.fpo_id = fpoId;

      if (showAddForm) {
        await axios.post(
          '/api/training/',
          data,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Training record created successfully!');
      } else if (editingId) {
        const changedFields: Partial<TrainingFormData> = {};

        (Object.keys(dirtyFields) as Array<keyof TrainingFormData>).forEach((key) => {
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
          `/api/training/${editingId}`,
          changedFields,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Training record updated successfully!');
      }

      handleCancelEdit();
      fetchTrainings();
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
        <p className="ml-3 text-gray-600">Loading trainings...</p>
      </div>
    );
  }

  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Training Name <span className="text-red-500">*</span>
          </label>
          <select {...register('training_name', { required: true })} className="form-input w-full">
            {TRAINING_NAMES.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Training Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('training_date', { required: 'Training date is required' })}
            className="form-input w-full"
          />
          {errors.training_date && (
            <p className="text-xs text-red-600 mt-1">{errors.training_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">FPO Attendees</label>
          <input
            type="number"
            {...register('fpo_attendees', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Board Attendees</label>
          <input
            type="number"
            {...register('board_attendees', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEO Attendees</label>
          <input
            type="number"
            {...register('ceo_attendees', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Member Attendees</label>
          <input
            type="number"
            {...register('member_attendees', { valueAsNumber: true })}
            className="form-input w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Training Needed On</label>
          <textarea
            {...register('training_needed_on')}
            className="form-input w-full"
            rows={3}
            placeholder="Describe training needs..."
          />
        </div>
      </div>

      <div className="flex space-x-2 pt-4 border-t">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? (showAddForm ? 'Creating...' : 'Saving...') : (showAddForm ? 'Create Training' : 'Save Changes')}
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
          <BookOpen className="h-5 w-5 mr-2" />
          Trainings
        </h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{trainings.length} trainings</span>
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
          <h4 className="font-semibold text-gray-900 mb-4">Add New Training</h4>
          {renderForm()}
        </div>
      )}

      {trainings.length === 0 && !showAddForm ? (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No training records found for this FPC</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trainings.map((training) => (
            <div key={training.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === training.id ? (
                renderForm()
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{training.training_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(training.training_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEdit(training)}
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">FPO Attendees</p>
                      <p className="font-medium text-gray-900">{training.fpo_attendees}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Board Attendees</p>
                      <p className="font-medium text-gray-900">{training.board_attendees}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">CEO Attendees</p>
                      <p className="font-medium text-gray-900">{training.ceo_attendees}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Member Attendees</p>
                      <p className="font-medium text-gray-900">{training.member_attendees}</p>
                    </div>
                  </div>

                  {training.training_needed_on && (
                    <div className="text-sm">
                      <p className="text-gray-500 mb-1">Training Needed On:</p>
                      <p className="text-gray-900 bg-gray-50 p-2 rounded">{training.training_needed_on}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainingEditTab;
