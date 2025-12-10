import { NavLink, useLocation } from 'react-router-dom';
import {
    HomeIcon,
    Squares2X2Icon,
    ShoppingBagIcon,
    HeartIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    Squares2X2Icon as Squares2X2IconSolid,
    ShoppingBagIcon as ShoppingBagIconSolid,
    HeartIcon as HeartIconSolid,
    UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import { useBottomNav } from '../context/BottomNavContext.jsx';

const navItems = [
    { to: '/', label: 'Home', icon: HomeIcon, iconActive: HomeIconSolid },
    { to: '/shop', label: 'Category', icon: Squares2X2Icon, iconActive: Squares2X2IconSolid },
    { to: '/cart', label: 'Cart', icon: ShoppingBagIcon, iconActive: ShoppingBagIconSolid },
    { to: '/wishlist', label: 'Save', icon: HeartIcon, iconActive: HeartIconSolid },
    { to: '/profile', label: 'Profile', icon: UserIcon, iconActive: UserIconSolid },
];

const MobileBottomNav = () => {
    const location = useLocation();
    const { isBottomNavVisible } = useBottomNav();

    // Don't show on admin pages
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <nav className={`fixed bottom-4 left-4 right-4 z-50 md:hidden transition-all duration-300 ${isBottomNavVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
            {/* Glass morphism container */}
            <div className="bg-matte/95 dark:bg-matte/98 backdrop-blur-xl rounded-full shadow-2xl shadow-black/30 border border-white/10">
                <div className="flex items-center justify-between px-2 py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to ||
                            (item.to !== '/' && location.pathname.startsWith(item.to));
                        const Icon = isActive ? item.iconActive : item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className="relative flex items-center justify-center"
                            >
                                {isActive ? (
                                    // Active state - pill with label
                                    <div className="flex items-center gap-2 bg-white/15 px-4 py-2.5 rounded-full transition-all duration-300">
                                        <Icon className="h-5 w-5 text-white" />
                                        <span className="text-xs font-medium text-white tracking-wide">
                                            {item.label}
                                        </span>
                                    </div>
                                ) : (
                                    // Inactive state - icon only
                                    <div className="p-3 rounded-full hover:bg-white/5 transition-all duration-200">
                                        <Icon className="h-5 w-5 text-white/60" />
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default MobileBottomNav;
