import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSignInAlt, FaGlobe, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(credentials);
      toast.success('✅ Login successful!');
      navigate('/dashboard');
    } catch (error) {
      // Show error message
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      setError(errorMessage);
      toast.error('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 py-12 transition-colors duration-200">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 -mt-16">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <FaGlobe className="text-6xl text-white mb-2" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Website Manager</h1>
          <p className="text-blue-100 dark:text-gray-300 text-sm">Website Monitoring & Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Welcome Back</h2>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <FaExclamationCircle className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="label">
                <FaEnvelope className="inline mr-1" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => {
                  setCredentials({ ...credentials, email: e.target.value });
                  setError('');
                }}
                className="input"
                placeholder="admin@company.com"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="label">
                <FaLock className="inline mr-1" />
                Password
              </label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => {
                  setCredentials({ ...credentials, password: e.target.value });
                  setError('');
                }}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaSignInAlt />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-xs mt-4">
          © 2025 Panaglo. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
