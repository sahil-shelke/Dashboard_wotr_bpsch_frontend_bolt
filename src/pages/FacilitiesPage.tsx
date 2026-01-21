import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Warehouse, Edit2, Trash2, Plus, X, Search, Filter, Minus, PlusCircle } from 'lucide-react';

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

interface ActivityItem {
  name: string;
  status: string;
  remarks: string;
}

interface EquipmentItem {
  name: string;
  quantity: number;
  remarks: string;
}

interface ShopItem {
  type: string;
  ownership: string;
  location: string;
  rent: number;
  utility: string;
  description: string;
}

interface FacilityFormData {
  fpo_id: number;
  category: Category;
  activities: ActivityItem[];
  equipment: EquipmentItem[];
  shops: ShopItem[];
}

interface Facility {
  id: number;
  fpo_id: number;
  category: Category;
  details: string | any;
  fpo_name?: string;
}

const FacilitiesPage: React.FC = () => {
  const [fpo_id, setFpoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [fpos, setFpos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Category>('activities_and_facilities');
  const [editingFacilityId, setEditingFacilityId] = useState<number | null>(null);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FacilityFormData>({
    defaultValues: {
      category: 'activities_and_facilities',
      activities: [{ name: '', status: '', remarks: '' }],
      equipment: [{ name: '', quantity: 1, remarks: '' }],
      shops: [{ type: '', ownership: '', location: '', rent: 0, utility: '', description: '' }],
    },
  });

  const { fields: activityFields, append: appendActivity, remove: removeActivity } = useFieldArray({
    control,
    name: 'activities',
  });

  const { fields: equipmentFields, append: appendEquipment, remove: removeEquipment } = useFieldArray({
    control,
    name: 'equipment',
  });

  const { fields: shopFields, append: appendShop, remove: removeShop } = useFieldArray({
    control,
    name: 'shops',
  });

  const selectedCategory = watch('category');

  useEffect(() => {
    const fetchFPOs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/fpo/approved', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFpos(response.data);
        setFpoId(response.data[0]?.fpo_id || null);
      } catch (error) {
        toast.error('Failed to fetch FPOs');
      }
    };
    fetchFPOs();
  }, []);

  useEffect(() => {
    if (fpo_id) fetchFacilities();
  }, [fpo_id]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/facilities/${fpo_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const parsedFacilities = response.data.map((facility: any) => {
        let parsedDetails;
        try {
          parsedDetails = typeof facility.details === 'string'
            ? JSON.parse(facility.details)
            : facility.details;
        } catch {
          parsedDetails = facility.details;
        }

        return {
          ...facility,
          details: parsedDetails, // 🔥 Assign to `details` so the rest of your code works
        };
      });

      setFacilities(parsedFacilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: FacilityFormData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let itemsToCreate: any[] = [];
      const { category, activities, equipment, shops } = formData; // Unpacking formData

      if (category === 'activities_and_facilities') {
        itemsToCreate = activities
          .filter((item) => item.name)
          .map((item) => ({
            fpo_id,
            category,
            details: item,
          }));
      } else if (category === 'office_equipment') {
        itemsToCreate = equipment
          .filter((item) => item.name)
          .map((item) => ({
            fpo_id,
            category,
            details: item,
          }));
      } else if (category === 'shops_and_facilities') {
        itemsToCreate = shops
          .filter((item) => item.type)
          .map((item) => ({
            fpo_id,
            category,
            details: item,
          }));
      }

      const payload = {
        ...formData,
        fpo_id,
        itemsToCreate, // Add the filtered items based on the category
      };

      if (itemsToCreate.length === 0) {
        toast.error('Please add at least one item');
        setLoading(false);
        return;
      }

      if (editingFacilityId) {
        // ✅ PUT request (edit existing)
        await axios.put(
          `/api/facilities/${editingFacilityId}`,
          itemsToCreate[0],
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Facility updated successfully!');
      } else {
        // ✅ POST request (create new)
        await Promise.all(
          itemsToCreate.map((item) =>
            axios.post('/api/facilities/', item, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
        toast.success(`${itemsToCreate.length} item(s) added successfully!`);
      }

      reset({
        category: 'activities_and_facilities',
        activities: [{ name: '', status: '', remarks: '' }],
        equipment: [{ name: '', quantity: 1, remarks: '' }],
        shops: [{ type: '', ownership: '', location: '', rent: 0, utility: '', description: '' }],
      });

      setEditingFacilityId(null);
      setShowModal(false);
      fetchFacilities();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (facility: Facility) => {
    const parsedDetails =
      typeof facility.details === 'object'
        ? facility.details
        : JSON.parse(facility.details || '{}');

    setEditingFacilityId(facility.id);
    setShowModal(true);
    setValue('category', facility.category);

    if (facility.category === 'activities_and_facilities') {
      reset({
        category: facility.category,
        activities: [parsedDetails],
        equipment: [{ name: '', quantity: 1, remarks: '' }],
        shops: [{ type: '', ownership: '', location: '', rent: 0, utility: '', description: '' }],
      });
    } else if (facility.category === 'office_equipment') {
      reset({
        category: facility.category,
        equipment: [parsedDetails],
        activities: [{ name: '', status: '', remarks: '' }],
        shops: [{ type: '', ownership: '', location: '', rent: 0, utility: '', description: '' }],
      });
    } else if (facility.category === 'shops_and_facilities') {
      reset({
        category: facility.category,
        shops: [parsedDetails],
        activities: [{ name: '', status: '', remarks: '' }],
        equipment: [{ name: '', quantity: 1, remarks: '' }],
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/facilities/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Facility deleted successfully!');
        fetchFacilities();
      } catch (error) {
        toast.error('Failed to delete facility');
      }
    }
  };

  const filteredFacilities = facilities.filter((facility) => {
    const details = typeof facility.details === 'object' ? facility.details : {};
    const matchesSearch =
      !searchQuery ||
      details.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      details.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = facility.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const incrementQuantity = (index: number) => {
    const currentValue = watch(`equipment.${index}.quantity`) || 0;
    setValue(`equipment.${index}.quantity`, currentValue + 1);
  };

  const decrementQuantity = (index: number) => {
    const currentValue = watch(`equipment.${index}.quantity`) || 0;
    if (currentValue > 0) {
      setValue(`equipment.${index}.quantity`, currentValue - 1);
    }
  };



  const renderFormFields = () => {
    switch (selectedCategory) {
      case 'activities_and_facilities':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activities & Facilities</h3>
              <button
                type="button"
                onClick={() => appendActivity({ name: '', status: '', remarks: '' })}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Activity</span>
              </button>
            </div>

            {activityFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Activity #{index + 1}</h4>
                  {activityFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      Facility Name <span className="text-red-500">*</span>
                    </label>
                    <select {...register(`activities.${index}.name`, { required: true })} className="form-input">
                      <option value="">Select Facility</option>
                      {masterOptions.activities_and_facilities.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select {...register(`activities.${index}.status`)} className="form-input">
                      <option value="">Select Status</option>
                      <option value="available">Available</option>
                      <option value="not_available">Not Available</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Remarks</label>
                    <textarea {...register(`activities.${index}.remarks`)} className="form-input" rows={2} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'office_equipment':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Office Equipment</h3>
              <button
                type="button"
                onClick={() => appendEquipment({ name: '', quantity: 1, remarks: '' })}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Equipment</span>
              </button>
            </div>

            {equipmentFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Equipment #{index + 1}</h4>
                  {equipmentFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      Equipment Name <span className="text-red-500">*</span>
                    </label>
                    <select {...register(`equipment.${index}.name`, { required: true })} className="form-input">
                      <option value="">Select Equipment</option>
                      {masterOptions.office_equipment.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Quantity</label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => decrementQuantity(index)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </button>
                      <input
                        type="number"
                        {...register(`equipment.${index}.quantity`)}
                        className="form-input text-center"
                        min="0"
                        style={{ maxWidth: '100px' }}
                      />
                      <button
                        type="button"
                        onClick={() => incrementQuantity(index)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Remarks</label>
                    <textarea {...register(`equipment.${index}.remarks`)} className="form-input" rows={2} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'shops_and_facilities':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shops & Facilities</h3>
              <button
                type="button"
                onClick={() =>
                  appendShop({ type: '', ownership: '', location: '', rent: 0, utility: '', description: '' })
                }
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Shop/Facility</span>
              </button>
            </div>

            {shopFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Shop/Facility #{index + 1}</h4>
                  {shopFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeShop(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select {...register(`shops.${index}.type`, { required: true })} className="form-input">
                      <option value="">Select Type</option>
                      {masterOptions.shops_and_facilities.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Ownership</label>
                    <select {...register(`shops.${index}.ownership`)} className="form-input">
                      <option value="">Select Ownership</option>
                      <option value="owned">Owned</option>
                      <option value="rented">Rented</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Location</label>
                    <input type="text" {...register(`shops.${index}.location`)} className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">Rent (if rented)</label>
                    <input type="number" {...register(`shops.${index}.rent`)} className="form-input" min="0" />
                  </div>

                  <div>
                    <label className="form-label">Products / Utility</label>
                    <input type="text" {...register(`shops.${index}.utility`)} className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea {...register(`shops.${index}.description`)} className="form-input" rows={2} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Warehouse className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">FPC Facilities Management</h1>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            reset({
              category: 'activities_and_facilities',
              activities: [{ name: '', status: '', remarks: '' }],
              equipment: [{ name: '', quantity: 1, remarks: '' }],
              shops: [{ type: '', ownership: '', location: '', rent: 0, utility: '', description: '' }],
            });
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Facilities</span>
        </button>
      </div>

      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Search</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facilities..."
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('activities_and_facilities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activities_and_facilities'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activities & Facilities
            </button>
            <button
              onClick={() => setActiveTab('office_equipment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'office_equipment'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Office Equipment
            </button>
            <button
              onClick={() => setActiveTab('shops_and_facilities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shops_and_facilities'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Shops / Facilities
            </button>
          </nav>
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">
  {editingFacilityId ? 'Edit Facility' : 'Add New Facility'}
</h2>

              <button
                onClick={() => {
                  setShowModal(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <label className="form-label">
                  Select Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category', { required: true })}
                  className="form-input"
                  onChange={(e) => {
                    setValue('category', e.target.value as Category);
                  }}
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
                  onClick={() => {
                    setShowModal(false);
                    reset();
                  }}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
<button type="submit" className="btn-primary" disabled={loading}>
  {loading ? 'Saving...' : editingFacilityId ? 'Update Facility' : 'Save All Items'}
</button>

              </div>
            </form>
          </div>
        </div>
      )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'activities_and_facilities' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </>
                )}
                {activeTab === 'office_equipment' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </>
                )}
                {activeTab === 'shops_and_facilities' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ownership
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'shops_and_facilities' ? 7 : 4} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'shops_and_facilities' ? 7 : 4} className="px-6 py-12 text-center text-gray-500">
                    No facilities found. Click "Add Facilities" to create one.
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((facility) => {
                  const details = typeof facility.details === 'object' ? facility.details : {};
                  return (
                    <tr key={facility.id} className="hover:bg-gray-50">
                      {activeTab === 'activities_and_facilities' && (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {details.name || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.status || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.remarks || '—'}
                          </td>
                        </>
                      )}
                      {activeTab === 'office_equipment' && (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {details.name || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.quantity || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.remarks || '—'}
                          </td>
                        </>
                      )}
                      {activeTab === 'shops_and_facilities' && (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {details.type || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.ownership || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.location || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.rent ? `₹${details.rent}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.utility || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {details.description || '—'}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
    onClick={() => handleEdit(facility)}
    className="text-blue-600 hover:text-blue-900"
  >
    <Edit2 className="h-4 w-4" />
  </button>
                        {/* <button
                          onClick={() => handleDelete(facility.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button> */}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacilitiesPage;
