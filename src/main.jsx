import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Auth from './pages/Auth';
import Bookings from './pages/Bookings';
import './index.css';

// Gate every screen behind auth: unauthenticated users are bounced to /login.
function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<Private><Home /></Private>} />
          <Route path="/events/:id" element={<Private><EventDetail /></Private>} />
          <Route path="/bookings" element={<Private><Bookings /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
