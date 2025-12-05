import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MoonIcon, SunIcon, ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline';
import AdminSidebar from './AdminSidebar.jsx';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/blog', label: 'Editorial' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

const Layout = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark bg-matte text-white' : 'bg-ivory text-matte'}`}>
      <header className="sticky top-0 z-20 backdrop-blur bg-ivory/80 dark:bg-matte/80 border-b border-gold/30 flex-shrink-0">
        <div className="lux-container flex items-center justify-between py-4">
          <Link to="/" className="font-display text-2xl tracking-wide">
            PRELUX
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm uppercase tracking-[0.18em]">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'text-gold font-semibold' : 'hover:text-gold'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center space-x-3">
            <button
              aria-label="Toggle theme"
              className="rounded-full border border-gold/30 p-2 hover:bg-gold/10"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Link to="/cart" className="rounded-full border border-gold/30 p-2 hover:bg-gold/10">
              <ShoppingBagIcon className="h-5 w-5" />
            </Link>
            <Link to="/profile" className="rounded-full border border-gold/30 p-2 hover:bg-gold/10">
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {isAdminRoute && <AdminSidebar />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {!isAdminRoute && (
        <footer className="border-t border-gold/30 bg-white/60 dark:bg-matte/60 flex-shrink-0">
          <div className="lux-container py-10 grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-xl mb-2">PRELUX</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Curated couture, interiors, and objects of desire.
              </p>
            </div>
            <div className="text-sm space-y-2">
              <Link to="/about" className="block hover:text-gold">
                About
              </Link>
              <Link to="/blog" className="block hover:text-gold">
                Journal
              </Link>
              <Link to="/faq" className="block hover:text-gold">
                FAQ
              </Link>
            </div>
            <div className="text-sm">
              <p className="uppercase tracking-[0.2em] text-xs mb-2 text-neutral-500 dark:text-neutral-300">
                Newsletter
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Receive private previews and atelier stories.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
