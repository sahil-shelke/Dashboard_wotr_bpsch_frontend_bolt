import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle, MapPin, User, Mail, Phone, Lock, X } from 'lucide-react';
import { locationApi } from '../services/locationApi';
import { State, District, Block } from '../types/location';

interface SupervisorFormData {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  state_code: string;
  district_code: string;
  block_codes: string[];
}

export const AddSupervisorPage = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<SupervisorFormData>({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    state_code: '',
    district_code: '',
    block_codes: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  useEffect(() => {
    if (token) {
      loadStates();
    }
  }, [token]);

  useEffect(() => {
    if (formData.state_code && token) {
      loadDistricts(formData.state_code);
      setFormData((prev) => ({ ...prev, district_code: '', block_codes: [] }));
      setBlocks([]);
    }
  }, [formData.state_code]);

  useEffect(() => {
    if (formData.state_code && formData.district_code && token) {
      loadBlocks(formData.state_code, formData.district_code);
      setFormData((prev) => ({ ...prev, block_codes: [] }));
    }
  }, [formData.district_code]);

  const loadStates = async () => {
    if (!token) return;
    setLoadingStates(true);
    try {
      const data = await locationApi.getStates(token);
      setStates(data);
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const loadDistricts = async (stateCode: string) => {
    if (!token) return;
    setLoadingDistricts(true);
    try {
      const data = await locationApi.getDistricts(token, stateCode);
      setDistricts(data);
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadBlocks = async (stateCode: string, districtCode: string) => {
    if (!token) return;
    setLoadingBlocks(true);
    try {
      const data = await locationApi.getBlocks(token, stateCode, districtCode);
      setBlocks(data);
    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlockToggle = (blockCode: string) => {
    setFormData((prev) => ({
      ...prev,
      block_codes: prev.block_codes.includes(blockCode)
        ? prev.block_codes.filter((code) => code !== blockCode)
        : [...prev.block_codes, blockCode],
    }));
  };

  const removeBlock = (blockCode: string) => {
    setFormData((prev) => ({
      ...prev,
      block_codes: prev.block_codes.filter((code) => code !== blockCode),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create supervisor');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: 'Supervisor created successfully!',
      });

      setFormData({
        full_name: '',
        email: '',
        password: '',
        phone_number: '',
        state_code: '',
        district_code: '',
        block_codes: [],
      });
      setDistricts([]);
      setBlocks([]);

      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error creating supervisor:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to create supervisor. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone_number: '',
      state_code: '',
      district_code: '',
      block_codes: [],
    });
    setMessage(null);
    setDistricts([]);
    setBlocks([]);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add New Supervisor
        </h2>
        <p className="text-gray-600">
          Create a new supervisor account to manage villages
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="supervisor@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  maxLength={15}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter secure password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Assignment
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                name="state_code"
                value={formData.state_code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                disabled={loadingStates}
              >
                <option value="">
                  {loadingStates ? 'Loading states...' : 'Select a state'}
                </option>
                {states.map((state) => (
                  <option key={state.state_code} value={state.state_code}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <select
                name="district_code"
                value={formData.district_code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white disabled:bg-gray-100"
                disabled={!formData.state_code || loadingDistricts}
              >
                <option value="">
                  {loadingDistricts
                    ? 'Loading districts...'
                    : formData.state_code
                    ? 'Select a district'
                    : 'First select a state'}
                </option>
                {districts.map((district) => (
                  <option key={district.district_code} value={district.district_code}>
                    {district.district_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blocks
            </label>
            {!formData.district_code ? (
              <div className="text-sm text-gray-500 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                Please select a state and district first
              </div>
            ) : loadingBlocks ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading blocks...
              </div>
            ) : blocks.length === 0 ? (
              <div className="text-sm text-gray-500 py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                No blocks available for this district
              </div>
            ) : (
              <>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {blocks.map((block) => (
                      <label
                        key={block.block_code}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.block_codes.includes(block.block_code)}
                          onChange={() => handleBlockToggle(block.block_code)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{block.block_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.block_codes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Selected Blocks ({formData.block_codes.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.block_codes.map((code) => {
                        const block = blocks.find((b) => b.block_code === code);
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {block?.block_name}
                            <button
                              type="button"
                              onClick={() => removeBlock(code)}
                              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Supervisor...
                </>
              ) : (
                'Create Supervisor'
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
