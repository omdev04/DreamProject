import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { siteService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaPlus, FaEye, FaCreditCard, FaBan, FaCheckCircle, FaTrash, FaTimes, FaCode, FaTools, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Sites = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadSites();
    
    // Auto-refresh every 30 seconds for real-time status updates
    const interval = setInterval(() => {
      loadSites();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadSites = async () => {
    try {
      const response = await siteService.getAll();
      setSites(response.data.sites);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (siteId, domain) => {
    if (!window.confirm(`⚠️ Suspend ${domain}?\n\nThis will make the website inaccessible until reactivated.`)) return;

    try {
      // Use 'manual' as the reason - it's a valid enum value
      await siteService.suspend(siteId, 'manual');
      toast.success(`🚫 ${domain} suspended successfully`);
      loadSites();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to suspend website';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const handleReactivate = async (siteId, domain) => {
    if (!window.confirm(`✅ Reactivate ${domain}?\n\nThis will restore website access immediately.`)) return;

    try {
      await siteService.reactivate(siteId);
      toast.success(`✅ ${domain} reactivated successfully`);
      loadSites();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to reactivate website';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const handleMaintenanceToggle = async (siteId, enable) => {
    const action = enable ? 'enable' : 'disable';
    const message = enable 
      ? '🔧 Enable maintenance mode?\n\nVisitors will see a maintenance page.'
      : '✅ Disable maintenance mode?\n\nWebsite will be accessible again.';
    
    if (!window.confirm(message)) return;

    try {
      const endpoint = `/api/sites/${siteId}/maintenance/${action}`;
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} maintenance mode`);
      }

      toast.success(`${enable ? '🔧' : '✅'} Maintenance mode ${enable ? 'enabled' : 'disabled'} successfully`);
      loadSites();
    } catch (error) {
      toast.error(`❌ Failed to ${action} maintenance mode`);
    }
  };

  const handleDelete = async (siteId, domain) => {
    if (!window.confirm(`⚠️ Delete website "${domain}"?\n\nThis action cannot be undone. All associated data including uptime history and payments will be deleted.`)) {
      return;
    }

    try {
      await siteService.delete(siteId);
      toast.success(`✅ Website "${domain}" deleted successfully`);
      loadSites();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete website';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  const handlePayToReactivate = async (siteId) => {
    try {
      const response = await siteService.createReactivationPayment(siteId);
      toast.success('Reactivation payment created. Please upload payment proof.');
      navigate(`/payment/${siteId}`);
    } catch (error) {
      if (error.response?.data?.data?.payment) {
        // Payment already exists, go to payment page
        navigate(`/payment/${siteId}`);
      } else {
        toast.error('Failed to create reactivation payment');
      }
    }
  };

  const handleViewDetails = async (siteId) => {
    try {
      const response = await siteService.getById(siteId);
      setSelectedSite(response.data.site);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load site details');
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSite(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'suspended': return 'badge-danger';
      case 'inactive': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Websites</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all client websites</p>
        </div>
        {isSuperAdmin() && (
          <Link to="/sites/add" className="btn btn-primary flex items-center gap-2">
            <FaPlus />
            Add Website
          </Link>
        )}
      </div>

      <div className="card">
        {sites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No websites found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Uptime</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Next Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sites.map((site) => (
                  <tr key={site._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <button
                          onClick={() => navigate(`/sites/${site._id}/monitor`)}
                          className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:underline text-left transition-colors"
                        >
                          {site.domain}
                        </button>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{site.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm dark:text-gray-300">{site.customer_id?.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${getStatusColor(site.status)}`}>
                          {site.status}
                        </span>
                        {site.maintenanceMode && (
                          <span className="badge bg-yellow-100 text-yellow-800">
                            🔧 Maintenance
                          </span>
                        )}
                        {site.isCurrentlyDown && (
                          <span className="ml-2 text-xs text-red-600">⚠️ Down</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${getUptimeColor(site.currentUptime)}`}>
                        {site.currentUptime?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(site.nextPaymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        {/* Monitoring Button */}
                        <button 
                          onClick={() => navigate(`/sites/${site._id}/monitor`)}
                          className="text-green-600 hover:text-green-800" 
                          title="View Monitoring"
                        >
                          <FaChartLine />
                        </button>
                        
                        {/* Widget Integration - Only for Super Admin */}
                        {isSuperAdmin() && (
                          <button 
                            onClick={() => navigate(`/sites/${site._id}/widget-docs`)}
                            className="text-purple-600 hover:text-purple-800" 
                            title="Widget Integration"
                          >
                            <FaCode />
                          </button>
                        )}
                        
                        {/* Customer Actions */}
                        {!isSuperAdmin() && (
                          <>
                            {site.status === 'suspended' ? (
                              <button
                                onClick={() => handlePayToReactivate(site._id)}
                                className="btn-sm bg-orange-500 text-white hover:bg-orange-600"
                                title="Pay to Reactivate"
                              >
                                Pay to Reactivate
                              </button>
                            ) : (
                              <Link 
                                to={`/payment/${site._id}`}
                                className="text-green-600 hover:text-green-800"
                                title="Payment"
                              >
                                <FaCreditCard />
                              </Link>
                            )}
                          </>
                        )}
                        
                        {/* Super Admin Actions */}
                        {isSuperAdmin() && (
                          <>
                            {site.status === 'suspended' ? (
                              <button
                                onClick={() => handleReactivate(site._id, site.domain)}
                                className="text-green-600 hover:text-green-800 text-lg"
                                title="Reactivate Site"
                              >
                                <FaCheckCircle />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(site._id, site.domain)}
                                className="text-red-600 hover:text-red-800 text-lg"
                                title="Suspend Site"
                              >
                                <FaBan />
                              </button>
                            )}
                            {/* Maintenance Mode Toggle */}
                            {site.maintenanceMode ? (
                              <button
                                onClick={() => handleMaintenanceToggle(site._id, false)}
                                className="text-green-600 hover:text-green-800 text-lg"
                                title="Disable Maintenance Mode"
                              >
                                <FaCheckCircle />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMaintenanceToggle(site._id, true)}
                                className="text-yellow-600 hover:text-yellow-800 text-lg"
                                title="Enable Maintenance Mode"
                              >
                                <FaTools />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(site._id, site.domain)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Website"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Site Details Modal */}
      {showDetailsModal && selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Website Details</h2>
              <button
                onClick={closeDetailsModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Basic Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">🌐</span> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Website Name</p>
                    <p className="font-semibold text-gray-900">{selectedSite.name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Domain</p>
                    <p className="font-semibold text-gray-900">{selectedSite.domain}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">URL</p>
                    <a 
                      href={selectedSite.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {selectedSite.url}
                    </a>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`badge ${getStatusColor(selectedSite.status)}`}>
                      {selectedSite.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">👤</span> Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedSite.customer_id?.name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Email</p>
                    <a 
                      href={`mailto:${selectedSite.customer_id?.email}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {selectedSite.customer_id?.email}
                    </a>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Phone</p>
                    <a 
                      href={`tel:${selectedSite.customer_id?.phone}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {selectedSite.customer_id?.phone}
                    </a>
                  </div>
                  {selectedSite.customer_id?.company && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-semibold text-gray-900">{selectedSite.customer_id?.company}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">📊</span> Performance & Monitoring
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Current Uptime</p>
                    <p className={`text-2xl font-bold ${getUptimeColor(selectedSite.currentUptime)}`}>
                      {selectedSite.currentUptime?.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Website Status</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedSite.isCurrentlyDown ? (
                        <span className="text-red-600">🔴 Down</span>
                      ) : (
                        <span className="text-green-600">🟢 Online</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Active Since</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(selectedSite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">💳</span> Billing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-600">Payment Amount</p>
                    <p className="text-2xl font-bold text-gray-900">₹{selectedSite.paymentAmount?.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-600">Payment Cycle</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedSite.paymentCycleMonths} Months</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Next Payment Due</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedSite.nextPaymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Is Active</p>
                    <p className="font-semibold">
                      {selectedSite.isActive ? (
                        <span className="text-green-600">✅ Yes</span>
                      ) : (
                        <span className="text-red-600">❌ No</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suspension Info (if suspended) */}
              {selectedSite.status === 'suspended' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-red-600">⚠️</span> Suspension Details
                  </h3>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Suspension Reason</p>
                        <p className="font-semibold text-red-700 capitalize">
                          {selectedSite.suspensionReason || 'N/A'}
                        </p>
                      </div>
                      {selectedSite.suspendedAt && (
                        <div>
                          <p className="text-sm text-gray-600">Suspended At</p>
                          <p className="font-semibold text-red-700">
                            {new Date(selectedSite.suspendedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={closeDetailsModal}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                {isSuperAdmin() && (
                  <>
                    {selectedSite.status === 'suspended' ? (
                      <button
                        onClick={() => {
                          closeDetailsModal();
                          handleReactivate(selectedSite._id, selectedSite.domain);
                        }}
                        className="btn bg-green-600 text-white hover:bg-green-700"
                      >
                        <FaCheckCircle className="inline mr-2" />
                        Reactivate Site
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          closeDetailsModal();
                          handleSuspend(selectedSite._id, selectedSite.domain);
                        }}
                        className="btn bg-red-600 text-white hover:bg-red-700"
                      >
                        <FaBan className="inline mr-2" />
                        Suspend Site
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Sites;
