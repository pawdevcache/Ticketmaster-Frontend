import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import ThemeToggle from '../../shared/ThemeToggle';
import { IcoTickets, IcoUser, IcoLogout, IcoLogin, IcoTicket, IcoHeart } from '../../utils/icons';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { ids } = useFavorites();
  const nav = useNavigate();

  return (
    <nav className="nav">
      <div className="container">
        <Link to="/" className="logo"><IcoTicket style={{ color: 'var(--primary)' }} /> <b>TixWave</b></Link>
        <div className="row">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/saved" className="btn ghost sm"><IcoHeart /> Saved{ids.length ? ` (${ids.length})` : ''}</Link>
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
