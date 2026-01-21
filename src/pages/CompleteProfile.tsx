import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Save, User, Building2, FileText, Users } from 'lucide-react';

interface ProfileData {
  // Basic FPC Information
  establishedYear: string;
  memberCount: number;
  shareCapital: number;
  authorizedCapital: number;
  
  // Leadership Details
  chairperson: {
    name: string;
    email: string;
    phone: string;
    qualification: string;
    experience: string;
  };
  
  ceo: {
    name: string;
    email: string;
    phone: string;
    qualification: string;
    experience: string;
  };
  
  // Business Information
  primaryCrops: string[];
  businessActivities: string[];
  marketingChannels: string[];
  
  // Financial Information
  annualTurnover: number;
  profitLastYear: number;
  
  // Additional Information
  certifications: string[];
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
}

const CompleteProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProfileData>();

  const onSubmit = async (data: ProfileData) => {
    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      console.log('Profile Data:', data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Profile completed successfully! Your FPC is now fully onboarded.');
    } catch (error) {
      toast.error('Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const cropOptions = [
    'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Pulses', 'Oilseeds', 
    'Vegetables', 'Fruits', 'Spices', 'Tea', 'Coffee', 'Rubber', 'Others'
  ];

  const businessActivityOptions = [
    'Input Supply', 'Procurement', 'Processing', 'Marketing', 'Storage', 
    'Transportation', 'Credit Facilitation', 'Technical Services', 'Others'
  ];

  const marketingChannelOptions = [
    'Direct to Consumer', 'Retail Chains', 'Wholesale Markets', 'Online Platforms', 
    'Government Procurement', 'Export', 'Processing Units', 'Others'
  ];

  const certificationOptions = [
    'Organic Certification', 'Fair Trade', 'GlobalGAP', 'HACCP', 'ISO 22000', 
    'FSSAI', 'Rainforest Alliance', 'Others'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your FPC Profile</h1>
          <p className="text-gray-600">Please provide additional details to complete your FPC onboarding</p>
        </div>
        <div className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Completion</span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Building2 className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Basic FPC Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Year Established *</label>
                  <input
                    type="number"
                    {...register('establishedYear', { required: 'Year established is required' })}
                    className="form-input"
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                  {errors.establishedYear && <p className="text-red-500 text-sm mt-1">{errors.establishedYear.message}</p>}
                </div>

                <div>
                  <label className="form-label">Total Members *</label>
                  <input
                    type="number"
                    {...register('memberCount', { required: 'Member count is required', min: 1 })}
                    className="form-input"
                    placeholder="Enter number of members"
                  />
                  {errors.memberCount && <p className="text-red-500 text-sm mt-1">{errors.memberCount.message}</p>}
                </div>

                <div>
                  <label className="form-label">Share Capital (₹) *</label>
                  <input
                    type="number"
                    {...register('shareCapital', { required: 'Share capital is required', min: 0 })}
                    className="form-input"
                    placeholder="Enter share capital amount"
                  />
                  {errors.shareCapital && <p className="text-red-500 text-sm mt-1">{errors.shareCapital.message}</p>}
                </div>

                <div>
                  <label className="form-label">Authorized Capital (₹) *</label>
                  <input
                    type="number"
                    {...register('authorizedCapital', { required: 'Authorized capital is required', min: 0 })}
                    className="form-input"
                    placeholder="Enter authorized capital amount"
                  />
                  {errors.authorizedCapital && <p className="text-red-500 text-sm mt-1">{errors.authorizedCapital.message}</p>}
                </div>
              </div>

              <div>
                <label className="form-label">Primary Crops *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {cropOptions.map((crop) => (
                    <label key={crop} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={crop}
                        {...register('primaryCrops', { required: 'Select at least one crop' })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{crop}</span>
                    </label>
                  ))}
                </div>
                {errors.primaryCrops && <p className="text-red-500 text-sm mt-1">{errors.primaryCrops.message}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Leadership Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Leadership Details</h3>
              </div>

              {/* Chairperson Details */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-800 border-b pb-2">Chairperson Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Name *</label>
                    <input
                      {...register('chairperson.name', { required: 'Chairperson name is required' })}
                      className="form-input"
                      placeholder="Enter chairperson name"
                    />
                    {errors.chairperson?.name && <p className="text-red-500 text-sm mt-1">{errors.chairperson.name.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      {...register('chairperson.email', { required: 'Email is required' })}
                      className="form-input"
                      placeholder="Enter email address"
                    />
                    {errors.chairperson?.email && <p className="text-red-500 text-sm mt-1">{errors.chairperson.email.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Phone *</label>
                    <input
                      {...register('chairperson.phone', { 
                        required: 'Phone is required',
                        pattern: { value: /^[789]\d{9}$/, message: 'Invalid phone number' }
                      })}
                      className="form-input"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                    {errors.chairperson?.phone && <p className="text-red-500 text-sm mt-1">{errors.chairperson.phone.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Qualification *</label>
                    <input
                      {...register('chairperson.qualification', { required: 'Qualification is required' })}
                      className="form-input"
                      placeholder="Enter qualification"
                    />
                    {errors.chairperson?.qualification && <p className="text-red-500 text-sm mt-1">{errors.chairperson.qualification.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Experience *</label>
                    <textarea
                      {...register('chairperson.experience', { required: 'Experience is required' })}
                      className="form-input"
                      rows={3}
                      placeholder="Describe relevant experience"
                    />
                    {errors.chairperson?.experience && <p className="text-red-500 text-sm mt-1">{errors.chairperson.experience.message}</p>}
                  </div>
                </div>
              </div>

              {/* CEO Details */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-800 border-b pb-2">CEO Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Name *</label>
                    <input
                      {...register('ceo.name', { required: 'CEO name is required' })}
                      className="form-input"
                      placeholder="Enter CEO name"
                    />
                    {errors.ceo?.name && <p className="text-red-500 text-sm mt-1">{errors.ceo.name.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      {...register('ceo.email', { required: 'Email is required' })}
                      className="form-input"
                      placeholder="Enter email address"
                    />
                    {errors.ceo?.email && <p className="text-red-500 text-sm mt-1">{errors.ceo.email.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Phone *</label>
                    <input
                      {...register('ceo.phone', { 
                        required: 'Phone is required',
                        pattern: { value: /^[789]\d{9}$/, message: 'Invalid phone number' }
                      })}
                      className="form-input"
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                    {errors.ceo?.phone && <p className="text-red-500 text-sm mt-1">{errors.ceo.phone.message}</p>}
                  </div>

                  <div>
                    <label className="form-label">Qualification *</label>
                    <input
                      {...register('ceo.qualification', { required: 'Qualification is required' })}
                      className="form-input"
                      placeholder="Enter qualification"
                    />
                    {errors.ceo?.qualification && <p className="text-red-500 text-sm mt-1">{errors.ceo.qualification.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Experience *</label>
                    <textarea
                      {...register('ceo.experience', { required: 'Experience is required' })}
                      className="form-input"
                      rows={3}
                      placeholder="Describe relevant experience"
                    />
                    {errors.ceo?.experience && <p className="text-red-500 text-sm mt-1">{errors.ceo.experience.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
              </div>

              <div>
                <label className="form-label">Business Activities *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {businessActivityOptions.map((activity) => (
                    <label key={activity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={activity}
                        {...register('businessActivities', { required: 'Select at least one business activity' })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{activity}</span>
                    </label>
                  ))}
                </div>
                {errors.businessActivities && <p className="text-red-500 text-sm mt-1">{errors.businessActivities.message}</p>}
              </div>

              <div>
                <label className="form-label">Marketing Channels *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {marketingChannelOptions.map((channel) => (
                    <label key={channel} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={channel}
                        {...register('marketingChannels', { required: 'Select at least one marketing channel' })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{channel}</span>
                    </label>
                  ))}
                </div>
                {errors.marketingChannels && <p className="text-red-500 text-sm mt-1">{errors.marketingChannels.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Annual Turnover (₹) *</label>
                  <input
                    type="number"
                    {...register('annualTurnover', { required: 'Annual turnover is required', min: 0 })}
                    className="form-input"
                    placeholder="Enter annual turnover"
                  />
                  {errors.annualTurnover && <p className="text-red-500 text-sm mt-1">{errors.annualTurnover.message}</p>}
                </div>

                <div>
                  <label className="form-label">Profit Last Year (₹) *</label>
                  <input
                    type="number"
                    {...register('profitLastYear', { required: 'Profit is required' })}
                    className="form-input"
                    placeholder="Enter profit amount"
                  />
                  {errors.profitLastYear && <p className="text-red-500 text-sm mt-1">{errors.profitLastYear.message}</p>}
                </div>
              </div>

              <div>
                <label className="form-label">Certifications (if any)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {certificationOptions.map((cert) => (
                    <label key={cert} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={cert}
                        {...register('certifications')}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Bank Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Bank Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Bank Name *</label>
                  <input
                    {...register('bankDetails.bankName', { required: 'Bank name is required' })}
                    className="form-input"
                    placeholder="Enter bank name"
                  />
                  {errors.bankDetails?.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankDetails.bankName.message}</p>}
                </div>

                <div>
                  <label className="form-label">Account Number *</label>
                  <input
                    {...register('bankDetails.accountNumber', { required: 'Account number is required' })}
                    className="form-input"
                    placeholder="Enter account number"
                  />
                  {errors.bankDetails?.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.bankDetails.accountNumber.message}</p>}
                </div>

                <div>
                  <label className="form-label">IFSC Code *</label>
                  <input
                    {...register('bankDetails.ifscCode', { 
                      required: 'IFSC code is required',
                      pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC code format' }
                    })}
                    className="form-input"
                    placeholder="Enter IFSC code"
                    maxLength={11}
                  />
                  {errors.bankDetails?.ifscCode && <p className="text-red-500 text-sm mt-1">{errors.bankDetails.ifscCode.message}</p>}
                </div>

                <div>
                  <label className="form-label">Branch *</label>
                  <input
                    {...register('bankDetails.branch', { required: 'Branch is required' })}
                    className="form-input"
                    placeholder="Enter branch name"
                  />
                  {errors.bankDetails?.branch && <p className="text-red-500 text-sm mt-1">{errors.bankDetails.branch.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              className={`btn-secondary ${currentStep === 1 ? 'invisible' : ''}`}
            >
              Previous
            </button>

            <div className="flex space-x-4">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Completing...' : 'Complete Profile'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;