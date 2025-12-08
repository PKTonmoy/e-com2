import { NavLink } from 'react-router-dom';
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
} from '@heroicons/react/24/outline';

const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: Squares2X2Icon, end: true },
    { to: '/admin/products', label: 'Products', icon: ShoppingBagIcon },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardDocumentListIcon },
    { to: '/admin/users', label: 'Users', icon: UsersIcon },
    { to: '/admin/reviews', label: 'Reviews', icon: StarIcon },
    { to: '/admin/coupons', label: 'Coupons', icon: TicketIcon },
    { to: '/admin/blog', label: 'Blog', icon: NewspaperIcon },
    { to: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    { to: '/admin/content', label: 'Content', icon: DocumentTextIcon },
];

const AdminSidebar = () => {
    return (
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
    );
};

export default AdminSidebar;
