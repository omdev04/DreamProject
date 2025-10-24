import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import PaymentPage from './pages/PaymentPage';
import AddCustomer from './pages/AddCustomer';
import AddSite from './pages/AddSite';
import SiteMonitoring from './pages/SiteMonitoring';
import WidgetDocs from './pages/WidgetDocs';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">{/*  */}
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/sites" element={
              <PrivateRoute>
                <Sites />
              </PrivateRoute>
            } />
            
            <Route path="/customers" element={
              <PrivateRoute requireSuperAdmin={true}>
                <Customers />
              </PrivateRoute>
            } />
            
            <Route path="/payments" element={
              <PrivateRoute>
                <Payments />
              </PrivateRoute>
            } />
            
            <Route path="/payment/:siteId" element={
              <PrivateRoute requireCustomerAdmin={true}>
                <PaymentPage />
              </PrivateRoute>
            } />
            
            <Route path="/customers/add" element={
              <PrivateRoute requireSuperAdmin={true}>
                <AddCustomer />
              </PrivateRoute>
            } />
            
            <Route path="/sites/add" element={
              <PrivateRoute requireSuperAdmin={true}>
                <AddSite />
              </PrivateRoute>
            } />
            
            <Route path="/sites/:siteId/monitor" element={
              <PrivateRoute>
                <SiteMonitoring />
              </PrivateRoute>
            } />
            
            <Route path="/sites/:siteId/widget-docs" element={
              <PrivateRoute requireSuperAdmin={true}>
                <WidgetDocs />
              </PrivateRoute>
            } />
            
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />
            
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
          
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
