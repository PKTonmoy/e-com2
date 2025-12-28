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
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const adminMenu = [
    {
        title: 'Overview',
        items: [
            { to: '/admin', label: 'Dashboard', icon: Squares2X2Icon, end: true },
        ]
    },
    {
        title: 'Commerce',
        items: [
            { to: '/admin/orders', label: 'Orders', icon: ClipboardDocumentListIcon },
            { to: '/admin/returns', label: 'Returns', icon: ArrowPathIcon },
            { to: '/admin/products', label: 'Products', icon: ShoppingBagIcon },
            { to: '/admin/coupons', label: 'Coupons', icon: TicketIcon },
        ]
    },
    {
        title: 'Operations',
        items: [
            { to: '/admin/expenses', label: 'Expenses', icon: CurrencyDollarIcon },
            { to: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
            { to: '/admin/courier-management', label: 'Courier Management', icon: WalletIcon },
            { to: '/admin/courier-tariffs', label: 'Courier Tariffs', icon: TruckIcon },
        ]
    },
    {
        title: 'People',
        items: [
            { to: '/admin/users', label: 'Users', icon: UsersIcon },
            { to: '/admin/reviews', label: 'Reviews', icon: StarIcon },
        ]
    },
    {
        title: 'Content',
        items: [
            { to: '/admin/blog', label: 'Blog', icon: NewspaperIcon },
            { to: '/admin/content', label: 'Content', icon: DocumentTextIcon },
            { to: '/admin/notifications', label: 'Notifications', icon: BellIcon },
        ]
    },
    {
        title: 'System',
        items: [
            { to: '/admin/settings', label: 'Settings', icon: Cog6ToothIcon },
        ]
    },
];

const AdminSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <div className="lg:hidden sticky top-0 z-40 w-full bg-white/95 dark:bg-matte/95 backdrop-blur-sm border-b border-primary-500/20 px-4 py-4 flex items-center justify-between">
                <p className="text-xs font-display font-bold tracking-[0.2em] text-primary-500 uppercase">
                    Admin Panel
                </p>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-xl hover:bg-primary-500/10 transition-all active:scale-95"
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
                    <div className="flex items-center justify-between p-4 border-b border-primary-500/20">
                        <p className="text-sm uppercase tracking-[0.15em] text-primary-500 font-semibold">Admin Panel</p>
                        <button
                            onClick={closeSidebar}
                            className="p-2 rounded-lg hover:bg-primary-500/10 transition-colors"
                            aria-label="Close menu"
                        >
                            <XMarkIcon className="h-6 w-6 text-matte dark:text-ivory" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-4 space-y-6 overflow-y-auto flex-1">
                        {adminMenu.map((group, idx) => (
                            <div key={idx}>
                                {group.title && (
                                    <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                                        {group.title}
                                    </p>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((link) => (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            end={link.end}
                                            onClick={closeSidebar}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                    ? 'bg-primary-500/10 text-primary-500 font-medium'
                                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-primary-500/5 hover:text-primary-500'
                                                }`
                                            }
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="w-72 flex-shrink-0 bg-surface-light dark:bg-matte border-r border-primary-500/10 hidden lg:flex flex-col min-h-screen sticky top-0">
                {/* Logo Area */}
                <div className="h-20 flex items-center px-8 border-b border-primary-500/10">
                    <p className="text-sm font-display font-bold tracking-[0.2em] text-primary-500 uppercase">
                        Admin Panel
                    </p>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                    {adminMenu.map((group, idx) => (
                        <div key={idx}>
                            {group.title && (
                                <p className="px-4 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.15em] mb-3">
                                    {group.title}
                                </p>
                            )}
                            <nav className="space-y-1">
                                {group.items.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        end={link.end}
                                        className={({ isActive }) =>
                                            `group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive
                                                ? 'bg-gradient-to-r from-gold/20 to-transparent text-primary-500 font-medium shadow-[inset_2px_0_0_0_#C9A94F]'
                                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-primary-500/5 hover:text-primary-500 hover:translate-x-1'
                                            }`
                                        }
                                    >
                                        <link.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                                        <span className="text-sm tracking-wide">{link.label}</span>
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Footer User Profile (Placeholder) */}
                <div className="p-4 border-t border-primary-500/10">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-primary-500/5">
                        <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-bold">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-matte dark:text-ivory truncate">Administrator</p>
                            <p className="text-[10px] text-neutral-500 truncate">admin@idol.com</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
