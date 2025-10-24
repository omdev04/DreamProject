import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/apiService';
import Layout from '../components/Layout';
import { FaGlobe, FaExclamationTriangle, FaCheckCircle, FaDollarSign } from 'react-icons/fa';

const Dashboard = () => {
  const { admin, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds to show real-time updates
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getUpcomingPayments()
      ]);
      setStats(statsRes.data);
      setUpcomingPayments(paymentsRes.data.payments);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
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
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Welcome back, {admin?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
          {isSuperAdmin() ? 'Super Admin Dashboard' : 'Customer Dashboard'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">Total Sites</p>
              <p className="text-2xl font-bold mt-1">{stats?.sites?.total || 0}</p>
            </div>
            <FaGlobe className="stat-icon" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs">Active Sites</p>
              <p className="text-2xl font-bold mt-1">{stats?.sites?.active || 0}</p>
            </div>
            <FaCheckCircle className="stat-icon" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs">Down Sites</p>
              <p className="text-2xl font-bold mt-1">{stats?.sites?.down || 0}</p>
            </div>
            <FaExclamationTriangle className="stat-icon" />
          </div>
        </div>

        {isSuperAdmin() && (
          <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs">Monthly Revenue</p>
                <p className="text-2xl font-bold mt-1">₹{stats?.billing?.monthlyRevenue || 0}</p>
              </div>
              <FaDollarSign className="stat-icon" />
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Payments */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Upcoming Payments</h2>
        {upcomingPayments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No upcoming payments</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invoice</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Site</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingPayments.map((payment) => (
                  <tr key={payment._id} className="table-row">
                    <td className="px-3 py-2 text-xs dark:text-gray-300">{payment.invoiceNumber}</td>
                    <td className="px-3 py-2 text-xs dark:text-gray-300">{payment.site_id?.domain}</td>
                    <td className="px-3 py-2 text-xs font-medium dark:text-gray-200">₹{payment.amount}</td>
                    <td className="px-3 py-2 text-xs dark:text-gray-300">
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className="badge badge-warning">{payment.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link to="/sites" className="btn btn-primary">
          Manage Sites
        </Link>
        <Link to="/payments" className="btn btn-outline">
          View Payments
        </Link>
      </div>
    </Layout>
  );
};

export default Dashboard;
