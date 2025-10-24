import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { siteService, paymentService } from '../services/apiService';
import Layout from '../components/Layout';
import { FaQrcode, FaUpload, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const { siteId } = useParams();
  const [site, setSite] = useState(null);
  const [payment, setPayment] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [siteId]);

  const loadData = async () => {
    try {
      const [siteRes, paymentRes] = await Promise.all([
        siteService.getById(siteId),
        siteService.getPendingPayment(siteId)
      ]);
      setSite(siteRes.data.site);
      setPayment(paymentRes.data.payment);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only JPEG, PNG, and PDF files are allowed');
        return;
      }
      
      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('paymentProof', file);
    formData.append('invoiceNumber', payment.invoiceNumber);

    try {
      await paymentService.uploadProof(payment._id, formData);
      toast.success('Payment proof uploaded successfully!');
      loadData(); // Reload data
      setFile(null);
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setUploading(false);
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

  if (!payment) {
    return (
      <Layout>
        <div className="card text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pending Payments</h2>
          <p className="text-gray-600">Your account is up to date!</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Page</h1>
          <p className="text-gray-600">Complete your payment for {site?.domain}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Invoice Details */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-semibold">{payment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Due:</span>
                <span className="font-semibold text-2xl text-primary-600">₹{payment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-semibold">{new Date(payment.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`badge ${
                  payment.status === 'pending' ? 'badge-warning' :
                  payment.status === 'proof_uploaded' ? 'badge-info' :
                  'badge-success'
                }`}>
                  {payment.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="text-sm">
                  {new Date(payment.periodStart).toLocaleDateString()} - {new Date(payment.periodEnd).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code & Payment Method */}
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaQrcode className="text-primary-600" />
              Payment Method - PhonePe
            </h2>
            
            <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                  <img 
                    src="/phonepe-qr.jpeg" 
                    alt="PhonePe Payment QR Code" 
                    className="w-64 h-64 mx-auto"
                    onError={(e) => {
                      // Fallback if image not found
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}} className="text-center">
                    <FaQrcode className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xs text-red-500">
                      QR Code image not found. Place 'phonepe-qr.png' in frontend/public folder
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-semibold mt-4 flex items-center justify-center gap-2">
                  <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                  Scan with PhonePe to Pay ₹{payment.amount}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-yellow-800 mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                <li>Scan the QR code with your payment app</li>
                <li>Complete the payment</li>
                <li>Upload payment proof below</li>
                <li>Wait for admin verification</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Upload Payment Proof */}
        {(payment.status === 'pending' || payment.status === 'overdue') && (
          <div className="card mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {payment.status === 'overdue' ? '⚠️ Overdue Payment - Upload Proof' : 'Upload Payment Proof'}
            </h2>
            <p className="text-gray-600 mb-4">
              After making the payment, please upload proof (screenshot or receipt)
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  className="input"
                  id="payment-proof-upload"
                />
                {file && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Selected: {file.name}
                  </p>
                )}
              </div>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload />
                    Upload Proof
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Accepted formats: JPG, PNG, PDF (Max 5MB)
            </p>
          </div>
        )}

        {payment.status === 'proof_uploaded' && (
          <>
            <div className="card mt-6 bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-2xl text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-1">Payment Proof Uploaded ✓</h3>
                  <p className="text-blue-700 text-sm">
                    Your payment proof has been submitted and is awaiting verification by our admin team.
                    You will be notified once it's verified.
                  </p>
                  {payment.proofUploadedAt && (
                    <p className="text-xs text-blue-600 mt-2">
                      Uploaded on: {new Date(payment.proofUploadedAt).toLocaleString()}
                    </p>
                  )}
                  {payment.proofUrl && (
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                    >
                      View Uploaded Proof
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Allow re-upload */}
            <div className="card mt-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Update Payment Proof</h3>
              <p className="text-gray-600 text-sm mb-4">
                Need to upload a different proof? You can replace the previous one here.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    className="input"
                  />
                  {file && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Selected: {file.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Re-upload Proof
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Accepted formats: JPG, PNG, PDF (Max 5MB)
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PaymentPage;
