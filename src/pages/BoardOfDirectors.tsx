import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Eye, Search, Filter } from 'lucide-react';

interface Director {
  mobile_number: string; // Primary Key
  fpo_id: number; // Foreign Key (references fpo.fpo_id)
  name: string;
  gender: 'male' | 'female' | 'other';
  education_qualification?: string;
  din: string;
  address: string;
}

const BoardOfDirectors: React.FC = () => {
  const [fpoId, setFpoId] = useState<number | null>(null);
  const [fpos, setFpos] = useState<any[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchFPOs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/fpo/approved', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFpos(response.data);
        setFpoId(response.data[0]?.fpo_id || null);
      } catch {
        // toast.error('Failed to fetch FPOs');
      }
    };
    fetchFPOs();
  }, []);

  useEffect(() => {
    if (fpoId) fetchDirectors();
  }, [fpoId]);

  const fetchDirectors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/bod_details/${fpoId}`);
      setDirectors(response.data);
      console.log(response.data);
    } catch (error: any) {
      // toast.error(error.response?.data?.detail || 'Failed to fetch directors');
    } finally {
      setLoading(false);
    }
  };

  const filteredDirectors = directors.filter((director) => {
    const matchesSearch = !searchQuery || director.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = !genderFilter || director.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Board of Directors</h1>
        </div>
        <div className="text-sm text-gray-600">
          Total Directors: <span className="font-semibold text-blue-600">{filteredDirectors.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Search by Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search directors..."
                className="form-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {(searchQuery || genderFilter) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchQuery('');
                setGenderFilter('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Directors Table */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDirectors.map((director) => (
                <tr key={director.mobile_number} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{director.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{director.gender}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{director.din}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedDirector(director);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDirectors.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No directors found</h3>
              <p className="text-gray-600">Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDirector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Director Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">{selectedDirector.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-base font-medium text-gray-900 capitalize">{selectedDirector.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">DIN</p>
                <p className="text-base font-medium text-gray-900">{selectedDirector.din}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Education Qualification</p>
                <p className="text-base font-medium text-gray-900">
                  {selectedDirector.education_qualification || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-base font-medium text-gray-900">{selectedDirector.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mobile Number</p>
                <p className="text-base font-medium text-gray-900">{selectedDirector.mobile_number}</p>
              </div>
            </div>

            <div className="p-4 border-t">
              <button onClick={() => setShowDetailModal(false)} className="btn-secondary w-full">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardOfDirectors;
