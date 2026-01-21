import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Warehouse, Edit, Save, X, Plus, Minus } from 'lucide-react';

const masterOptions = {
  activities_and_facilities: [
    'Drone',
    'BRC – 10 Drum Theory',
    'BRC - Vermi Compost',
    'BRC – Soil Testing unit',
    'Pickup Van',
    'FPC Management cost',
    'CEO Honorarium',
    'BDA for FPCs',
    'Nursery',
    'Cleaning Grading Unit',
    'Godown',
    'Pack House',
    'Dall Mill - Dal Processing Machine',
    'Oil Extraction unit',
    'Peanuts decorticator',
    'Collection and Storage centre',
    'Maize pilling',
    'CSC centre',
    'Refrigerator',
    'Tamarind de seedier',
    'Tamarind Cake making machine',
    'Referral Van',
    'Input shop',
    'Agricultural Machineries – Argo service centre',
    'Other',
  ],
  office_equipment: [
    'Desktop',
    'Laptop',
    'Printer',
    'Table',
    'Chair',
    'Cupboard',
    'Rack',
    'Table Fan',
    'Pendrive',
    'Scanner',
    'Other',
  ],
  shops_and_facilities: [
    'Shop / Sale Point / Mall',
    'Storage Facility',
    'Primary Processing Facility',
  ],
};

type Category = keyof typeof masterOptions;

interface FacilityFormData {
  fpo_id: number;
  category: Category;
  details: {
    name?: string;
    type?: string;
    status?: string;
    ownership?: string;
    quantity?: number;
    rent?: number;
    location?: string;
    utility?: string;
    description?: string;
    remarks?: string;
  };
}

interface Facility {
  id: number;
  fpo_id: number;
  category: Category;
  details: string | any;
}

interface FacilityEditTabProps {
  fpoId: number;
}

