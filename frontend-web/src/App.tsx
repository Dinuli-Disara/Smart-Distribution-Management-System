// frontend-web/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import OwnerDashboard from './pages/owner/Dashboard';
import {ClerkDashboard} from './pages/clerk/ClerkDashboard';
import { SalesRepDashboard } from './pages/salesRep/Dashboard';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes - Owner */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Clerk */}
          <Route
            path="/clerk/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Clerk']}>
                <ClerkDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Sales Representative */}
          <Route
            path="/sales/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Sales Representative']}>
                <SalesRepDashboard onNavigate={function (view: string): void {
                  throw new Error('Function not implemented.');
                } } />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;