import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Auth from './pages/Auth';
import Bookings from './pages/Bookings';
import BookingConfirmation from './pages/BookingConfirmation';
import AdminDashboard from './pages/AdminDashboard';

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
  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<UserLayout />}>
              <Route path="/login" element={<Auth />} />
              <Route path="/" element={<Private><Home /></Private>} />
              <Route path="/events/:id" element={<Private><EventDetail /></Private>} />
              <Route path="/booking/:id" element={<Private><BookingConfirmation /></Private>} />
              <Route path="/bookings" element={<Private><Bookings /></Private>} />
            </Route>
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </AuthProvider>
  );
}
