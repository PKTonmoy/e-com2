import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api.js';
import {
    BanknotesIcon,
    ShoppingCartIcon,
    UserGroupIcon,
    ArrowTrendingUpIcon,
    PlusIcon,
    FunnelIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import KPICard from '../../components/KPICard.jsx';
import DataTable from '../../components/DataTable.jsx';
import SlideOver from '../../components/SlideOver.jsx';

const AdminDashboardV2 = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Fetch statistics
    const { data: tiles, isLoading: isTilesLoading } = useQuery({
        queryKey: ['admin-tiles'],
        queryFn: async () => (await api.get('/stats/admin-tiles')).data,
    });

    // Mock trend - in real app would come from API
    const getTrend = () => ({ value: (Math.random() * 15).toFixed(1), direction: 'up' });

    const stats = [
        { label: 'Revenue 30d', value: `৳${tiles?.totalRevenue?.toLocaleString() || 0}`, trend: getTrend(), icon: BanknotesIcon, color: 'primary' },
        { label: 'Orders Received', value: tiles?.ordersReceived || 0, trend: getTrend(), icon: ShoppingCartIcon, color: 'secondary' },
        { label: 'Active Carts', value: tiles?.activeCarts || 0, trend: getTrend(), icon: UserGroupIcon, color: 'warning' },
        { label: 'Conversion Rate', value: '3.24%', trend: getTrend(), icon: ArrowTrendingUpIcon, color: 'success' },
    ];


    // Mock recent orders
    const columns = [
        { key: 'id', header: 'Order ID', sortable: true },
        {
            key: 'customer',
            header: 'Customer',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                        {row.customer.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{row.customer}</span>
                </div>
            )
        },
        {
            key: 'status', header: 'Status', render: (row) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${row.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    row.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                    {row.status}
                </span>
            )
        },
        { key: 'total', header: 'Amount', sortable: true, render: (row) => `৳ ${row.total.toLocaleString()}` },
        { key: 'date', header: 'Date', sortable: true },
    ];

    const data = [
        { id: '#ORD-12345', customer: 'Arif Ahmed', status: 'Completed', total: 12500, date: '2025-12-28' },
        { id: '#ORD-12346', customer: 'Sumi Akter', status: 'Pending', total: 4200, date: '2025-12-28' },
        { id: '#ORD-12347', customer: 'Rahat Islam', status: 'Processing', total: 8900, date: '2025-12-27' },
        { id: '#ORD-12348', customer: 'Nabila Khan', status: 'Completed', total: 15400, date: '2025-12-27' },
        { id: '#ORD-12349', customer: 'Tanvir Ahmed', status: 'Completed', total: 2100, date: '2025-12-26' },
    ];

    return (
        <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-ivory mb-1 truncate">
                        Workspace Overview
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 truncate">
                        Detailed reporting and metrics for your atelier.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <FunnelIcon className="h-4 w-4" />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-matte text-sm font-bold shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <PlusIcon className="h-4 w-4" />
                        New Order
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <KPICard key={idx} {...stat} />
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Orders Table */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-ivory">
                            Recent Transactions
                        </h2>
                        <button className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
                            View All
                        </button>
                    </div>
                    <DataTable
                        columns={columns}
                        data={data}
                    />
                </div>

                {/* Secondary Insight (Placeholder) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-display font-bold text-neutral-900 dark:text-ivory">
                        Performance Insight
                    </h2>
                    <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-matte to-neutral-800 border border-primary-500/10 text-white shadow-xl min-h-[350px] sm:h-[400px] flex flex-col justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                                Top Performer
                            </div>
                            <h3 className="text-2xl font-display font-bold mb-2">Winter Couture Collection</h3>
                            <p className="text-neutral-400 text-sm">
                                Your latest collection has reached 85% of its quarterly target within the first 2 weeks.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-neutral-400">Target reached</span>
                                <span className="text-primary-600 dark:text-primary-400 font-bold">85%</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <button className="w-full py-3 rounded-xl border border-primary-500/30 text-primary-600 dark:text-primary-400 text-xs font-bold hover:bg-primary-500/10 transition-colors uppercase tracking-widest">
                                Analyze Breakdown
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter SlideOver */}
            <SlideOver
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                title="Filter Transactions"
                footerActions={
                    <>
                        <button
                            onClick={() => setIsFilterOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setIsFilterOpen(false)}
                            className="px-6 py-2 rounded-xl bg-primary-500 text-matte text-sm font-bold shadow-lg shadow-primary-500/10"
                        >
                            Apply Filters
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Date Range</label>
                        <select className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>Year to Date</option>
                            <option>Custom Range</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Order Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Completed', 'Pending', 'Processing', 'Cancelled'].map(status => (
                                <button key={status} className="px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-800 rounded-lg text-left hover:border-primary-500 transition-colors">
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SlideOver>
        </div>
    );
};

export default AdminDashboardV2;
