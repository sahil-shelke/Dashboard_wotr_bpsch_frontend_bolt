import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';
import wotr from '../assets/wotr.svg'

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={wotr}
                alt="Logo"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const icon = e.currentTarget.nextElementSibling;
                  if (icon) icon.classList.remove('hidden');
                }}
              />
              <Building2 className="h-12 w-12 text-primary-600 hidden" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">FPC Management System</h2>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <div className="space-y-1 mt-2">
              <p><strong>Super Admin:</strong> admin@company.com | password</p>
              <p><strong>Regional Manager:</strong> regional@company.com | password</p>
              <p><strong>Project Manager:</strong> project@company.com | password</p>
              <p><strong>FPC User:</strong> fpc@company.com | password</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;