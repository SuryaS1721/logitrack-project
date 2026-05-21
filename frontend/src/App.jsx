import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages Import
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import OrderListing from './pages/OrderListing';
import CreateOrder from './pages/CreateOrder';
import AdminDashboard from './pages/AdminDashboard';

// Lucide Icons
import { Plane, LogOut, LayoutDashboard, PlusCircle, ClipboardList, Shield } from 'lucide-react';

// Route Guard for logged-in users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>Initializing LogiTrack Session...</p>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Route Guard for admin console
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'Admin' ? children : <Navigate to="/dashboard" replace />;
};

// Route Guard for anonymous-only pages
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return null;
  
  if (isAuthenticated) {
    return user?.role === 'Admin' ? 
      <Navigate to="/admin" replace /> : 
      <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main Navbar Header Component
const AppHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  if (!isAuthenticated) return null;

  return (
    <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-secondary)', padding: '16px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)' }}>
      {/* Brand logo in SVG */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#fff' }}>
        <div style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plane size={20} color="#fff" style={{ transform: 'rotate(-45deg)' }} />
        </div>
        <span>Logi<span className="gradient-text">Track</span></span>
      </Link>

      {/* Navigation Options */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {user?.role === 'Admin' ? (
          <>
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
              <Shield size={16} /> Admin Control
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
              <LayoutDashboard size={16} /> Overview
            </Link>
            <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
              <ClipboardList size={16} /> My Shipments
            </Link>
            <Link to="/orders/new" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
              <PlusCircle size={16} /> Create Order
            </Link>
          </>
        )}
      </nav>

      {/* Profile & Logout Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</span>
          <span style={{ fontSize: '0.7rem', color: user?.role === 'Admin' ? '#fbbf24' : 'var(--color-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {user?.role}
          </span>
        </div>
        <button onClick={logout} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '6px' }}>
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppHeader />
          <main style={{ flex: 1, padding: '30px 5%' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

              {/* Customer Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderListing /></ProtectedRoute>} />
              <Route path="/orders/new" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />

              {/* Admin Protected Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* Root Redirect Hook */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
