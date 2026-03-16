import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface SurveyorFormData {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  state_code: string;
  district_code: string;
  block_codes: string[];
}

interface State {
  state_code: string;
  state_name: string;
}

interface District {
  district_code: string;
  district_name: string;
}

interface Block {
  block_code: string;
  block_name: string;
}

export const AddSurveyorPage = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<SurveyorFormData>({
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
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setIsLoadingStates(true);
    try {
      const response = await fetch('http://localhost:8000/api/location/states?language_id=1');
      if (!response.ok) {
        throw new Error('Failed to fetch states');
      }
      const data = await response.json();
      setStates(data);
    } catch (error) {
      console.error('Error fetching states:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load states. Please refresh the page.',
      });
    } finally {
      setIsLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateCode: string) => {
    setIsLoadingDistricts(true);
    setDistricts([]);
    setBlocks([]);
    try {
      const response = await fetch(
        `http://localhost:8000/api/location/districts?language_id=1&state_code=${stateCode}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch districts');
      }
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load districts. Please try again.',
      });
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  const fetchBlocks = async (stateCode: string, districtCode: string) => {
    setIsLoadingBlocks(true);
    setBlocks([]);
    try {
      const response = await fetch(
        `http://localhost:8000/api/location/blocks?language_id=1&state_code=${stateCode}&district_code=${districtCode}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch blocks');
      }
      const data = await response.json();
      setBlocks(data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load blocks. Please try again.',
      });
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state_code: stateCode,
      district_code: '',
      block_codes: [],
    }));

    if (stateCode) {
      fetchDistricts(stateCode);
    } else {
      setDistricts([]);
      setBlocks([]);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtCode = e.target.value;
    setFormData((prev) => ({
      ...prev,
      district_code: districtCode,
      block_codes: [],
    }));

    if (districtCode && formData.state_code) {
      fetchBlocks(formData.state_code, districtCode);
    } else {
      setBlocks([]);
    }
  };

  const handleBlockChange = (blockCode: string, isChecked: boolean) => {
    setFormData((prev) => {
      const currentBlockCodes = prev.block_codes;
      if (isChecked) {
        return {
          ...prev,
          block_codes: [...currentBlockCodes, blockCode],
        };
      } else {
        return {
          ...prev,
          block_codes: currentBlockCodes.filter(code => code !== blockCode),
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (formData.block_codes.length === 0) {
        throw new Error('Please select at least one block');
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
        throw new Error(errorData.detail || 'Failed to create surveyor');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: 'Surveyor created successfully!',
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
      console.error('Error creating surveyor:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to create surveyor. Please try again.',
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
    setDistricts([]);
    setBlocks([]);
    setMessage(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Add New Surveyor
        </h2>
        <p className="text-gray-600">
          Create a new surveyor account to conduct village assessments
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="surveyor@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter secure password"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.state_code}
              onChange={handleStateChange}
              required
              disabled={isLoadingStates}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingStates ? 'Loading states...' : 'Select State'}
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
              District <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.district_code}
              onChange={handleDistrictChange}
              required
              disabled={!formData.state_code || isLoadingDistricts}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingDistricts ? 'Loading districts...' : 'Select District'}
              </option>
              {districts.map((district) => (
                <option key={district.district_code} value={district.district_code}>
                  {district.district_name}
                </option>
              ))}
            </select>
            {!formData.state_code && (
              <p className="text-xs text-gray-500 mt-1">
                Please select a state first
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block(s) <span className="text-red-500">*</span>
            </label>
            <div
              className={`border border-gray-300 rounded-lg p-4 min-h-[120px] max-h-[240px] overflow-y-auto ${
                !formData.district_code || isLoadingBlocks
                  ? 'bg-gray-100 cursor-not-allowed'
                  : 'bg-white'
              }`}
            >
              {isLoadingBlocks ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading blocks...
                </div>
              ) : !formData.district_code ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Please select a district first
                </p>
              ) : blocks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No blocks available
                </p>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <label
                      key={block.block_code}
                      className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={block.block_code}
                        checked={formData.block_codes.includes(block.block_code)}
                        onChange={(e) =>
                          handleBlockChange(block.block_code, e.target.checked)
                        }
                        disabled={!formData.district_code || isLoadingBlocks}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {block.block_name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.district_code && blocks.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.block_codes.length} block(s) selected
              </p>
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
                  Creating Surveyor...
                </>
              ) : (
                'Create Surveyor'
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
