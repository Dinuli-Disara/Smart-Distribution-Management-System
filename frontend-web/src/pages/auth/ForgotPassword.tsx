// frontend-web/src/pages/auth/ForgotPassword.tsx
import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setSuccess(true);
        setEmailSent(true);
      } else {
        setError(response.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "contain",
          backgroundPosition: "right center",
          backgroundColor: "#ffffff",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Blue/Purple Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3EA6]/100 to-[#D20073]/65"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* White Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Logo Section */}
            <div className="pt-8 pb-6 px-8 text-center bg-white">
              <div className="inline-block">
                <img 
                  src="/logo.png" 
                  alt="Dreamron Logo" 
                  className="h-16 w-auto mx-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextSibling instanceof HTMLElement) { 
                      target.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <div style={{ display: 'none' }} className="text-center">
                  <div className="text-3xl font-bold text-blue-900">Dreamron</div>
                  <div className="text-xs text-gray-600 mt-1">A WORLD CLASS YOU</div>
                </div>
              </div>
              
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Reset Your Password
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Enter your email to receive a reset link
              </p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-8">
              {success ? (
                <div className="space-y-4">
                  {/* Success Message */}
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>
                      Reset link sent successfully! Check your email for instructions to reset your password.
                    </span>
                  </div>
                  
                  {/* Additional Info */}
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Didn't receive the email?</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Check your spam or junk folder</li>
                      <li>Verify you entered the correct email address</li>
                      <li>Wait a few minutes and try again</li>
                    </ul>
                  </div>

                  {/* Back to Login Button */}
                  <div className="pt-4">
                    <Link
                      to="/login"
                      className="block w-full text-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="text-sm text-gray-600">
                    Enter the email address associated with your account and we'll send you a link to reset your password.
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>

                  {/* Back to Login Link */}
                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-pink-600 hover:text-pink-700 transition duration-200"
                    >
                      ← Back to Login
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;