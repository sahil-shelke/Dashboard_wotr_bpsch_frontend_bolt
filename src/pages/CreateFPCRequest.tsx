import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Save, Building2, Upload, X, FileText, Image, Eye } from 'lucide-react';

interface CreateFPCRequestData {
  name: string;
  state_code: number | null;
  district_code: number | null;
  fpc_registration_number: string;
  pan: string;
  tan: string;
  gst_number: string;
  registration_date: string;
  registered_company_address: string;
  office_address: string;
  office_block: string;
  office_contact_name: string;
  office_contact_number: string;
  office_contact_email: string;
  responsible_wotr_staff_phone: string;
  project_manager_phone: string;
  bod_name: string;
  bod_phone_number: string;
  bod_gender: 'm' | 'f';
  bod_date_of_joining: string;
  bod_qualification: string;
  address: string;
  bod_din:string
}

interface ProjectManager {
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  state_code: number | null;
  statename: string | null;
  district_code: number | null;
  districtname: string | null;
  role_id: number;
}

interface RegionalManager {
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  state_code: number | null;
  statename: string | null;
  district_code: number | null;
  districtname: string | null;
  role_id: number;
}

interface District {
  state_code: number;
  state_name: string;
  district_code: number;
  district_name: string;
}

const CreateFPCRequest: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [regionalManagers, setRegionalManagers] = useState<RegionalManager[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState<number | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [tanFile, setTanFile] = useState<File | null>(null);
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string; type: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFPCRequestData>();

  useEffect(() => {
    fetchProjectManagers();
    fetchRegionalManagers();
    fetchDistricts();
  }, []);

  const fetchProjectManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/pm/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProjectManagers(response.data);
    } catch (error: any) {
      console.error('Error fetching project managers:', error);
      // toast.error('Failed to fetch project managers');
    }
  };

  const fetchRegionalManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/rm/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRegionalManagers(response.data);
    } catch (error: any) {
      console.error('Error fetching regional managers:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/districts/districts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setDistricts(response.data);
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      toast.error('Failed to fetch districts');
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        toast.error('Please upload an image (JPG, PNG, GIF) or PDF file');
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        e.target.value = '';
        return;
      }

      setFile(file);
    }
  };

  const removeFile = (
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    inputId: string
  ) => {
    setFile(null);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) input.value = '';
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <Image className="h-5 w-5 text-blue-600" />;
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

  const onSubmit = async (data: CreateFPCRequestData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Form data to submit:', data);

      const formData = new FormData();

      const fpo_details = {
        name: data.name,
        state_code: data.state_code,
        district_code: data.district_code,
        fpc_registration_number: data.fpc_registration_number,
        pan: data.pan,
        tan: data.tan,
        gst_number: data.gst_number,
        registration_date: data.registration_date,
        registered_company_address: data.registered_company_address,
        office_address: data.office_address,
        office_block: data.office_block,
        office_contact_name: data.office_contact_name,
        office_contact_number: data.office_contact_number,
        office_contact_email: data.office_contact_email,
        responsible_wotr_staff_phone: data.responsible_wotr_staff_phone,
        project_manager_phone: data.project_manager_phone
      };

      const bod_details = {
        mobile_number: data.bod_phone_number,
        name: data.bod_name,
        gender: data.bod_gender,
        education_qualification: data.bod_qualification,
        din: data.bod_din,
        address: data.address
      };

      formData.append('fpo_details', JSON.stringify(fpo_details));
      formData.append('bod_details', JSON.stringify(bod_details));

      if (panFile) {
        formData.append('pan_document', panFile);
      }
      if (tanFile) {
        formData.append('tan_document', tanFile);
      }
      if (gstFile) {
        formData.append('gst_document', gstFile);
      }

      console.log('Sending form data with files');

      const response = await fetch('/api/fpo/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create FPC');
      }

      const result = await response.json();

      toast.success('FPC created successfully! Additional details can be added later through the dedicated forms.');
      reset();
      setPanFile(null);
      setTanFile(null);
      setGstFile(null);

    } catch (error: any) {
      console.error('Error creating FPC:', error);
      toast.error(error.message || 'Failed to create FPC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New FPC</h1>
            <p className="text-gray-600">Create a new Farmer Producer Company with basic information</p>
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">ℹ</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">What happens after creation?</h3>
            <p className="text-sm text-blue-700 mt-1">
              After creating the FPC with basic information, additional details like shareholders, CEO details, 
              licenses, and financial information can be added later through the dedicated management forms.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic FPC Information */}
          <div className="space-y-4">
            <h3 className="section-title">Basic FPC Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="form-label">State *</label>
                <select
                  className="form-input"
                  {...register('state_code', { required: 'State is required', valueAsNumber: true })}
                  onChange={(e) => {
                    const code = parseInt(e.target.value);
                    setSelectedStateCode(code);
                    const selected = districts.find(d => d.state_code === code);
                    setSelectedState(selected?.state_name || '');
                  }}
                >
                  <option value="">Select State</option>
                  {[...new Map(districts.map(d => [d.state_code, d.state_name]))]
                    .map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                </select>
                {errors.state_code && <p className="text-red-500 text-sm mt-1">{errors.state_code.message}</p>}
              </div>

              <div>
                <label className="form-label">District *</label>
                <select
                  {...register('district_code', { required: 'District is required', valueAsNumber: true })}
                  className="form-input"
                  disabled={!selectedStateCode}
                >
                  <option value="">Select District</option>
                  {districts
                    .filter(d => d.state_code === selectedStateCode)
                    .map((district) => (
                      <option key={district.district_code} value={district.district_code}>
                        {district.district_name}
                      </option>
                    ))}
                </select>
                {errors.district_code && <p className="text-red-500 text-sm mt-1">{errors.district_code.message}</p>}
              </div>

              <div>
                <label className="form-label">FPC Name *</label>
                <input
                  {...register('name', { required: 'FPC name is required' })}
                  className="form-input"
                  placeholder="Enter FPC name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>
            </div>
          </div>

          {/* BOD Member Information */}
          <div className="space-y-4">
            <h3 className="section-title">BOD Member Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="form-label">BOD Member Name *</label>
                <input
                  {...register('bod_name', { required: 'BOD member name is required' })}
                  className="form-input"
                  placeholder="Enter BOD member name"
                />
                {errors.bod_name && <p className="text-red-500 text-sm mt-1">{errors.bod_name.message}</p>}
              </div>

              <div>
                <label className="form-label">BOD Phone Number *</label>
                <input
                  {...register('bod_phone_number', { 
                    required: 'BOD phone number is required',
                    pattern: { value: /^[789]\d{9}$/, message: 'Invalid phone number' }
                  })}
                  className="form-input"
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
                {errors.bod_phone_number && <p className="text-red-500 text-sm mt-1">{errors.bod_phone_number.message}</p>}
              </div>

              <div>
                <label className="form-label">BOD Gender *</label>
                <select
                  {...register('bod_gender', { required: 'BOD gender is required' })}
                  className="form-input"
                >
                  <option value="">Select Gender</option>
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
                {errors.bod_gender && <p className="text-red-500 text-sm mt-1">{errors.bod_gender.message}</p>}
              </div>

              <div>
                <label className="form-label">BOD Date of Joining</label>
                <input
                  type="date"
                  {...register('bod_date_of_joining')}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">BOD Qualification</label>
                <select
                  {...register('bod_qualification')}
                  className="form-input"
                >
                  <option value="">Select Qualification</option>
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
                <label className="form-label">Address</label>
                <input
                  {...register('address')}
                  className="form-input"
                  placeholder="Enter address"
                />
              </div>
              
             <div>
                <label className="form-label">DIN</label>
                <input
                  {...register('bod_din')}
                  className="form-input"
                  placeholder="Enter DIN"
                />
              </div>
            </div>
          </div>

          {/* FPO Office Information */}
          <div className="space-y-4">
            <h3 className="section-title">FPO Office Information</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">FPO Office Block *</label>
                  <input
                    {...register('office_block', { required: 'Office block is required' })}
                    className="form-input"
                    placeholder="Enter office block"
                  />
                  {errors.office_block && <p className="text-red-500 text-sm mt-1">{errors.office_block.message}</p>}
                </div>

                <div>
                  <label className="form-label">FPO Contact Person Name *</label>
                  <input
                    {...register('office_contact_name', { required: 'Contact person is required' })}
                    className="form-input"
                    placeholder="Enter contact person name"
                  />
                  {errors.office_contact_name && <p className="text-red-500 text-sm mt-1">{errors.office_contact_name.message}</p>}
                </div>

                <div>
                  <label className="form-label">FPO Contact Phone Number *</label>
                  <input
                    {...register('office_contact_number', {
                      required: 'Contact phone is required',
                      pattern: { value: /^[789]\d{9}$/, message: 'Invalid phone number' }
                    })}
                    className="form-input"
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                  {errors.office_contact_number && <p className="text-red-500 text-sm mt-1">{errors.office_contact_number.message}</p>}
                </div>

                <div>
                  <label className="form-label">FPO Contact Email *</label>
                  <input
                    type="email"
                    {...register('office_contact_email', { required: 'Contact email is required' })}
                    className="form-input"
                    placeholder="Enter email address"
                  />
                  {errors.office_contact_email && <p className="text-red-500 text-sm mt-1">{errors.office_contact_email.message}</p>}
                </div>

                <div>
                  <label className="form-label">WOTR Staff (Regional Manager) *</label>
{regionalManagers
  .filter((rm) => rm.email === user?.email)
  .map((rm) => (
    <div key={rm.phone_number}>
      <input
        type="text"
        value={`${rm.first_name} ${rm.last_name} | ${rm.districtname || 'N/A'}, ${rm.statename || 'N/A'} | ${rm.phone_number}`}
        readOnly
        className="form-input bg-gray-100 cursor-not-allowed"
       
      />
      <input
        type="hidden"
        value={rm.phone_number}
        {...register('responsible_wotr_staff_phone', { required: 'WOTR staff is required' })}
      />
    </div>
  ))}

                  {errors.responsible_wotr_staff_phone && <p className="text-red-500 text-sm mt-1">{errors.responsible_wotr_staff_phone.message}</p>}
                </div>

                <div>
                  <label className="form-label">Project Manager *</label>
                  <select
                    {...register('project_manager_phone', { required: 'Project manager is required' })}
                    className="form-input"
                  >
                    <option value="">Select Project Manager</option>
                    {projectManagers.map((pm) => (
                      <option key={pm.phone_number} value={pm.phone_number}>
                        {pm.first_name} {pm.last_name} | {pm.districtname || 'N/A'}, {pm.statename || 'N/A'} | {pm.phone_number}
                      </option>
                    ))}
                  </select>
                  {errors.project_manager_phone && <p className="text-red-500 text-sm mt-1">{errors.project_manager_phone.message}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Registered Company Address *</label>
                <textarea
                  {...register('registered_company_address', { required: 'Address is required' })}
                  className="form-input"
                  rows={3}
                  placeholder="Enter registered company address"
                />
                {errors.registered_company_address && <p className="text-red-500 text-sm mt-1">{errors.registered_company_address.message}</p>}
              </div>

              <div>
                <label className="form-label">Office Address *</label>
                <textarea
                  {...register('office_address', { required: 'Office address is required' })}
                  className="form-input"
                  rows={3}
                  placeholder="Enter office address"
                />
                {errors.office_address && <p className="text-red-500 text-sm mt-1">{errors.office_address.message}</p>}
              </div>
            </div>
          </div>

          {/* Registration Documents */}
          <div className="space-y-4">
            <h3 className="section-title">Registration Documents</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">FPC Registration Number *</label>
                <input
                  {...register('fpc_registration_number', { required: 'Registration number is required' })}
                  className="form-input"
                  placeholder="Enter FPC registration number"
                />
                {errors.fpc_registration_number && <p className="text-red-500 text-sm mt-1">{errors.fpc_registration_number.message}</p>}
              </div>

              <div>
                <label className="form-label">Registration Date *</label>
                <input
                  type="date"
                  {...register('registration_date', { required: 'Registration date is required' })}
                  className="form-input"
                />
                {errors.registration_date && <p className="text-red-500 text-sm mt-1">{errors.registration_date.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">PAN Number *</label>
                <input
                  {...register('pan', {
                    required: 'PAN is required',
                    // pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' }
                  })}
                  className="form-input"
                  placeholder="Enter PAN number"
                  maxLength={10}
                />
                {errors.pan && <p className="text-red-500 text-sm mt-1">{errors.pan.message}</p>}
              </div>

              <div>
                <label className="form-label">Upload PAN Document</label>
                <div className="space-y-2">
                  {!panFile ? (
                    <label htmlFor="pan-upload" className="flex items-center justify-center w-full h-[42px] px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload (JPG, PNG, PDF - Max 5MB)</span>
                      </div>
                      <input
                        id="pan-upload"
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                        onChange={(e) => handleFileChange(e, setPanFile)}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between h-[42px] px-3 bg-green-50 border border-green-300 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(panFile)}
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{panFile.name}</p>
                          <span className="text-xs text-gray-500">({(panFile.size / 1024).toFixed(2)} KB)</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openPreview(panFile)}
                          className="p-1 hover:bg-green-100 rounded-full transition-colors"
                          title="Preview document"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(setPanFile, 'pan-upload')}
                          className="p-1 hover:bg-green-100 rounded-full transition-colors"
                          title="Remove document"
                        >
                          <X className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">TAN Number *</label>
                <input
                  {...register('tan', {
                    required: 'TAN is required',
                    maxLength: { value: 10, message: 'TAN must be 10 characters' }
                  })}
                  className="form-input"
                  placeholder="Enter TAN number"
                  maxLength={10}
                />
                {errors.tan && <p className="text-red-500 text-sm mt-1">{errors.tan.message}</p>}
              </div>

              <div>
                <label className="form-label">Upload TAN Document</label>
                <div className="space-y-2">
                  {!tanFile ? (
                    <label htmlFor="tan-upload" className="flex items-center justify-center w-full h-[42px] px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload (JPG, PNG, PDF - Max 5MB)</span>
                      </div>
                      <input
                        id="tan-upload"
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                        onChange={(e) => handleFileChange(e, setTanFile)}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between h-[42px] px-3 bg-green-50 border border-green-300 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(tanFile)}
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{tanFile.name}</p>
                          <span className="text-xs text-gray-500">({(tanFile.size / 1024).toFixed(2)} KB)</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openPreview(tanFile)}
                          className="p-1 hover:bg-green-100 rounded-full transition-colors"
                          title="Preview document"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(setTanFile, 'tan-upload')}
                          className="p-1 hover:bg-green-100 rounded-full transition-colors"
                          title="Remove document"
                        >
                          <X className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">GST Number *</label>
                <input
                  {...register('gst_number', {
                    required: 'GST number is required',
                    // pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GST format' }
                  })}
                  className="form-input"
                  placeholder="Enter GST number"
                  maxLength={15}
                />
                {errors.gst_number && <p className="text-red-500 text-sm mt-1">{errors.gst_number.message}</p>}
              </div>

              <div>
                <label className="form-label">Upload GST Document</label>
                <div className="space-y-2">
                  {!gstFile ? (
                    <label htmlFor="gst-upload" className="flex items-center justify-center w-full h-[42px] px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload (JPG, PNG, PDF - Max 5MB)</span>
                      </div>
                      <input
                        id="gst-upload"
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                        onChange={(e) => handleFileChange(e, setGstFile)}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between h-[42px] px-3 bg-green-50 border border-green-300 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(gstFile)}
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{gstFile.name}</p>
                          <span className="text-xs text-gray-500">({(gstFile.size / 1024).toFixed(2)} KB)</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openPreview(gstFile)}
                          className="p-1 hover:bg-green-100 rounded-full transition-colors"
                          title="Preview document"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(setGstFile, 'gst-upload')}
                          className="p-1 hover:bg-green-100 rounded-full transition-colors"
                          title="Remove document"
                        >
                          <X className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                reset();
                setPanFile(null);
                setTanFile(null);
                setGstFile(null);
                const panInput = document.getElementById('pan-upload') as HTMLInputElement;
                const tanInput = document.getElementById('tan-upload') as HTMLInputElement;
                const gstInput = document.getElementById('gst-upload') as HTMLInputElement;
                if (panInput) panInput.value = '';
                if (tanInput) tanInput.value = '';
                if (gstInput) gstInput.value = '';
              }}
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Creating FPC...' : 'Create FPC'}</span>
            </button>
          </div>
        </form>
      </div>

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

export default CreateFPCRequest;