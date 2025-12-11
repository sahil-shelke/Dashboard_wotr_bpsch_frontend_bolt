import { CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

function VerifyOTP() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setErrorMessage(result.detail || 'Invalid OTP or mobile number.');
        } else if (response.status === 404) {
          setErrorMessage("User  with this mobile number doesn't exist.");
        } else if (response.status === 500) {
          setErrorMessage('Server error. Please try again later.');
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
        return;
      }

      alert('OTP validation successful');
      navigate('/login');
    } catch (error) {
      setErrorMessage('An error occurred during verification.');
      console.error('Verification Error:', error);
    }
  };

  const handleResendOtp = () => {
    console.log('Resending OTP...');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F4C44] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-[#0F4C44]">
          Verify OTP
        </h2>
        <p className="text-center mb-6 text-gray-600">
          Enter the OTP sent to your phone
        </p>

        <form onSubmit={handleVerify}>
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
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C44] focus:border-transparent text-center text-xl sm:text-2xl tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FFB800] text-[#0F4C44] font-[600] rounded-md hover:bg-[#E5A600] focus:outline-none focus:ring-2 focus:ring-[#0F4C44] focus:ring-offset-2 text-base sm:text-lg"
          >
            <CheckCircle className="h-5 w-5" />
            Verify OTP
          </button>
        </form>

        <p className="mt-4 text-center text-sm sm:text-base text-gray-600">
          Didn't receive the code?{' '}
          <button
            onClick={handleResendOtp}
            className="text-[#0F4C44] font-semibold hover:underline"
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;
