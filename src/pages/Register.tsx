import { UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';

function Register() {
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
   const [language, setLanguage] = useState('en');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, mobileNumber,language, password }),
      });

      if (!response.ok) {
        const result = await response.json();
        handleErrorResponse(result, response.status);
        return;
      }

      navigate('/verify-otp');
    } catch (error) {
      setErrorMessage(
        'An error occurred during registration. Please try again.',
      );
      console.error('Registration error:', error);
    }
  };

  const handleErrorResponse = (result: Error, status: number) => {
    let message = 'An unexpected error occurred.';

    // if (status === 400) {
    //   message = result.detail || "Invalid input. Please check your details.";
    //   if (result.detail === "User  with these details already exist") {
    //     message = "A user with this username or phone number already exists.";
    //   } else if (result.detail === "Error sending otp") {
    //     message = "There was an error sending the OTP. Please try again.";
    //   }
    // } else if (status === 500) {
    //   message =
    //     result.detail || "A server error occurred. Please try again later.";
    // }
    console.log(status);

    message = result.message;

    setErrorMessage(message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F4C44] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-[#0F4C44]">
          Create Account
        </h2>
        <p className="text-center mb-6 text-gray-600">
          Sign up for an account to get started
        </p>

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C44] focus:border-transparent text-base sm:text-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

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

           <div className="mb-4">
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C44] focus:border-transparent text-base sm:text-lg"
            >
              <option value="en">English</option>
              <option value="mr">Marathi</option>
            </select>
          </div>

          <div className="mb-4">
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
            <p className="text-red -500 text-sm mb-4">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FFB800] text-[#0F4C44] font-[600] rounded-md hover:bg-[#E5A600] focus:outline-none focus:ring-2 focus:ring-[#0F4C44] text-base sm:text-lg"
          >
            <UserPlus className="h-5 w-5" />
            Create Account
          </button>
        </form>

        <p className="mt-4 text-center text-sm sm:text-base text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#0F4C44] font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
