import { useState, FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f5c4d] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-center gap-6 mb-4 bg-white px-4 py-2 rounded-lg">
          <img src="/wotr.png" alt="WOTR" className="h-12 object-contain" />
          <div className="w-px h-10 bg-gray-300"></div>
          <img src="/w-cres.png" alt="W-CReS" className="h-12 object-contain" />
        </div>

        <h1 className="text-xl font-semibold text-center mb-6">
          NFPP Dashboard
        </h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@wotr.org.in"
              className="block w-full h-11 px-3 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent placeholder:text-gray-400"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="block w-full h-11 px-3 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent placeholder:text-gray-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
