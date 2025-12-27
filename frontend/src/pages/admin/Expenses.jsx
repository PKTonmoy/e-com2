import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, PrinterIcon, Cog6ToothIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';

const AdminExpenses = () => {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [showSettings, setShowSettings] = useState(false);
    const printRef = useRef();

    const { data: expenses, isLoading } = useQuery({
        queryKey: ['expenses', dateRange],
        queryFn: async () => {
            const { data } = await api.get('/admin/expenses', { params: dateRange });
            return data;
        },
    });

    const { data: settings } = useQuery({
        queryKey: ['expense-settings'],
        queryFn: async () => (await api.get('/admin/expenses/settings')).data,
    });

    const queryClient = useQueryClient();
    const updateSettings = useMutation({
        mutationFn: async (newSettings) => await api.post('/admin/expenses/settings', newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries(['expense-settings']);
            queryClient.invalidateQueries(['expenses']);
            setShowSettings(false);
        },
    });

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) return <div className="p-8 text-center">Loading expenses...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 max-w-7xl mx-auto print:max-w-none print:p-0">
            {/* Header - Hidden in Print */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Expense Management</h1>
                    <p className="text-sm text-neutral-500 mt-1">Track operational costs and delivery expenses</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm"
                    />
                    <span className="self-center text-neutral-400">to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm"
                    />
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 rounded-md"
                        title="Settings"
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-matte text-white dark:bg-ivory dark:text-matte rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <PrinterIcon className="w-4 h-4" />
                        Print Report
                    </button>
                </div>
            </div>

            {/* Print Header - Visible only in Print */}
            <div className="hidden print:block mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-bold mb-2">Expense Report</h1>
                <p className="text-gray-600">
                    Period: {new Date(dateRange.startDate).toLocaleDateString()} — {new Date(dateRange.endDate).toLocaleDateString()}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="lux-card p-6 border-l-4 border-l-gold print:text-black">
                    <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1 print:text-black">Total Expense</p>
                    <p className="text-2xl font-bold font-display print:text-black">৳{expenses?.summary.totalExpense.toLocaleString()}</p>
                </div>
                <div className="lux-card p-6 border-l-4 border-l-blue-500 print:text-black">
                    <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1 print:text-black">Courier Costs</p>
                    <p className="text-2xl font-bold font-display print:text-black">৳{expenses?.summary.courierCost.toLocaleString()}</p>
                    <p className="text-xs text-neutral-400 mt-2 print:text-black">
                        {expenses?.breakdown.courier.delivered} delivered, {expenses?.breakdown.courier.returned} returned
                    </p>
                </div>
                <div className="lux-card p-6 border-l-4 border-l-green-500 print:text-black">
                    <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1 print:text-black">SMS Costs</p>
                    <p className="text-2xl font-bold font-display print:text-black">৳{expenses?.summary.smsCost.toLocaleString()}</p>
                    <p className="text-xs text-neutral-400 mt-2 print:text-black">
                        {expenses?.breakdown.sms.count} sent (৳{expenses?.breakdown.sms.unitCost}/sms)
                    </p>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="lux-card overflow-hidden print:shadow-none print:border print:text-black">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 print:bg-white print:border-black">
                    <h3 className="font-semibold text-lg print:text-black">Cost Breakdown</h3>
                </div>
                <table className="w-full text-sm text-left print:text-black">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-medium print:bg-gray-100 print:text-black">
                        <tr>
                            <th className="px-6 py-3 print:border-b print:border-black">Category</th>
                            <th className="px-6 py-3 print:border-b print:border-black">Metric</th>
                            <th className="px-6 py-3 text-right print:border-b print:border-black">Unit Cost</th>
                            <th className="px-6 py-3 text-right print:border-b print:border-black">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 print:divide-black">
                        {/* Courier Delivery */}
                        <tr>
                            <td className="px-6 py-3 font-medium print:text-black">Delivery Fees</td>
                            <td className="px-6 py-3 print:text-black">{expenses?.breakdown.courier.delivered} Delivered Orders</td>
                            <td className="px-6 py-3 text-right print:text-black">৳{expenses?.breakdown.courier.unitDeliveryFee}</td>
                            <td className="px-6 py-3 text-right print:text-black">৳{expenses?.breakdown.courier.deliveryExpenses.toLocaleString()}</td>
                        </tr>
                        {/* Courier Returns */}
                        <tr>
                            <td className="px-6 py-3 font-medium print:text-black">Return Charges</td>
                            <td className="px-6 py-3 print:text-black">{expenses?.breakdown.courier.returned} Returned Orders</td>
                            <td className="px-6 py-3 text-right print:text-black">৳{expenses?.breakdown.courier.unitReturnFee}</td>
                            <td className="px-6 py-3 text-right print:text-black">৳{expenses?.breakdown.courier.returnExpenses.toLocaleString()}</td>
                        </tr>
                        {/* COD Charges */}
                        <tr>
                            <td className="px-6 py-3 font-medium print:text-black">COD Cashout Fees</td>
                            <td className="px-6 py-3 print:text-black">1% of COD Collection</td>
                            <td className="px-6 py-3 text-right print:text-black">1%</td>
                            <td className="px-6 py-3 text-right print:text-black">৳{expenses?.breakdown.courier.codExpenses.toLocaleString()}</td>
                        </tr>
                        {/* SMS */}
                        <tr className="bg-gray-50/50 dark:bg-gray-900/20 print:bg-transparent">
                            <td className="px-6 py-3 font-medium print:text-black">SMS Notifications</td>
                            <td className="px-6 py-3 print:text-black">{expenses?.breakdown.sms.count} Messages Sent</td>
                            <td className="px-6 py-3 text-right print:text-black">৳{expenses?.breakdown.sms.unitCost}</td>
                            <td className="px-6 py-3 text-right print:text-black">৳{expenses?.breakdown.sms.total.toLocaleString()}</td>
                        </tr>
                        {/* Grand Total */}
                        <tr className="bg-gray-100 dark:bg-gray-800 font-bold text-base print:bg-gray-100 print:text-black">
                            <td className="px-6 py-4" colSpan="3">Grand Total</td>
                            <td className="px-6 py-4 text-right">৳{expenses?.summary.totalExpense.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Expense Settings</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                updateSettings.mutate(Object.fromEntries(formData));
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium mb-1">SMS Cost (BDT)</label>
                                <input
                                    name="smsCost"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings?.smsCost}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Avg. Delivery Fee (BDT)</label>
                                <input
                                    name="deliveryFee"
                                    type="number"
                                    defaultValue={settings?.deliveryFee}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Return Charge (BDT)</label>
                                <input
                                    name="returnFee"
                                    type="number"
                                    defaultValue={settings?.returnFee}
                                    className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateSettings.isPending}
                                    className="px-4 py-2 text-sm font-medium bg-matte text-white dark:bg-ivory dark:text-matte rounded-md hover:opacity-90 disabled:opacity-50"
                                >
                                    {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExpenses;
