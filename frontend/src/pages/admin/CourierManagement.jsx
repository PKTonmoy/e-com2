import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import {
    CurrencyBangladeshiIcon,
    ArrowPathIcon,
    CreditCardIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const CourierManagement = () => {
    const qc = useQueryClient();

    // 1. Balance
    const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
        queryKey: ['courier-balance'],
        queryFn: async () => (await api.get('/delivery/admin/balance')).data,
    });

    // 2. Returns
    const { data: returnsData, isLoading: returnsLoading, refetch: refetchReturns } = useQuery({
        queryKey: ['courier-returns'],
        queryFn: async () => (await api.get('/delivery/admin/returns')).data,
    });

    // 3. Payments
    const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
        queryKey: ['courier-payments'],
        queryFn: async () => (await api.get('/delivery/admin/payments')).data,
    });

    const handleRefreshAll = () => {
        refetchBalance();
        refetchReturns();
        refetchPayments();
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl text-matte dark:text-ivory">Steadfast Management</h1>
                    <p className="text-neutral-500 text-sm mt-1">Monitor your courier account, returns, and daily payments.</p>
                </div>
                <button
                    onClick={handleRefreshAll}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-ivory dark:bg-matte border border-gold/30 rounded-lg text-xs font-semibold hover:bg-gold/5 transition-all shadow-sm"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    Refresh All
                </button>
            </div>

            {/* Stats / Balance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="lux-card p-6 flex items-center gap-4 border-l-4 border-gold">
                    <div className="p-3 bg-gold/10 rounded-xl text-gold">
                        <CurrencyBangladeshiIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Current Balance</p>
                        {balanceLoading ? (
                            <div className="h-8 w-24 bg-neutral-200 animate-pulse rounded mt-1" />
                        ) : (
                            <p className="text-3xl font-display text-matte dark:text-ivory">
                                ৳{balanceData?.current_balance || 0}
                            </p>
                        )}
                    </div>
                </div>

                <div className="lux-card p-6 flex items-center gap-4 border-l-4 border-amber-500">
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                        <ArrowPathIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Active Returns</p>
                        <p className="text-3xl font-display text-matte dark:text-ivory">
                            {returnsData?.length || 0}
                        </p>
                    </div>
                </div>

                <div className="lux-card p-6 flex items-center gap-4 border-l-4 border-emerald-500">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <CreditCardIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-500 font-bold">Total Payouts</p>
                        <p className="text-3xl font-display text-matte dark:text-ivory">
                            {paymentsData?.length || 0}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Returns Table */}
                <div className="lux-card overflow-hidden">
                    <div className="p-4 border-b border-gold/10 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50">
                        <h2 className="font-display text-lg flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                            Return Requests
                        </h2>
                    </div>
                    <div className="p-0 overflow-x-auto min-h-[300px]">
                        {returnsLoading ? (
                            <div className="p-8 text-center text-neutral-400">Loading returns...</div>
                        ) : (returnsData?.length || 0) === 0 ? (
                            <div className="p-12 text-center text-neutral-400">No active return requests found.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase text-neutral-500">
                                    <tr>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">Consignment</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Requested At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {returnsData.map((ret) => (
                                        <tr key={ret.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                                            <td className="px-6 py-4 font-mono text-xs">#{ret.id}</td>
                                            <td className="px-6 py-4">{ret.consignment_id}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                                                    {ret.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-neutral-500">
                                                {new Date(ret.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Payments Table */}
                <div className="lux-card overflow-hidden">
                    <div className="p-4 border-b border-gold/10 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50">
                        <h2 className="font-display text-lg flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5 text-emerald-500" />
                            Recent Payouts
                        </h2>
                    </div>
                    <div className="p-0 overflow-x-auto min-h-[300px]">
                        {paymentsLoading ? (
                            <div className="p-8 text-center text-neutral-400">Loading payments...</div>
                        ) : (paymentsData?.length || 0) === 0 ? (
                            <div className="p-12 text-center text-neutral-400">No payout history found.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase text-neutral-500">
                                    <tr>
                                        <th className="px-6 py-3">Payout ID</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {paymentsData.map((pay) => (
                                        <tr key={pay.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer">
                                            <td className="px-6 py-4 font-mono text-xs">#{pay.id}</td>
                                            <td className="px-6 py-4 font-bold text-emerald-600">৳{pay.amount}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                                                    {pay.status || 'Success'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-neutral-500">
                                                {new Date(pay.created_at || pay.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourierManagement;
