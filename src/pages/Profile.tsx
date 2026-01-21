import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

interface UserData {
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
}

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/current-user');
      setUserData(response.data.userdata);
    } catch (error) {
      toast.error('Failed to load user data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setIsUpdating(true);
      await axios.put('/api/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });

      toast.success('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-full p-3">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">User Profile</h1>
              <p className="text-blue-100 text-sm">View and manage your account</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                  {userData?.first_name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                  {userData?.last_name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                  {userData?.email || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                  {userData?.phone_number || 'N/A'}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Old Password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter old password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isUpdating ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setOldPassword('');
                        setNewPassword('');
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-gray-600 text-sm">
                  Click the Edit button to change your password
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
