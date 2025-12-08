import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  MoonIcon,
  SunIcon,
  ShoppingBagIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  BookOpenIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import AdminSidebar from './AdminSidebar.jsx';

const navLinks = [
  { to: '/shop', label: 'Shop', icon: ShoppingCartIcon },
  { to: '/blog', label: 'Editorial', icon: BookOpenIcon },
  { to: '/about', label: 'About', icon: InformationCircleIcon },
  { to: '/contact', label: 'Contact', icon: ChatBubbleLeftRightIcon },
  { to: '/faq', label: 'FAQ', icon: QuestionMarkCircleIcon },
];

const Layout = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark bg-matte text-white' : 'bg-ivory text-matte'}`}>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-ivory/90 dark:bg-matte/90 border-b border-gold/20 flex-shrink-0">
        <div className="lux-container flex items-center justify-between py-4">
          {/* Mobile Menu Button */}
          <button
            aria-label="Open menu"
            className="md:hidden rounded-full border border-gold/30 p-2 hover:bg-gold/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="font-display text-2xl tracking-wide">
            PRELUX
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm uppercase tracking-[0.18em]">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'text-gold font-semibold' : 'hover:text-gold transition-colors'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              aria-label="Toggle theme"
              className="rounded-full border border-gold/30 p-2 hover:bg-gold/10 transition-colors"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Link to="/cart" className="rounded-full border border-gold/30 p-2 hover:bg-gold/10 transition-colors">
              <ShoppingBagIcon className="h-5 w-5" />
            </Link>
            <Link to="/profile" className="rounded-full border border-gold/30 p-2 hover:bg-gold/10 transition-colors">
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-ivory dark:bg-matte shadow-2xl transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-5 border-b border-gold/20">
            <Link
              to="/"
              className="font-display text-xl tracking-wide"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              PRELUX
            </Link>
            <button
              aria-label="Close menu"
              className="rounded-full border border-gold/30 p-2 hover:bg-gold/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex flex-col h-[calc(100%-76px)]">
            {/* Navigation Links */}
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
              {/* Home Link */}
              <NavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${isActive
                    ? 'bg-gold/10 text-gold font-semibold'
                    : 'hover:bg-gold/5 text-matte dark:text-ivory'
                  }`
                }
              >
                <HomeIcon className="h-5 w-5" />
                <span className="text-sm uppercase tracking-widest">Home</span>
              </NavLink>

              {/* Other Nav Links */}
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${isActive
                        ? 'bg-gold/10 text-gold font-semibold'
                        : 'hover:bg-gold/5 text-matte dark:text-ivory'
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm uppercase tracking-widest">{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gold/10">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
                Luxury • Curated • Timeless
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isAdminRoute ? (
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 min-h-[calc(100vh-73px)] overflow-y-auto">{children}</main>
        </div>
      ) : (
        <main className="flex-1">{children}</main>
      )}

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
