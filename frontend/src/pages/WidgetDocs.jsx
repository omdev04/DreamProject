import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FaArrowLeft, FaCode, FaCopy, FaCheckCircle, FaExternalLinkAlt, FaBook, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const WidgetDocs = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Fetch site details to get API key
  useEffect(() => {
    const fetchSiteDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/sites/${siteId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSite(data.data);
        } else {
          toast.error('Failed to load site details');
        }
      } catch (error) {
        toast.error('Error loading site data');
      } finally {
        setLoading(false);
      }
    };
    
    if (siteId) {
      fetchSiteDetails();
    }
  }, [siteId, API_URL]);

  const widgetCode = site?.apiKey 
    ? `<script src="${API_URL}/widget.js" data-api-key="${site.apiKey}"></script>`
    : `<script src="${API_URL}/widget.js" data-api-key="YOUR_API_KEY"></script>`;
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('✓ Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/sites')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Sites
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <FaBook className="text-4xl text-primary-600 dark:text-primary-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Widget Integration Guide</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Add real-time monitoring to your website</p>
            </div>
          </div>
        </div>

        {/* API Key Section - NEW DEDICATED SECTION */}
        {loading ? (
          <div className="card mb-6 text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your API key...</p>
          </div>
        ) : site?.apiKey ? (
          <div className="card mb-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <FaShieldAlt className="text-3xl text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your API Key</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use this key to authenticate your widget</p>
              </div>
            </div>

            {/* API Key Display Box */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-green-300 dark:border-green-700 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  🔑 API Key
                </label>
                <button
                  onClick={() => copyToClipboard(site.apiKey)}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all transform hover:scale-105 shadow-md"
                >
                  {copied ? <FaCheckCircle /> : <FaCopy />}
                  {copied ? 'Copied!' : 'Copy API Key'}
                </button>
              </div>
              
              <div className="bg-gray-900 dark:bg-gray-950 text-green-400 dark:text-green-300 p-4 rounded-lg font-mono text-sm break-all leading-relaxed shadow-inner border border-gray-800 dark:border-gray-700">
                {site.apiKey}
              </div>

              {/* API Key Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {site.apiKeyCreatedAt ? new Date(site.apiKeyCreatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Used</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {site.apiKeyLastUsed ? new Date(site.apiKeyLastUsed).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Security Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-1">Security Warning</h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    Keep this API key <strong>secure and private</strong>. Anyone with this key can check your site's status. 
                    Never share it publicly or commit it to version control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">❌</span>
              <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">API Key Not Found</h3>
              <p className="text-red-700 dark:text-red-400">Unable to load API key. Please contact support.</p>
            </div>
          </div>
        )}

        {/* Quick Start */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaCode className="text-2xl text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Start</h2>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Add this single line of code to your website's <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">& lt;head&gt;</code> section:
          </p>

          <div className="bg-gray-900 dark:bg-gray-950 text-white p-4 rounded-lg relative overflow-x-auto border border-gray-800 dark:border-gray-700">
            <pre className="text-sm"><code>{widgetCode}</code></pre>
            <button
              onClick={() => copyToClipboard(widgetCode)}
              className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1 rounded flex items-center gap-2 text-sm transition-colors"
            >
              {copied ? <FaCheckCircle className="text-green-400" /> : <FaCopy />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>💡 Tip:</strong> Your unique API key is embedded in the code above. Copy and paste this into your website's HTML!
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Features</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-2xl">
                🚫
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Automatic Suspension Page</h3>
                <p className="text-gray-600 dark:text-gray-400">When your site is suspended, visitors see a professional suspension page with payment link.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Payment Warning Banner (Owner Mode Only)</h3>
                <p className="text-gray-600 dark:text-gray-400">Shows a top banner when payment is due, with amount and due date. <strong>Only visible to website owners in Owner Mode</strong> - regular visitors won't see payment warnings.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Real-Time Updates</h3>
                <p className="text-gray-600 dark:text-gray-400">Checks status every 20 seconds. Instant suspend/unsuspend without cache issues.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-2xl">
                🌐
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Universal Compatibility</h3>
                <p className="text-gray-600 dark:text-gray-400">Works with any website: WordPress, React, HTML, PHP, etc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Widget Loads</h3>
                <p className="text-gray-600 dark:text-gray-400">The widget script loads when your website loads.</p>
              </div>
            </div>

              <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Checks Status</h3>
                <p className="text-gray-600 dark:text-gray-400">Makes secure API call using your unique API key to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">/api/public/check-status/[API_KEY]</code></p>
              </div>
            </div>            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Shows Appropriate UI</h3>
                <p className="text-gray-600 dark:text-gray-400">Displays suspension page or payment warning based on status.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Repeats Every 20s</h3>
                <p className="text-gray-600 dark:text-gray-400">Continuously monitors and updates status in real-time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copy & Paste Ready Code */}
        <div className="card mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <FaCode className="text-3xl text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Copy & Paste Ready Code</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your API key is already embedded in these examples!</p>
            </div>
          </div>

          {/* HTML */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">📄</span> Plain HTML
              </h3>
              <button
                onClick={() => copyToClipboard(`<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  
  <!-- Website Monitoring Widget -->
  <script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
</head>
<body>
  <!-- Your website content -->
</body>
</html>`)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-md"
              >
                <FaCopy /> Copy HTML
              </button>
            </div>
            <div className="bg-gray-900 dark:bg-gray-950 text-white p-4 rounded-lg overflow-x-auto relative border border-gray-800 dark:border-gray-700">
              <pre className="text-sm"><code>{`<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
  
  <!-- Website Monitoring Widget -->
  <script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
</head>
<body>
  <!-- Your website content -->
</body>
</html>`}</code></pre>
            </div>
          </div>

          {/* WordPress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🔌</span> WordPress
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add to your theme's <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">header.php</code></p>
              </div>
              <button
                onClick={() => copyToClipboard(`<!-- Website Monitoring Widget -->
<script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
<?php wp_head(); ?>`)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-md"
              >
                <FaCopy /> Copy WordPress
              </button>
            </div>
            <div className="bg-gray-900 dark:bg-gray-950 text-white p-4 rounded-lg overflow-x-auto relative border border-gray-800 dark:border-gray-700">
              <pre className="text-sm"><code>{`<!-- Website Monitoring Widget -->
<script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
<?php wp_head(); ?>`}</code></pre>
            </div>
          </div>

          {/* React */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">⚛️</span> React / Next.js / Vite
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">public/index.html</code> or <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">index.html</code></p>
              </div>
              <button
                onClick={() => copyToClipboard(`<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  
  <!-- Website Monitoring Widget -->
  <script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
  
  <title>React App</title>
</head>`)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-md"
              >
                <FaCopy /> Copy React
              </button>
            </div>
            <div className="bg-gray-900 dark:bg-gray-950 text-white p-4 rounded-lg overflow-x-auto relative border border-gray-800 dark:border-gray-700">
              <pre className="text-sm"><code>{`<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  
  <!-- Website Monitoring Widget -->
  <script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
  
  <title>React App</title>
</head>`}</code></pre>
            </div>
          </div>

          {/* PHP */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🐘</span> PHP
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add to your header template file</p>
              </div>
              <button
                onClick={() => copyToClipboard(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><?php echo $page_title; ?></title>
  
  <!-- Website Monitoring Widget -->
  <script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
</head>
<body>
  <?php include 'header.php'; ?>
</body>
</html>`)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-md"
              >
                <FaCopy /> Copy PHP
              </button>
            </div>
            <div className="bg-gray-900 dark:bg-gray-950 text-white p-4 rounded-lg overflow-x-auto relative border border-gray-800 dark:border-gray-700">
              <pre className="text-sm"><code>{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><?php echo $page_title; ?></title>
  
  <!-- Website Monitoring Widget -->
  <script src="${API_URL}/widget.js" data-api-key="${site?.apiKey || 'YOUR_API_KEY'}"></script>
</head>
<body>
  <?php include 'header.php'; ?>
</body>
</html>`}</code></pre>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-bold text-green-900 dark:text-green-300 mb-1">Ready to Go!</h4>
                <p className="text-sm text-green-800 dark:text-green-400">
                  Just click the "Copy" button above and paste the code into your website. Your API key is already included!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">API Reference</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded font-mono text-sm font-bold">GET</span>
                <code className="text-sm font-mono dark:text-gray-300">/api/public/check-status/:apiKey</code>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">Check site status and payment information using API key authentication.</p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-2">Response Example:</h4>
                <pre className="text-xs overflow-x-auto"><code>{JSON.stringify({
                  success: true,
                  data: {
                    status: "active",
                    reason: null,
                    message: null,
                    paymentDue: true,
                    dueAmount: 5000,
                    dueDate: "2025-10-20T00:00:00.000Z",
                    paymentUrl: `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/payment/${siteId || 'SITE_ID'}`,
                    uptime: 99.5
                  }
                }, null, 2)}</code></pre>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaShieldAlt className="text-2xl text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Privacy</h2>
          </div>
          
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
              <span><strong>Read-Only:</strong> Widget only reads status, cannot modify your site.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
              <span><strong>No Data Collection:</strong> Does not track visitors or collect analytics.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
              <span><strong>Lightweight:</strong> Only ~5KB, does not slow down your website.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
              <span><strong>Graceful Degradation:</strong> If API is down, your website continues to work normally.</span>
            </li>
          </ul>
        </div>

        {/* Testing */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Testing the Widget</h2>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-4">
              <h3 className="font-bold text-yellow-900 dark:text-yellow-300 mb-2">Test Suspension Page:</h3>
              <ol className="list-decimal list-inside space-y-1 text-yellow-900 dark:text-yellow-400 text-sm">
                <li>Install the widget on your website</li>
                <li>Ask admin to suspend your site</li>
                <li>Refresh your website → Should see suspension page</li>
                <li>Ask admin to reactivate → Should see normal site again</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 p-4">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Test Payment Warning (Owner Mode):</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-900 dark:text-blue-400 text-sm">
                <li>Install the widget on your website</li>
                <li><strong>Enable Owner Mode:</strong> Add <code className="bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded">?owner=true</code> to your URL</li>
                <li>Wait for payment due date to approach (or test with demo)</li>
                <li>Should see warning banner at top of your site</li>
                <li>Regular visitors (without <code className="bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded">?owner=true</code>) will NOT see the banner</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Owner Mode */}
        <div className="card mb-6 border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔑</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Owner Mode</h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 border border-purple-200 dark:border-purple-700">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              <strong>Important:</strong> Payment warnings are <strong>only visible to website owners</strong>, not regular visitors. 
              This prevents confusing your customers with payment reminders that don't concern them.
            </p>
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">How to Enable Owner Mode:</h3>
          
          <div className="space-y-3 mb-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Method 1: URL Parameter (Recommended)</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Add <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">?owner=true</code> to your website URL:</p>
              <div className="bg-gray-900 dark:bg-gray-950 text-white p-3 rounded text-sm overflow-x-auto border border-gray-800 dark:border-gray-700">
                <code>https://yourwebsite.com<span className="text-yellow-400">?owner=true</span></code>
              </div>
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">💡 This will save the setting to your browser for future visits</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Method 2: Browser Console</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Open Developer Tools (F12) and run:</p>
              <div className="bg-gray-900 dark:bg-gray-950 text-white p-3 rounded text-sm overflow-x-auto border border-gray-800 dark:border-gray-700">
                <code>localStorage.setItem('widget_owner_mode', 'true')</code>
              </div>
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">Then refresh the page</p>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">How to Disable Owner Mode:</h3>
          
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Method 1: URL Parameter</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Add <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">?owner=false</code> to your URL:</p>
              <div className="bg-gray-900 dark:bg-gray-950 text-white p-3 rounded text-sm overflow-x-auto border border-gray-800 dark:border-gray-700">
                <code>https://yourwebsite.com<span className="text-red-400">?owner=false</span></code>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Method 2: Browser Console</h4>
              <div className="bg-gray-900 dark:bg-gray-950 text-white p-3 rounded text-sm overflow-x-auto border border-gray-800 dark:border-gray-700">
                <code>localStorage.removeItem('widget_owner_mode')</code>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 mt-4">
            <p className="text-yellow-900 dark:text-yellow-300 text-sm">
              <strong>⚠️ Note:</strong> Owner Mode is stored in your browser's localStorage. 
              If you clear your browser data or visit from a different browser/device, you'll need to enable it again.
            </p>
          </div>
        </div>

        {/* Support */}
        <div className="card bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-700 dark:to-purple-700 text-white">
          <h2 className="text-2xl font-bold mb-3">Need Help?</h2>
          <p className="mb-4">
            If you're having trouble integrating the widget or have questions, please contact our support team.
          </p>
          <button
            onClick={() => window.open('mailto:support@yourdomain.com', '_blank')}
            className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex items-center gap-2"
          >
            Contact Support
            <FaExternalLinkAlt />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default WidgetDocs;