const FacilityEditTab: React.FC<FacilityEditTabProps> = ({ fpoId }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('activities_and_facilities');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FacilityFormData>({
    defaultValues: {
      fpo_id: fpoId,
      category: 'activities_and_facilities',
      details: {},
    },
  });

  const watchedCategory = watch('category');
  const watchedQuantity = watch('details.quantity');

  useEffect(() => {
    fetchFacilities();
  }, [fpoId]);

const fetchFacilities = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/facilities/${fpoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const parsedFacilities = response.data.map((facility: Facility) => {
      let parsedData;
      try {
        parsedData = typeof facility.details === 'string'
          ? JSON.parse(facility.details)
          : facility.details;
      } catch {
        parsedData = facility.details;
      }

      return {
        ...facility,
        details: parsedData, // ✅ frontend will now use `facility.details`
      };
    });

    setFacilities(parsedFacilities || []);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      toast.error('Failed to fetch facilities');
    }
    setFacilities([]);
  } finally {
    setLoading(false);
  }
};


  const handleEdit = (facility: Facility) => {
    setEditingId(facility.id);
    setSelectedCategory(facility.category);

    const dataFields = typeof facility.details === 'object' ? facility.details : {};



    reset({
      fpo_id: fpoId,
      category: facility.category,
      details: dataFields,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setSelectedCategory('activities_and_facilities');
    reset({
      fpo_id: fpoId,
      category: 'activities_and_facilities',
      details: {},
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setShowAddForm(true);
    setSelectedCategory('activities_and_facilities');
    reset({
      fpo_id: fpoId,
      category: 'activities_and_facilities',
      details: { quantity: 1 },
    });
  };

  const incrementQuantity = () => {
    const currentValue = watchedQuantity || 0;
    setValue('details.quantity', currentValue + 1);
  };

  const decrementQuantity = () => {
    const currentValue = watchedQuantity || 0;
    if (currentValue > 0) {
      setValue('details.quantity', currentValue - 1);
    }
  };

  const onSubmit = async (formData: FacilityFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        fpo_id: fpoId,
        category: formData.category,
        details: formData.details,
      };

      if (showAddForm) {
        await axios.post('/api/facilities/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Facility created successfully!');
      } else if (editingId) {
        await axios.put(`/api/facilities/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Facility updated successfully!');
      }

      handleCancelEdit();
      fetchFacilities();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'activities_and_facilities':
        return 'Activities & Facilities';
      case 'office_equipment':
        return 'Office Equipment';
      case 'shops_and_facilities':
        return 'Shops / Facilities';
      default:
        return category;
    }
  };

  const renderFormFields = () => {
    const category = watchedCategory || selectedCategory;

    switch (category) {
      case 'activities_and_facilities':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facility Name <span className="text-red-500">*</span>
              </label>
              <select {...register('details.name', { required: true })} className="form-input w-full">
                <option value="">Select Facility</option>
                {masterOptions.activities_and_facilities.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.details?.name && <span className="text-red-500 text-sm">This field is required</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('details.status')} className="form-input w-full">
                <option value="">Select Status</option>
                <option value="available">Available</option>
                <option value="not_available">Not Available</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea {...register('details.remarks')} className="form-input w-full" rows={3} />
            </div>
          </div>
        );

      case 'office_equipment':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <select {...register('details.name', { required: true })} className="form-input w-full">
                <option value="">Select Equipment</option>
                {masterOptions.office_equipment.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.details?.name && <span className="text-red-500 text-sm">This field is required</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={decrementQuantity}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Minus className="h-4 w-4 text-gray-600" />
                </button>
                <input
                  type="number"
                  {...register('details.quantity')}
                  className="form-input text-center w-24"
                  min="0"
                />
                <button
                  type="button"
                  onClick={incrementQuantity}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea {...register('details.remarks')} className="form-input w-full" rows={3} />
            </div>
          </div>
        );

      case 'shops_and_facilities':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select {...register('details.type', { required: true })} className="form-input w-full">
                <option value="">Select Type</option>
                {masterOptions.shops_and_facilities.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.details?.type && <span className="text-red-500 text-sm">This field is required</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ownership</label>
              <select {...register('details.ownership')} className="form-input w-full">
                <option value="">Select Ownership</option>
                <option value="owned">Owned</option>
                <option value="rented">Rented</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" {...register('details.location')} className="form-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent (if rented)</label>
              <input type="number" {...register('details.rent')} className="form-input w-full" min="0" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Products / Utility</label>
              <input type="text" {...register('details.utility')} className="form-input w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('details.description')} className="form-input w-full" rows={3} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading facilities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Warehouse className="h-5 w-5 mr-2" />
          Facilities
        </h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{facilities.length} facilities</span>
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
          <h4 className="font-semibold text-gray-900 mb-4">Add New Facility</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register('category', { required: true })}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as Category);
                  setValue('category', e.target.value as Category);
                }}
                className="form-input w-full"
              >
                <option value="activities_and_facilities">Activities & Facilities</option>
                <option value="office_equipment">Office Equipment</option>
                <option value="shops_and_facilities">Shops / Facilities</option>
              </select>
            </div>

            {renderFormFields()}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="btn-secondary"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                <Save className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {facilities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Warehouse className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No facilities found. Click "Add New" to create one.</p>
          </div>
        ) : (
          facilities.map((facility) => (
            <div
              key={facility.id}
              className={`border rounded-lg p-4 ${
                editingId === facility.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              {editingId === facility.id ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Edit Facility</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={getCategoryLabel(facility.category)}
                      disabled
                      className="form-input w-full bg-gray-100"
                    />
                  </div>

                  {renderFormFields()}

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="btn-secondary"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                      <Save className="h-4 w-4 mr-1" />
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryLabel(facility.category)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {typeof facility.details === 'object' ? (facility.details.name || facility.details.type || '—') : '—'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {facility.category === 'activities_and_facilities' && (() => {
                        const data = typeof facility.details === 'object' ? facility.details : {};
                        return (
                          <>
                            {data.status && (
                              <p>
                                <span className="font-medium">Status:</span> {data.status}
                              </p>
                            )}
                            {data.remarks && (
                              <p>
                                <span className="font-medium">Remarks:</span> {data.remarks}
                              </p>
                            )}
                          </>
                        );
                      })()}
                      {facility.category === 'office_equipment' && (() => {
                        const data = typeof facility.details === 'object' ? facility.details : {};
                        return (
                          <>
                            {data.quantity !== undefined && (
                              <p>
                                <span className="font-medium">Quantity:</span> {data.quantity}
                              </p>
                            )}
                            {data.remarks && (
                              <p>
                                <span className="font-medium">Remarks:</span> {data.remarks}
                              </p>
                            )}
                          </>
                        );
                      })()}
                      {facility.category === 'shops_and_facilities' && (() => {
                        const data = typeof facility.details === 'object' ? facility.details : {};
                        return (
                          <>
                            {data.ownership && (
                              <p>
                                <span className="font-medium">Ownership:</span> {data.ownership}
                              </p>
                            )}
                            {data.location && (
                              <p>
                                <span className="font-medium">Location:</span> {data.location}
                              </p>
                            )}
                            {data.rent && (
                              <p>
                                <span className="font-medium">Rent:</span> ₹{data.rent}
                              </p>
                            )}
                            {data.utility && (
                              <p>
                                <span className="font-medium">Utility:</span> {data.utility}
                              </p>
                            )}
                            {data.description && (
                              <p>
                                <span className="font-medium">Description:</span> {data.description}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(facility)}
                    disabled={editingId !== null || showAddForm}
                    className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FacilityEditTab;
