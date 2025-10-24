import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/apiService';
import Layout from '../components/Layout';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaKey } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AddCustomer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await customerService.create(formData);
      toast.success('✅ Customer created successfully!');
      navigate('/customers');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Customer</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create a new customer account with admin access</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {/* Customer Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaBuilding className="text-primary-600 dark:text-primary-400" />
              Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <FaBuilding className="inline mr-2" />
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="e.g., Tech Solutions Inc."
                />
              </div>

              <div>
                <label className="label">
                  <FaUser className="inline mr-2" />
                  Contact Person *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label className="label">
                  <FaEnvelope className="inline mr-2" />
                  Company Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label className="label">
                  <FaPhone className="inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="+1-234-567-8900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">
                  <FaMapMarkerAlt className="inline mr-2" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input"
                  rows="2"
                  placeholder="123 Business Street, City, State, ZIP"
                />
              </div>
            </div>
          </div>

          {/* Admin Account Information */}
          <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaKey className="text-primary-600 dark:text-primary-400" />
              Admin Account Setup
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Automatic Admin Account Creation
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                    When you create a customer, an admin account will be <strong>automatically created</strong> with the customer's email address. A secure random password will be generated and sent to their email inbox.
                  </p>
                  <div className="mt-3 text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <p>✓ Admin Email: Same as company email</p>
                    <p>✓ Admin Name: Same as contact person</p>
                    <p>✓ Password: Auto-generated and emailed securely</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </span>
              ) : (
                'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddCustomer;
