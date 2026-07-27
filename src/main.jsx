import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AdminProvider, useAdmin } from './adminAuth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Auth from './pages/Auth';
import Bookings from './pages/Bookings';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

// Gate user screens behind the user session; bounce guests to /login.
function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// User-facing layout: shared Navbar + the matched page. Admin routes opt out.
const UserLayout = () => (<><Navbar /><Outlet /></>);

// Gate admin screens behind the separate admin session.
function AdminRoute({ children }) {
  const { admin, ready } = useAdmin();
  if (!ready) return <div className="spinner" />;
  return admin ? children : <Navigate to="/admin/login" replace />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AdminProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<UserLayout />}>
              <Route path="/login" element={<Auth />} />
              <Route path="/" element={<Private><Home /></Private>} />
              <Route path="/events/:id" element={<Private><EventDetail /></Private>} />
              <Route path="/bookings" element={<Private><Bookings /></Private>} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </AuthProvider>
  </StrictMode>
);
