import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface BOD {
  mobile_number: string;
  fpo_id: number;
  name: string;
  gender: 'm' | 'f';
  education_qualification: string;
  din: string;
  address: string;
}

interface BODEditTabProps {
  fpoId: number;
}

const BODEditTab: React.FC<BODEditTabProps> = ({ fpoId }) => {
  const [bods, setBods] = useState<BOD[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBODs();
  }, [fpoId]);

  const fetchBODs = async () => {
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/bod_details/${fpoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBods(response.data || []);
      console.log(response.data)
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch BOD members');
      }
      setBods([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="ml-3 text-gray-600">Loading BOD members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Board of Directors
        </h3>
        <span className="text-sm text-gray-500">{bods.length} members</span>
      </div>

      {bods.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Shield className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p>No BOD members found for this FPC</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bods.map((bod) => (
            <div key={bod.mobile_number} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900 text-lg">BOD Member Information</h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {bod.gender === 'm' ? 'Male' : 'Female'}
                  </span>
                  <span className="font-medium text-gray-900">{bod.name}</span>
                </div>
                <div className="text-sm text-gray-600 pl-3 space-y-1">
                  <p><span className="font-medium">Mobile:</span> {bod.mobile_number}</p>
                  <p><span className="font-medium">Education:</span> {bod.education_qualification}</p>
                  <p><span className="font-medium">DIN:</span> {bod.din}</p>
                  <p><span className="font-medium">Address:</span> {bod.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BODEditTab;
