import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
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

const MotionNavLink = motion(NavLink);

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

    // Auto-detect popups/modals in the DOM
    useEffect(() => {
        const checkForPopups = () => {
            // Look for modal overlays that are actually visible (not pointer-events-none)
            const modalOverlays = document.querySelectorAll('[data-modal-overlay]');

            // Filter to only include visible overlays (not hidden with pointer-events-none or opacity-0)
            const visibleOverlays = Array.from(modalOverlays).filter(overlay => {
                const classes = overlay.className;
                // Skip if it has pointer-events-none (meaning it's hidden)
                if (classes.includes('pointer-events-none')) return false;
                // Skip if it has opacity-0 (meaning it's hidden)
                if (classes.includes('opacity-0')) return false;
                return true;
            });

            setIsPopupOpen(visibleOverlays.length > 0);
        };

        // Check immediately
        checkForPopups();

        // Set up mutation observer to detect DOM changes
        const observer = new MutationObserver(checkForPopups);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

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
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: shouldShowNav ? 0 : 100 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className={`fixed bottom-4 left-4 right-4 z-40 md:hidden ${!shouldShowNav ? 'pointer-events-none' : ''}`}
        >
            <div className="bg-white/40 dark:bg-matte/40 backdrop-blur-xl rounded-full border border-black/5 dark:border-white/5 shadow-2xl shadow-black/10 dark:shadow-black/30">
                <ul className="flex justify-between items-center px-4 py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                        const Icon = isActive ? item.iconActive : item.icon;

                        return (
                            <li key={item.to} className="relative">
                                <MotionNavLink
                                    to={item.to}
                                    className="flex items-center justify-center w-12 h-12 relative z-20"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-full border border-gold bg-gold/10 shadow-[0_0_15px_-4px_rgba(212,175,55,0.5)] backdrop-blur-md"
                                            transition={{
                                                type: "spring",
                                                bounce: 0.2,
                                                duration: 0.6
                                            }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-6 h-6 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] dark:drop-shadow-none ${isActive ? 'text-gray-900 dark:text-white scale-110' : 'text-gray-700 dark:text-gray-400 stroke-2 scale-90'
                                            }`}
                                    />
                                </MotionNavLink>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </motion.nav>
    );
};

export default MobileBottomNav;
