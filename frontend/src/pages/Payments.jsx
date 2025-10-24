import { useState, useEffect } from 'react';
import { paymentService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaCheck, FaTimes, FaDownload, FaFileInvoice } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const Payments = () => {
  const { isSuperAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    try {
      const response = await paymentService.getAll(filter === 'all' ? null : filter);
      setPayments(response.data.payments);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    if (!window.confirm('Verify this payment and activate the website?')) return;
    
    try {
      const response = await paymentService.verify(paymentId, 'Verified by admin');
      
      // Show success message based on whether site was reactivated
      if (response.data.siteReactivated) {
        toast.success('✅ Payment verified, bill generated, and website activated!');
      } else {
        toast.success('✅ Payment verified and bill generated successfully');
      }
      
      // Reload payments list
      loadPayments();
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const handleDownloadBill = async (paymentId, invoiceNumber) => {
    try {
      toast.info('🔄 Downloading bill...');
      
      // Get the token
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const BASE_URL = API_URL.replace('/api', '');
      
      // Use fetch API for blob download
      const response = await fetch(`${API_URL}/payments/${paymentId}/download-bill`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download bill');
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create blob link to download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ Bill downloaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to download bill');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'proof_uploaded': return 'badge-info';
      default: return 'badge-warning';
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track all payment invoices</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'proof_uploaded', 'overdue', 'paid'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <div className="card">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">{payment.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">{payment.site_id?.domain}</td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">{payment.customer_id?.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-primary-600 dark:text-primary-400">₹{payment.amount}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusColor(payment.status)}`}>
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        {/* Download Bill Button (for paid payments) */}
                        {payment.status === 'paid' && payment.billUrl && (
                          <button
                            onClick={() => handleDownloadBill(payment._id, payment.invoiceNumber)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            title="Download Bill/Invoice"
                          >
                            <FaDownload size={12} />
                            Bill
                          </button>
                        )}
                        
                        {/* Super Admin Actions */}
                        {isSuperAdmin() && payment.status === 'proof_uploaded' && (
                          <>
                            <button
                              onClick={() => handleVerify(payment._id)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              title="Verify Payment"
                            >
                              <FaCheck size={12} />
                              Verify
                            </button>
                            {payment.proofUrl && (
                              <a
                                href={payment.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                              >
                                View Proof
                              </a>
                            )}
                          </>
                        )}
                        
                        {/* Show "Pending" if no actions available */}
                        {payment.status === 'pending' && !isSuperAdmin() && (
                          <span className="text-gray-400 text-sm">Awaiting payment</span>
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
    </Layout>
  );
};

export default Payments;
