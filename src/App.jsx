import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './user/context/AuthContext';
import { AdminProvider, useAdmin } from './admin/context/AdminContext';
import { FavoritesProvider } from './user/context/FavoritesContext';
import Navbar from './user/components/Navbar';
import Home from './user/pages/Home';
import EventDetail from './user/pages/EventDetail';
import Auth from './user/pages/Auth';
import Bookings from './user/pages/Bookings';
import Saved from './user/pages/Saved';
import Checkout from './user/pages/Checkout';
import BookingConfirmation from './user/pages/BookingConfirmation';
import AdminDashboard from './admin/pages/AdminDashboard';

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
        <FavoritesProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<UserLayout />}>
                <Route path="/login" element={<Auth />} />
                <Route path="/" element={<Private><Home /></Private>} />
                <Route path="/events/:id" element={<Private><EventDetail /></Private>} />
                <Route path="/saved" element={<Private><Saved /></Private>} />
                <Route path="/checkout/:id" element={<Private><Checkout /></Private>} />
                <Route path="/booking/:id" element={<Private><BookingConfirmation /></Private>} />
                <Route path="/bookings" element={<Private><Bookings /></Private>} />
              </Route>
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FavoritesProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
