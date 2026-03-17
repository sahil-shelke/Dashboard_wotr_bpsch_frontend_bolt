import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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

interface FormLocationSelectorProps {
  stateCode: string;
  districtCode: string;
  blockCodes: string[];
  onStateChange: (stateCode: string) => void;
  onDistrictChange: (districtCode: string) => void;
  onBlockChange: (blockCode: string, isChecked: boolean) => void;
  showBlockCheckboxes?: boolean;
  required?: boolean;
}

export const FormLocationSelector = ({
  stateCode,
  districtCode,
  blockCodes,
  onStateChange,
  onDistrictChange,
  onBlockChange,
  showBlockCheckboxes = true,
  required = true,
}: FormLocationSelectorProps) => {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (stateCode) {
      fetchDistricts(stateCode);
    } else {
      setDistricts([]);
      setBlocks([]);
    }
  }, [stateCode]);

  useEffect(() => {
    if (districtCode && stateCode) {
      fetchBlocks(stateCode, districtCode);
    } else {
      setBlocks([]);
    }
  }, [districtCode, stateCode]);

  const fetchStates = async () => {
    setIsLoadingStates(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/location/states?language_id=1');

      if (!response.ok) {
        throw new Error('Failed to fetch states');
      }

      const data = await response.json();
      setStates(data);
    } catch (err) {
      console.error('Error fetching states:', err);
      setError('Failed to load states. Please refresh the page.');
    } finally {
      setIsLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateCode: string) => {
    setIsLoadingDistricts(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/location/districts?language_id=1&state_code=${stateCode}`
      );

      if (!response.ok) {
        if (response.status === 422) {
          setDistricts([]);
          return;
        }
        throw new Error('Failed to fetch districts');
      }

      const data = await response.json();
      setDistricts(data);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setError('Failed to load districts. Please try again.');
      setDistricts([]);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  const fetchBlocks = async (stateCode: string, districtCode: string) => {
    setIsLoadingBlocks(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8000/api/location/blocks?language_id=1&state_code=${stateCode}&district_code=${districtCode}`
      );

      if (!response.ok) {
        if (response.status === 422) {
          setBlocks([]);
          return;
        }
        throw new Error('Failed to fetch blocks');
      }

      const data = await response.json();
      setBlocks(data);
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setError('Failed to load blocks. Please try again.');
      setBlocks([]);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={stateCode}
          onChange={(e) => onStateChange(e.target.value)}
          required={required}
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
        {error && error.includes('states') && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          District {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={districtCode}
            onChange={(e) => onDistrictChange(e.target.value)}
            required={required}
            disabled={!stateCode || isLoadingDistricts}
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
          {isLoadingDistricts && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
        {!stateCode && (
          <p className="text-xs text-gray-500 mt-1">
            Please select a state first
          </p>
        )}
        {error && error.includes('districts') && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Block(s) {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className={`border border-gray-300 rounded-lg p-4 min-h-[120px] max-h-[240px] overflow-y-auto ${
            !districtCode || isLoadingBlocks
              ? 'bg-gray-100 cursor-not-allowed'
              : 'bg-white'
          }`}
        >
          {isLoadingBlocks ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading blocks...
            </div>
          ) : !districtCode ? (
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
                    checked={blockCodes.includes(block.block_code)}
                    onChange={(e) => onBlockChange(block.block_code, e.target.checked)}
                    disabled={!districtCode || isLoadingBlocks}
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
        {districtCode && blocks.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {blockCodes.length} block(s) selected
          </p>
        )}
        {error && error.includes('blocks') && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    </>
  );
};
