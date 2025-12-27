import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
    Squares2X2Icon,
    ShoppingBagIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentTextIcon,
    ClipboardDocumentListIcon,
    TicketIcon,
    StarIcon,
    NewspaperIcon,
    Cog6ToothIcon,
    Bars3Icon,
    XMarkIcon,
    TruckIcon,
    BellIcon,
    WalletIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: Squares2X2Icon, end: true },
    { to: '/admin/products', label: 'Products', icon: ShoppingBagIcon },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardDocumentListIcon },
    { to: '/admin/returns', label: 'Returns', icon: ArrowPathIcon },
    { to: '/admin/users', label: 'Users', icon: UsersIcon },
    { to: '/admin/reviews', label: 'Reviews', icon: StarIcon },
    { to: '/admin/coupons', label: 'Coupons', icon: TicketIcon },
    { to: '/admin/blog', label: 'Blog', icon: NewspaperIcon },
    { to: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    { to: '/admin/courier-tariffs', label: 'Courier Tariffs', icon: TruckIcon },
    { to: '/admin/courier-management', label: 'Courier Management', icon: WalletIcon },
    { to: '/admin/notifications', label: 'Notifications', icon: BellIcon },
    { to: '/admin/content', label: 'Content', icon: DocumentTextIcon },
    { to: '/admin/settings', label: 'Settings', icon: Cog6ToothIcon },
];

const AdminSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <div className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-matte/95 backdrop-blur-sm border-b border-gold/20 px-4 py-3 flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.15em] text-gold font-semibold">Admin Panel</p>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-lg hover:bg-gold/10 transition-colors"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="h-6 w-6 text-matte dark:text-ivory" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <div
                className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={closeSidebar}
                />

                {/* Sidebar Panel */}
                <div
                    className={`absolute left-0 top-0 h-full w-72 bg-white dark:bg-matte shadow-xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {/* Close Button */}
                    <div className="flex items-center justify-between p-4 border-b border-gold/20">
                        <p className="text-sm uppercase tracking-[0.15em] text-gold font-semibold">Admin Panel</p>
                        <button
                            onClick={closeSidebar}
                            className="p-2 rounded-lg hover:bg-gold/10 transition-colors"
                            aria-label="Close menu"
                        >
                            <XMarkIcon className="h-6 w-6 text-matte dark:text-ivory" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-4 space-y-1 overflow-y-auto flex-1">
                        {adminLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-gold/10 text-gold font-medium'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-gold/5 hover:text-gold'
                                    }`
                                }
                            >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-white/50 dark:bg-matte/50 border-r border-gold/20 hidden lg:block min-h-[calc(100vh-73px)] sticky top-[73px] self-start overflow-y-auto">
                <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4 px-3">Admin Panel</p>
                    <nav className="space-y-1">
                        {adminLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-gold/10 text-gold font-medium'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-gold/5 hover:text-gold'
                                    }`
                                }
                            >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
