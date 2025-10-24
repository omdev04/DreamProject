import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requireSuperAdmin = false, requireCustomerAdmin = false }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" />;
  }

  if (requireSuperAdmin && admin.role !== 'super_admin') {
    return <Navigate to="/dashboard" />;
  }

  if (requireCustomerAdmin && admin.role !== 'customer_admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;
