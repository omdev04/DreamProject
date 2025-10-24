import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../services/apiService';
import Layout from '../components/Layout';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaCalendar, FaGlobe } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [customerSites, setCustomerSites] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data.customers);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId, customerName) => {
    if (!window.confirm(`⚠️ Delete customer "${customerName}"?\n\nThis action cannot be undone. All associated websites and payments will also be deleted.`)) {
      return;
    }

    try {
      await customerService.delete(customerId);
      toast.success(`✅ Customer "${customerName}" deleted successfully`);
      loadCustomers();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete customer';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const handleViewDetails = async (customer) => {
    try {
      setSelectedCustomer(customer);
      // Fetch customer's sites
      const response = await customerService.getById(customer._id);
      setCustomerSites(response.data.customer.sites || []);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load customer details');
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCustomer(null);
    setCustomerSites([]);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all customers</p>
        </div>
        <Link to="/customers/add" className="btn btn-primary flex items-center gap-2">
          <FaPlus />
          Add Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div 
            key={customer._id} 
            className="card hover:shadow-lg transition-all cursor-pointer hover:scale-105"
            onClick={() => handleViewDetails(customer)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{customer.name}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(customer._id, customer.name);
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors p-1 z-10"
                title="Delete Customer"
              >
                <FaTrash size={16} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <FaEnvelope className="text-primary-600 dark:text-primary-400" />
                <span className="truncate">{customer.email}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <FaPhone className="text-primary-600 dark:text-primary-400" />
                {customer.phone}
              </p>
              {customer.company && (
                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <FaBuilding className="text-primary-600 dark:text-primary-400" />
                  <span className="truncate">{customer.company}</span>
                </p>
              )}
              <div className="pt-2 flex justify-between items-center">
                <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {customer.status}
                </span>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Click to view details →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customer Details</p>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">📞</span> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email Address</p>
                    <a 
                      href={`mailto:${selectedCustomer.email}`}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedCustomer.email}
                    </a>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone Number</p>
                    <a 
                      href={`tel:${selectedCustomer.phone}`}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedCustomer.phone}
                    </a>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                    <span className={`badge ${selectedCustomer.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">🏢</span> Company Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {selectedCustomer.company && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Company Name</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCustomer.company}</p>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-red-500 dark:text-red-400" />
                        <strong>Business Address</strong>
                      </p>
                      {typeof selectedCustomer.address === 'string' ? (
                        <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{selectedCustomer.address}</p>
                      ) : (
                        <div className="text-gray-900 dark:text-gray-100 leading-relaxed">
                          {selectedCustomer.address.street && <p>{selectedCustomer.address.street}</p>}
                          <p>
                            {selectedCustomer.address.city && `${selectedCustomer.address.city}, `}
                            {selectedCustomer.address.state && `${selectedCustomer.address.state} `}
                            {selectedCustomer.address.zipCode && selectedCustomer.address.zipCode}
                          </p>
                          {selectedCustomer.address.country && <p>{selectedCustomer.address.country}</p>}
                        </div>
                      )}
                    </div>
                  )}
                  {!selectedCustomer.company && !selectedCustomer.address && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                      <p className="text-gray-500 dark:text-gray-400">No company information available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Websites */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">🌐</span> Managed Websites
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({customerSites.length})</span>
                </h3>
                {customerSites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customerSites.map((site) => (
                      <div key={site._id} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FaGlobe className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <h4 className="font-semibold text-gray-900 dark:text-white">{site.name}</h4>
                          </div>
                          <span className={`badge ${
                            site.status === 'active' ? 'badge-success' : 
                            site.status === 'suspended' ? 'badge-error' : 'badge-warning'
                          }`}>
                            {site.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{site.domain}</p>
                        <a 
                          href={site.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit Site →
                        </a>
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>Uptime: <strong className={site.currentUptime >= 99 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>{site.currentUptime?.toFixed(2)}%</strong></span>
                          <span>₹{site.paymentAmount}/{site.paymentCycleMonths}mo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                    <p className="text-gray-500 dark:text-gray-400">No websites registered for this customer</p>
                  </div>
                )}
              </div>

              {/* Account Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">📅</span> Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer Since</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(selectedCustomer.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={closeDetailsModal}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <Link 
                  to={`/sites/add?customer=${selectedCustomer._id}`}
                  className="btn bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600"
                  onClick={closeDetailsModal}
                >
                  <FaPlus className="inline mr-2" />
                  Add Website
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Customers;
