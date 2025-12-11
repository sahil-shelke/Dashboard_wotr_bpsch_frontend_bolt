import { LogIn } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { useAuth } from '../context/AuthContext';

function Login() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.detail || 'An unexpected error occurred');
        return;
      }
      setIsLoggedIn(true);
      navigate('/');
    } catch (error) {
      setErrorMessage('An error occurred during login');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F4C44] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-[#0F4C44]">
          Welcome Back
        </h2>
        <p className="text-center mb-6 text-gray-600">
          Sign in to continue to your account
        </p>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="mobileNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="mobileNumber"
              placeholder="Enter your phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C44] focus:border-transparent text-base sm:text-lg"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C44] focus:border-transparent text-base sm:text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center font-[600] justify-center gap-2 px-4 py-2 bg-[#FFB800] text-[#0F4C44] rounded-md hover:bg-[#E5A600] focus:outline-none focus:ring-2 focus:ring-[#0F4C44] text-base sm:text-lg"
          >
            <LogIn className="h-5 w-5" />
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm sm:text-base text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-[#0F4C44] font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
