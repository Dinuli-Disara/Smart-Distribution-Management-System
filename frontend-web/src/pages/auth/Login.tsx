// frontend-web/src/pages/auth/Login.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Define form data type 
interface FormData { 
  username: string; 
  password: string; 
} 

// Define login result type (adjust based on your AuthContext) 
interface LoginResult { 
  success: boolean; 
  message?: string; 
  data?: { 
    role: string; 
  }; 
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<String>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        const role = result.data?.role;
        if (role === 'Owner') {
          navigate('/owner/dashboard');
        } else if (role === 'Clerk') {
          navigate('/clerk/dashboard');
        } else if (role === 'Sales Representative') {
          navigate('/sales/dashboard');
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
                {/* Replace with your actual logo */}
                <img 
                  src="/logo.png" 
                  alt="Dreamron Logo" 
                  className="h-16 w-auto mx-auto"
                  onError={(e) => {
                    // Fallback if logo doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextSibling instanceof HTMLElement) { 
                      target.nextSibling.style.display = 'block';
                    }
                  }}
                />
                {/* Fallback Logo Text */}
                <div style={{ display: 'none' }} className="text-center">
                  <div className="text-3xl font-bold text-blue-900">Dreamron</div>
                  <div className="text-xs text-gray-600 mt-1">A WORLD CLASS YOU</div>
                </div>
              </div>
              
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Manjula Marketing DMS
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Smart Distribution. Smarter Growth.
              </p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-8">
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

                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-gray-900 placeholder-gray-400"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <a href="#" className="text-sm font-medium text-pink-600 hover:text-pink-700 transition duration-200">
                    Forgot Password?
                  </a>
                </div>

                {/* Sign In Button */}
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
              </form>

              {/* Test Credentials */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-3">Test Credentials:</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">Owner</p>
                    <p className="text-gray-600">admin</p>
                    <p className="text-gray-500">admin123</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">Clerk</p>
                    <p className="text-gray-600">clerk</p>
                    <p className="text-gray-500">clerk123</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-semibold text-gray-700">Sales</p>
                    <p className="text-gray-600">salesrep</p>
                    <p className="text-gray-500">sales123</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;