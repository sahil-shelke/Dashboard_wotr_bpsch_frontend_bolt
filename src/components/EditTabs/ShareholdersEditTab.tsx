import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Edit, Save, X, Plus } from 'lucide-react';

interface ShareholderFormData {
  fpo_id: number;
  member_name: string;
  member_phone_number?: string;
  gender: 'm' | 'f';
  date_of_birth: string;
  date_of_share_taken: string;
  sharemoney_deposited_by_member?: number;
  number_of_share_alloted_amount?: number;
  folio_share_distinctive_no?: string;
  status_of_member?: string;
  land_holding_of_shares_in_acres?: number;
  share_transfer?: string;
  position_of_member?: 'Director' | 'Promoter' | 'Member';
  is_scst?: boolean;
  education_qualification?: 'illiterate' | 'secondary' | 'higher secondary' | 'diploma' | 'graduate' | 'postgraduate' | 'others';
  din?: number;
  date_of_joining?: string;
}

interface Shareholder extends ShareholderFormData {
  id: number;
}

interface ShareholdersEditTabProps {
  fpoId: number;
}

const ShareholdersEditTab: React.FC<ShareholdersEditTabProps> = ({ fpoId }) => {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalData, setOriginalData] = useState<Shareholder | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, dirtyFields } } = useForm<ShareholderFormData>({
    defaultValues: {
      fpo_id: fpoId,
      gender: 'm',
      position_of_member: 'Member'
    }
  });
  const selectedPosition = watch('position_of_member');

  useEffect(() => {
    fetchShareholders();
  }, [fpoId]);

  const fetchShareholders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/shareholder/${fpoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShareholders(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch shareholders');
      }
      setShareholders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shareholder: Shareholder) => {
    setEditingId(shareholder.id);
    setOriginalData(shareholder);
    reset({
      ...shareholder,
      date_of_birth: shareholder.date_of_birth?.split('T')[0] || '',
      date_of_share_taken: shareholder.date_of_share_taken?.split('T')[0] || '',
      date_of_joining: shareholder.date_of_joining?.split('T')[0] || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(false);
    reset({
      fpo_id: fpoId,
      gender: 'm',
      position_of_member: 'Member'
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setOriginalData(null);
    setShowAddForm(true);
    reset({
      fpo_id: fpoId,
      gender: 'm',
      position_of_member: 'Member',
      member_name: '',
      date_of_birth: '',
      date_of_share_taken: ''
    });
  };

  const onSubmit = async (data: ShareholderFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      data.fpo_id = fpoId;

      if (showAddForm) {
        // Create new shareholder
        await axios.post(
          '/api/shareholder/',
          data,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Shareholder created successfully!');
      } else if (editingId) {
        // Update existing shareholder
        const changedFields: Partial<ShareholderFormData> = {};

        (Object.keys(dirtyFields) as Array<keyof ShareholderFormData>).forEach((key) => {
          if (dirtyFields[key]) {
            changedFields[key] = data[key] as any;
          }
        });

        changedFields.fpo_id = fpoId;
        changedFields.position_of_member = data.position_of_member;

        // If no other changes except these defaults, still proceed
        if (Object.keys(changedFields).length <= 2) {
          toast('No other changes, but default fields sent');
        }

        await axios.put(
          `/api/shareholder/${editingId}`,
          changedFields,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Shareholder updated successfully!');
      }

      handleCancelEdit();
      fetchShareholders();
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
        <p className="ml-3 text-gray-600">Loading shareholders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Shareholders
        </h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{shareholders.length} members</span>
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
          <h4 className="font-semibold text-gray-900 mb-4">Add New Shareholder</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('member_name', { required: 'Name is required' })}
                  className="form-input w-full"
                />
                {errors.member_name && (
                  <p className="text-xs text-red-600 mt-1">{errors.member_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('member_phone_number', {
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit phone number'
                    }
                  })}
                  placeholder="10-digit number"
                  className="form-input w-full"
                />
                {errors.member_phone_number && (
                  <p className="text-xs text-red-600 mt-1">{errors.member_phone_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select {...register('gender', { required: true })} className="form-input w-full">
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" {...register('date_of_birth')} className="form-input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Share Taken</label>
                <input type="date" {...register('date_of_share_taken')} className="form-input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <select {...register('position_of_member', { required: true })} className="form-input w-full">
                  <option value="Director">Director</option>
                  <option value="Promoter">Promoter</option>
                  <option value="Member">Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share Money Deposited</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('sharemoney_deposited_by_member')}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Shares Allotted</label>
                <input
                  type="number"
                  {...register('number_of_share_alloted_amount')}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Folio/Distinctive No</label>
                <input {...register('folio_share_distinctive_no')} className="form-input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status of Member</label>
                <input {...register('status_of_member')} className="form-input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Land Holding (acres)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('land_holding_of_shares_in_acres')}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Share Transfer</label>
                <input {...register('share_transfer')} className="form-input w-full" />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" {...register('is_scst')} className="form-checkbox" />
                  <span className="text-sm font-medium text-gray-700">SC/ST</span>
                </label>
              </div>

              {selectedPosition === 'Director' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Qualification</label>
                    <select {...register('education_qualification')} className="form-input w-full">
                      <option value="">Select...</option>
                      <option value="illiterate">Illiterate</option>
                      <option value="secondary">Secondary</option>
                      <option value="higher secondary">Higher Secondary</option>
                      <option value="diploma">Diploma</option>
                      <option value="graduate">Graduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DIN</label>
                    <input type="number" {...register('din')} className="form-input w-full" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                    <input type="date" {...register('date_of_joining')} className="form-input w-full" />
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Shareholder'}
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
        </div>
      )}

      {shareholders.length === 0 && !showAddForm ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No shareholders found for this FPC</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shareholders.map((shareholder) => (
            <div key={shareholder.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === shareholder.id ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Member Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('member_name', { required: 'Name is required' })}
                        className="form-input w-full"
                      />
                      {errors.member_name && (
                        <p className="text-xs text-red-600 mt-1">{errors.member_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        {...register('member_phone_number', {
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Please enter a valid 10-digit phone number'
                          }
                        })}
                        placeholder="10-digit number"
                        className="form-input w-full"
                      />
                      {errors.member_phone_number && (
                        <p className="text-xs text-red-600 mt-1">{errors.member_phone_number.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select {...register('gender', { required: true })} className="form-input w-full">
                        <option value="m">Male</option>
                        <option value="f">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" {...register('date_of_birth')} className="form-input w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Share Taken</label>
                      <input type="date" {...register('date_of_share_taken')} className="form-input w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position <span className="text-red-500">*</span>
                      </label>
                      <select {...register('position_of_member', { required: true })} className="form-input w-full">
                        <option value="Director">Director</option>
                        <option value="Promoter">Promoter</option>
                        <option value="Member">Member</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Share Money Deposited</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('sharemoney_deposited_by_member')}
                        className="form-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Shares Allotted</label>
                      <input
                        type="number"
                        {...register('number_of_share_alloted_amount')}
                        className="form-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Folio/Distinctive No</label>
                      <input {...register('folio_share_distinctive_no')} className="form-input w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status of Member</label>
                      <input {...register('status_of_member')} className="form-input w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Land Holding (acres)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('land_holding_of_shares_in_acres')}
                        className="form-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Share Transfer</label>
                      <input {...register('share_transfer')} className="form-input w-full" />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" {...register('is_scst')} className="form-checkbox" />
                        <span className="text-sm font-medium text-gray-700">SC/ST</span>
                      </label>
                    </div>

                    {selectedPosition === 'Director' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Education Qualification</label>
                          <select {...register('education_qualification')} className="form-input w-full">
                            <option value="">Select...</option>
                            <option value="illiterate">Illiterate</option>
                            <option value="secondary">Secondary</option>
                            <option value="higher secondary">Higher Secondary</option>
                            <option value="diploma">Diploma</option>
                            <option value="graduate">Graduate</option>
                            <option value="postgraduate">Postgraduate</option>
                            <option value="others">Others</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">DIN</label>
                          <input type="number" {...register('din')} className="form-input w-full" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                          <input type="date" {...register('date_of_joining')} className="form-input w-full" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-4 border-t">
                    <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
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
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{shareholder.member_name}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {shareholder.position_of_member}
                        </span>
                        <span className="text-sm text-gray-600">
                          {shareholder.gender === 'm' ? 'Male' : 'Female'}
                        </span>
                        {shareholder.is_scst && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            SC/ST
                          </span>
                        )}
                      </div>
                      {shareholder.member_phone_number && (
                        <p className="text-sm text-gray-600 mt-1">📞 {shareholder.member_phone_number}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleEdit(shareholder)}
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">
                        {shareholder.date_of_birth
                          ? new Date(shareholder.date_of_birth).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Share Money Deposited</p>
                      <p className="font-medium text-gray-900">
                        ₹{shareholder.sharemoney_deposited_by_member?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Shares Allotted</p>
                      <p className="font-medium text-gray-900">
                        {shareholder.number_of_share_alloted_amount || 0}
                      </p>
                    </div>
                    {shareholder.land_holding_of_shares_in_acres && (
                      <div>
                        <p className="text-gray-500">Land Holding</p>
                        <p className="font-medium text-gray-900">
                          {shareholder.land_holding_of_shares_in_acres} acres
                        </p>
                      </div>
                    )}
                    {shareholder.status_of_member && (
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium text-gray-900">{shareholder.status_of_member}</p>
                      </div>
                    )}
                    {shareholder.education_qualification && (
                      <div>
                        <p className="text-gray-500">Education</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {shareholder.education_qualification}
                        </p>
                      </div>
                    )}
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

export default ShareholdersEditTab;