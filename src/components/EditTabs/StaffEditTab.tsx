import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserPlus, Edit, Save, X, Plus } from 'lucide-react';

interface StaffFormData {
  phone_number: string;
  name: string;
  gender: 'm' | 'f';
  education_qualification: 'illiterate' | 'secondary' | 'higher secondary' | 'diploma' | 'graduate' | 'postgraduate' | 'others';
  degree_title?: string;
  date_of_joining: string;
  designation: 'ceo' | 'chairperson' | 'manager' | 'staff' | 'other';
  din?: string;
  fpo_id: number;
}

interface Staff extends StaffFormData {
  id?: number;
}

interface StaffEditTabProps {
  fpoId: number;
}

const StaffEditTab: React.FC<StaffEditTabProps> = ({ fpoId }) => {
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<Staff | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, dirtyFields } } = useForm<StaffFormData>({
    defaultValues: {
      fpo_id: fpoId,
      name: '',
      gender: 'm',
      designation: 'staff',
      education_qualification: 'secondary'
    }
  });

  useEffect(() => {
    fetchStaff();
  }, [fpoId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/staff/${fpoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStaffMembers(response.data || []);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch staff members');
      }
      setStaffMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingPhone(staff.phone_number);
    setOriginalData(staff);
    reset({
      ...staff,
      date_of_joining: staff.date_of_joining?.split('T')[0] || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingPhone(null);
    setOriginalData(null);
    setShowAddForm(false);
    reset({
      fpo_id: fpoId,
      gender: 'm',
      designation: 'staff',
      education_qualification: 'secondary'
    });
  };

  const handleAddNew = () => {
    setEditingPhone(null);
    setOriginalData(null);
    setShowAddForm(true);
    reset({
      fpo_id: fpoId,
      gender: 'm',
      designation: 'staff',
      education_qualification: 'secondary',
      phone_number: '',
      name: '',
      date_of_joining: ''
    });
  };

  const onSubmit = async (data: StaffFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      data.fpo_id = fpoId;

      if (showAddForm) {
        // Create new staff member
        await axios.post(
          '/api/staff/',
          data,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Staff member created successfully!');
      } else if (editingPhone) {
        // Update existing staff member
        const changedFields: Partial<StaffFormData> = {};

        (Object.keys(dirtyFields) as Array<keyof StaffFormData>).forEach((key) => {
          if (dirtyFields[key]) {
            changedFields[key] = data[key] as any;
          }
        });

// Always include fpo_id and phone_number
changedFields.fpo_id = fpoId;
changedFields.phone_number = data.phone_number;

// If no other changes except these defaults, still proceed
if (Object.keys(changedFields).length <= 2) {
  toast('No other changes, but default fields sent');
}


        await axios.put(
          `/api/staff/${editingPhone}`,
          changedFields,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        toast.success('Staff member updated successfully!');
      }

      handleCancelEdit();
      fetchStaff();
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
        <p className="ml-3 text-gray-600">Loading staff...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <UserPlus className="h-5 w-5 mr-2" />
          Staff Members
        </h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{staffMembers.length} members</span>
          <button
            onClick={handleAddNew}
            disabled={showAddForm || editingPhone !== null}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-4">Add New Staff Member</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('phone_number', { required: 'Phone number is required' })}
                  className="form-input w-full"
                  placeholder="10-digit phone number"
                />
                {errors.phone_number && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="form-input w-full"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <select {...register('designation', { required: true })} className="form-input w-full">
                  <option value="ceo">CEO</option>
                  <option value="chairperson">Chairperson</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Qualification <span className="text-red-500">*</span>
                </label>
                <select {...register('education_qualification', { required: true })} className="form-input w-full">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree Title</label>
                <input {...register('degree_title')} className="form-input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Joining <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('date_of_joining', { required: true })}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DIN</label>
                <input {...register('din')} className="form-input w-full" />
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Staff Member'}
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

      {staffMembers.length === 0 && !showAddForm ? (
        <div className="text-center py-8 text-gray-500">
          <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No staff members found for this FPC</p>
        </div>
      ) : (
        <div className="space-y-4">
          {staffMembers.map((staff) => (
            <div key={staff.phone_number} className="border border-gray-200 rounded-lg p-4">
              {editingPhone === staff.phone_number ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('phone_number', { required: 'Phone number is required' })}
                        className="form-input w-full bg-gray-100"
                        disabled
                      />
                      {errors.phone_number && (
                        <p className="text-xs text-red-600 mt-1">{errors.phone_number.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('name', { required: 'Name is required' })}
                        className="form-input w-full"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <select {...register('designation', { required: true })} className="form-input w-full">
                        <option value="ceo">CEO</option>
                        <option value="chairperson">Chairperson</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Education Qualification <span className="text-red-500">*</span>
                      </label>
                      <select {...register('education_qualification', { required: true })} className="form-input w-full">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree Title</label>
                      <input {...register('degree_title')} className="form-input w-full" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Joining <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...register('date_of_joining', { required: true })}
                        className="form-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DIN</label>
                      <input {...register('din')} className="form-input w-full" />
                    </div>
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
                      <h4 className="font-semibold text-gray-900 text-lg">{staff.name}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 uppercase">
                          {staff.designation}
                        </span>
                        <span className="text-sm text-gray-600">
                          {staff.gender === 'm' ? 'Male' : 'Female'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(staff)}
                      className="text-primary-600 hover:text-primary-900 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Phone Number</p>
                      <p className="font-medium text-gray-900">{staff.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Education</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {staff.education_qualification}
                      </p>
                    </div>
                    {staff.degree_title && (
                      <div>
                        <p className="text-gray-500">Degree</p>
                        <p className="font-medium text-gray-900">{staff.degree_title}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Date of Joining</p>
                      <p className="font-medium text-gray-900">
                        {staff.date_of_joining
                          ? new Date(staff.date_of_joining).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    {staff.din && (
                      <div>
                        <p className="text-gray-500">DIN</p>
                        <p className="font-medium text-gray-900">{staff.din}</p>
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

export default StaffEditTab;
