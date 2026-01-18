import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    HomeIcon,
    Squares2X2Icon,
    ShoppingBagIcon,
    HeartIcon,
    UserIcon,
    Cog6ToothIcon,
    BellIcon,
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    Squares2X2Icon as Squares2X2IconSolid,
    ShoppingBagIcon as ShoppingBagIconSolid,
    HeartIcon as HeartIconSolid,
    UserIcon as UserIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid,
    BellIcon as BellIconSolid,
} from '@heroicons/react/24/solid';
import { useBottomNav } from '../context/BottomNavContext.jsx';
import api from '../lib/api.js';

// Removed motion wrapper for better mobile performance - using CSS transitions instead

const baseNavItems = [
    { to: '/', label: 'Home', icon: HomeIcon, iconActive: HomeIconSolid },
    { to: '/shop', label: 'Category', icon: Squares2X2Icon, iconActive: Squares2X2IconSolid },
    { to: '/cart', label: 'Cart', icon: ShoppingBagIcon, iconActive: ShoppingBagIconSolid },
    { to: '/notifications', label: 'Alerts', icon: BellIcon, iconActive: BellIconSolid },
    { to: '/wishlist', label: 'Save', icon: HeartIcon, iconActive: HeartIconSolid },
    { to: '/profile', label: 'Profile', icon: UserIcon, iconActive: UserIconSolid },
];

const adminNavItem = { to: '/admin', label: 'Admin', icon: Cog6ToothIcon, iconActive: Cog6ToothIconSolid };

const MobileBottomNav = () => {
    const location = useLocation();
    const { isBottomNavVisible } = useBottomNav();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const debounceTimer = useRef(null);

    // Debounced popup detection - OPTIMIZED to prevent mobile lag
    const checkForPopups = useCallback(() => {
        const modalOverlays = document.querySelectorAll('[data-modal-overlay]');
        const visibleOverlays = Array.from(modalOverlays).filter(overlay => {
            const classes = overlay.className;
            if (classes.includes('pointer-events-none')) return false;
            if (classes.includes('opacity-0')) return false;
            return true;
        });
        setIsPopupOpen(visibleOverlays.length > 0);
    }, []);

    // Auto-detect popups/modals with DEBOUNCED observer
    useEffect(() => {
        // Check immediately
        checkForPopups();

        // Debounced callback to prevent excessive re-renders
        const debouncedCheck = () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(checkForPopups, 100);
        };

        // Only observe attribute changes on specific elements, not entire DOM
        const observer = new MutationObserver(debouncedCheck);
        observer.observe(document.body, {
            childList: true,
            subtree: false, // CHANGED: Don't watch entire subtree
            attributes: false, // CHANGED: Don't watch attribute changes
        });

        return () => {
            observer.disconnect();
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [checkForPopups]);

    // Fetch current user to check admin role
    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            try {
                const res = await api.get('/auth/me');
                return res.data;
            } catch {
                return null;
            }
        },
        retry: false,
    });

    const isAdmin = user?.role === 'admin';
    const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

    // Routes where the bottom nav should be hidden
    const hideOnRoutes = ['/admin', '/blog', '/product', '/checkout'];
    const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route));

    if (shouldHide) {
        return null;
    }

    // Combine context visibility with auto-detected popup visibility
    const shouldShowNav = isBottomNavVisible && !isPopupOpen;

    return (
        <nav
            className={`fixed bottom-4 left-4 right-4 z-40 md:hidden transition-transform duration-300 ease-out ${shouldShowNav ? 'translate-y-0' : 'translate-y-28'} ${!shouldShowNav ? 'pointer-events-none' : ''}`}
            style={{ willChange: 'transform' }}
        >
            <div className="bg-white/40 dark:bg-matte/40 backdrop-blur-xl rounded-full border border-black/5 dark:border-white/5 shadow-2xl shadow-black/10 dark:shadow-black/30">
                <ul className="flex justify-between items-center px-4 py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                        const Icon = isActive ? item.iconActive : item.icon;

                        return (
                            <li key={item.to} className="relative">
                                <NavLink
                                    to={item.to}
                                    className="flex items-center justify-center w-12 h-12 relative z-20 active:scale-90 transition-transform duration-150"
                                >
                                    {/* Active indicator - using CSS instead of framer-motion */}
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 rounded-full border border-gold bg-gold/10 shadow-[0_0_15px_-4px_rgba(212,175,55,0.5)] backdrop-blur-md transition-all duration-300"
                                        />
                                    )}
                                    <Icon
                                        className={`w-6 h-6 transition-all duration-300 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] dark:drop-shadow-none ${isActive ? 'text-gray-900 dark:text-white scale-110' : 'text-gray-700 dark:text-gray-400 stroke-2 scale-90'
                                            }`}
                                    />
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default MobileBottomNav;
