import { Link } from 'react-router-dom';
import { IcoTicket } from '../icons';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <Link to="/" className="logo" style={{ color: '#fff' }}><IcoTicket /> <b>TixWave</b></Link>
        <div className="row" style={{ gap: 24, flexWrap: 'wrap' }}>
          <Link to="/">Browse events</Link>
          <Link to="/bookings">My Tickets</Link>
        </div>
        <span>© {new Date().getFullYear()} TixWave. All rights reserved.</span>
      </div>
    </footer>
  );
}
