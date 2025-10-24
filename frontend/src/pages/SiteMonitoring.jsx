import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { siteService } from '../services/apiService';
import Layout from '../components/Layout';
import { FaArrowLeft, FaGlobe, FaCheckCircle, FaTimesCircle, FaClock, FaChartLine, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const SiteMonitoring = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [uptimeLogs, setUptimeLogs] = useState([]);
  const [stats, setStats] = useState({
    uptime24h: 0,
    uptime7d: 0,
    uptime30d: 0,
    avgResponseTime: 0,
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!siteId) {
      toast.error('Invalid site ID');
      navigate('/sites');
      return;
    }

    loadData();
    
    const interval = setInterval(() => {
      if (mountedRef.current) {
        loadData(false);
      }
    }, 15000);
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [siteId, timeRange]);

  const loadData = async (showToast = false) => {
    try {
      const [siteRes, logsRes] = await Promise.all([
        api.get(`/sites/${siteId}`),
        api.get(`/sites/${siteId}/uptime?hours=${getHours()}`)
      ]);

      if (!mountedRef.current) return;

      // Backend returns: { success: true, message: '...', data: site_object }
      // So siteData is directly in response.data
      const siteData = siteRes.data;
      if (!siteData || typeof siteData !== 'object') {
        throw new Error('Invalid site data received');
      }

      // Extract uptime logs - could be in data.uptimeLogs or data.data.uptimeLogs
      const logs = logsRes.data?.uptimeLogs || logsRes.data?.data?.uptimeLogs || [];

      setSite(siteData);
      setUptimeLogs(logs);
      calculateStats(logs);
      setLastUpdate(new Date());

      if (showToast) {
        toast.success('✓ Data refreshed successfully');
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      if (error.response?.status === 404) {
        toast.error('Site not found');
        navigate('/sites');
      } else if (showToast) {
        toast.error('Failed to load monitoring data');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const getHours = () => {
    return timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  const handleCheckNow = async () => {
    try {
      setRefreshing(true);
      toast.info('⏳ Checking website status...');
      await api.post(`/sites/${siteId}/check-now`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadData();
      toast.success('✓ Check completed successfully!');
    } catch (error) {
      toast.error('Failed to check website status');
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = (logs) => {
    if (!logs || logs.length === 0) {
      setStats({
        uptime24h: 0,
        uptime7d: 0,
        uptime30d: 0,
        avgResponseTime: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0
      });
      return;
    }

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const logs24h = logs.filter(log => new Date(log.checkedAt) >= oneDayAgo);
    const logs7d = logs.filter(log => new Date(log.checkedAt) >= sevenDaysAgo);
    const logs30d = logs.filter(log => new Date(log.checkedAt) >= thirtyDaysAgo);

    const calcUptime = (logSet) => {
      if (logSet.length === 0) return 0;
      const upLogs = logSet.filter(log => log.status === 'up');
      return (upLogs.length / logSet.length) * 100;
    };

    const successfulLogs = logs.filter(log => log.status === 'up');
    const avgResponse = successfulLogs.length > 0
      ? successfulLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / successfulLogs.length
      : 0;

    setStats({
      uptime24h: calcUptime(logs24h),
      uptime7d: calcUptime(logs7d),
      uptime30d: calcUptime(logs30d),
      avgResponseTime: Math.round(avgResponse),
      totalChecks: logs.length,
      successfulChecks: logs.filter(log => log.status === 'up').length,
      failedChecks: logs.filter(log => log.status === 'down').length
    });
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBarColor = (status) => {
    return status === 'up' ? 'bg-green-500' : 'bg-red-500';
  };

  // Group logs by day for visualization
  const groupLogsByPeriod = () => {
    const grouped = {};
    const periods = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    
    uptimeLogs.forEach(log => {
      const date = new Date(log.checkedAt);
      let key;
      
      if (timeRange === '24h') {
        key = date.getHours();
      } else if (timeRange === '7d') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (!grouped[key]) {
        grouped[key] = { up: 0, down: 0, total: 0 };
      }
      grouped[key].total++;
      if (log.status === 'up') {
        grouped[key].up++;
      } else {
        grouped[key].down++;
      }
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      </Layout>
    );
  }

  if (!site) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Site not found</p>
        </div>
      </Layout>
    );
  }

  const groupedLogs = groupLogsByPeriod();

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/sites')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <FaArrowLeft />
          Back to Sites
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${site.isCurrentlyDown ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FaGlobe className="text-primary-600 dark:text-primary-400" />
                {site.domain}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{site.url}</p>
            </div>
          </div>
          
          <div className="text-right">
            <span className={`text-4xl font-bold ${getUptimeColor(site.currentUptime)}`}>
              {site.currentUptime?.toFixed(2)}%
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall Uptime</p>
          </div>
        </div>
      </div>

      {/* Time Range Selector and Check Now Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleCheckNow}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaClock />
            Check Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FaCheckCircle className="text-green-600 dark:text-green-400 text-2xl" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">24h Uptime</h3>
          </div>
          <p className={`text-3xl font-bold ${getUptimeColor(stats.uptime24h)}`}>
            {stats.uptime24h.toFixed(2)}%
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FaChartLine className="text-blue-600 dark:text-blue-400 text-2xl" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">7d Uptime</h3>
          </div>
          <p className={`text-3xl font-bold ${getUptimeColor(stats.uptime7d)}`}>
            {stats.uptime7d.toFixed(2)}%
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FaClock className="text-purple-600 dark:text-purple-400 text-2xl" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.avgResponseTime}ms
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FaTimesCircle className="text-red-600 dark:text-red-400 text-2xl" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Checks</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {stats.failedChecks}
          </p>
        </div>
      </div>

      {/* Uptime Status Bar (Uptime Kuma style) */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaChartLine className="text-primary-600 dark:text-primary-400" />
          Uptime History - {timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
        </h3>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex gap-1 flex-wrap">
            {uptimeLogs.slice().reverse().map((log, index) => (
              <div
                key={index}
                className={`w-2 h-12 ${getStatusBarColor(log.status)} rounded-sm hover:opacity-75 transition-opacity cursor-pointer`}
                title={`${new Date(log.checkedAt).toLocaleString()}\nStatus: ${log.status.toUpperCase()}\nResponse: ${log.responseTime || 'N/A'}ms`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>{timeRange === '24h' ? '24 hours ago' : timeRange === '7d' ? '7 days ago' : '30 days ago'}</span>
            <span>Now</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Operational ({stats.successfulChecks} checks)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Down ({stats.failedChecks} checks)</span>
          </div>
        </div>
      </div>

      {/* Recent Checks */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Status Checks</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Response Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {uptimeLogs.slice(0, 20).map((log, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {new Date(log.checkedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.status === 'up' ? (
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <FaCheckCircle />
                        Operational
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <FaTimesCircle />
                        Down
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {log.responseTime ? `${log.responseTime}ms` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {log.statusCode || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default SiteMonitoring;
