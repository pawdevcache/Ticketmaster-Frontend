import { useState } from 'react';
import { IcoSun, IcoMoon } from '../utils/icons';

// Flips data-theme on <html> and remembers the choice. Pass `light` on dark
// surfaces (e.g. the admin top bar) so the control stays visible.
export default function ThemeToggle({ light }) {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setDark(!dark);
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
      style={light ? { color: '#fff', borderColor: 'rgba(255,255,255,.28)' } : undefined}
    >
      {dark ? <IcoSun /> : <IcoMoon />}
    </button>
  );
}
