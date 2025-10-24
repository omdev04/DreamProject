import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { siteService, customerService } from '../services/apiService';
import Layout from '../components/Layout';
import { FaGlobe, FaUser, FaDollarSign, FaCalendar, FaFileAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AddSite = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    domain: '',
    name: '',
    description: '',
    paymentAmount: 5000,
    paymentCycleMonths: 3,
    nextPaymentDate: ''
  });

  useEffect(() => {
    loadCustomers();
    
    // Set default next payment date to 3 months from now
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    setFormData(prev => ({
      ...prev,
      nextPaymentDate: threeMonthsFromNow.toISOString().split('T')[0]
    }));
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data.customers);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'paymentAmount' || name === 'paymentCycleMonths' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await siteService.create(formData);
      toast.success('✅ Website added successfully!');
      navigate('/sites');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add website');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Website</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Register a new client website for monitoring and billing</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {/* Website Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaGlobe className="text-primary-600 dark:text-primary-400" />
              Website Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">
                  <FaUser className="inline mr-2" />
                  Customer *
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.company} - {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <FaGlobe className="inline mr-2" />
                  Domain Name *
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Without http:// or https://
                </p>
              </div>

              <div>
                <label className="label">
                  <FaFileAlt className="inline mr-2" />
                  Site Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="e.g., Main Website"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input"
                  rows="2"
                  placeholder="Brief description of the website"
                />
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaDollarSign className="text-primary-600 dark:text-primary-400" />
              Billing Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">
                  <FaDollarSign className="inline mr-2" />
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  name="paymentAmount"
                  value={formData.paymentAmount}
                  onChange={handleChange}
                  className="input"
                  required
                  min="0"
                  step="1"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="label">
                  <FaCalendar className="inline mr-2" />
                  Billing Cycle (Months) *
                </label>
                <select
                  name="paymentCycleMonths"
                  value={formData.paymentCycleMonths}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <FaCalendar className="inline mr-2" />
                  First Payment Due *
                </label>
                <input
                  type="date"
                  name="nextPaymentDate"
                  value={formData.nextPaymentDate}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Billing Summary:</strong> Customer will be charged ₹{formData.paymentAmount} every {formData.paymentCycleMonths} month(s). 
                First payment due on {formData.nextPaymentDate ? new Date(formData.nextPaymentDate).toLocaleDateString() : 'N/A'}.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/sites')}
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
                  Adding...
                </span>
              ) : (
                'Add Website'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddSite;
