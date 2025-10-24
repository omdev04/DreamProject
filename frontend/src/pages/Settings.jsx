import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaLock, FaEye, FaEyeSlash, FaUserCircle, FaUser, FaEnvelope, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Settings = () => {
  const { admin, login } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: admin?.name || '',
    email: admin?.email || ''
  });
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!profile.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!profile.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setProfileLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the admin context with new data
        const updatedAdmin = { ...admin, name: profile.name, email: profile.email };
        localStorage.setItem('admin', JSON.stringify(updatedAdmin));
        
        toast.success('✅ Profile updated successfully!');
        
        // Reload the page to update auth context
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('✅ Password changed successfully!');
        // Reset form
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Profile Info Card */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FaUserCircle className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your account details</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input pl-10"
                  placeholder="Enter your full name"
                  required
                />
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="input pl-10"
                  placeholder="Enter your email"
                  required
                />
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Role Display */}
            <div>
              <label className="label">Role</label>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {admin?.role === 'super_admin' ? '🔑 Super Admin' : '👤 Customer Admin'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={profileLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                {profileLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Changes
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setProfile({ name: admin?.name || '', email: admin?.email || '' })}
                className="btn btn-secondary"
                disabled={profileLoading}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <FaLock className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Update your password to keep your account secure</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="label">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="input pr-10"
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="label">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="input pr-10"
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="input pr-10"
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Password Requirements:</p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Minimum 6 characters long</li>
                <li>• Use a strong and unique password</li>
                <li>• Don't share your password with anyone</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaLock />
                    Change Password
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
