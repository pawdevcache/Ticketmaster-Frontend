import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { IcoTickets, IcoUser, IcoLogout, IcoLogin, IcoTicket } from '../utils/icons';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <nav className="nav">
      <div className="container">
        <Link to="/" className="logo"><IcoTicket style={{ color: 'var(--primary)' }} /> <b>TixWave</b></Link>
        <div className="row">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/bookings" className="btn ghost sm"><IcoTickets /> My Tickets</Link>
              <span className="pill"><IcoUser /> {user.email}</span>
              <button className="btn sm danger" onClick={() => { logout(); nav('/'); }}>
                <IcoLogout /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn sm"><IcoLogin /> Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
