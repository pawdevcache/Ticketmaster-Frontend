import { IcoTicket } from '../icons';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="logo" style={{ color: '#fff' }}><IcoTicket /> <b>TixWave</b></div>
        <div className="row" style={{ gap: 24, flexWrap: 'wrap' }}>
          <a href="#">Events</a><a href="#">Venues</a><a href="#">Help</a><a href="#">Privacy</a>
        </div>
        <span>© {new Date().getFullYear()} TixWave. All rights reserved.</span>
      </div>
    </footer>
  );
}
