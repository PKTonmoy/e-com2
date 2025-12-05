import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const AdminCoupons = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState({
        code: '',
        type: 'percentage',
        value: '',
        minPurchase: '',
        expiresAt: '',
        active: true,
    });

    const { data: coupons = [] } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: async () => {
            const res = await api.get('/coupons');
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/coupons', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-coupons']);
            addToast('Coupon created successfully!');
            resetForm();
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to create coupon'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/coupons/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-coupons']);
            addToast('Coupon updated successfully!');
            resetForm();
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to update coupon'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/coupons/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-coupons']);
            addToast('Coupon deleted');
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to delete coupon'),
    });

    const resetForm = () => {
        setForm({
            code: '',
            type: 'percentage',
            value: '',
            minPurchase: '',
            expiresAt: '',
            active: true,
        });
        setEditingCoupon(null);
        setShowModal(false);
    };

    const handleEdit = (coupon) => {
        setForm({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minPurchase: coupon.minPurchase || '',
            expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
            active: coupon.active,
        });
        setEditingCoupon(coupon);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...form,
            value: Number(form.value),
            minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
            expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        };
        if (editingCoupon) {
            updateMutation.mutate({ id: editingCoupon._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const filteredCoupons = useMemo(() => {
        if (!searchQuery) return coupons;
        return coupons.filter((c) =>
            c.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [coupons, searchQuery]);

    const isExpired = (date) => date && new Date(date) < new Date();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl">Coupon Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="lux-btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add Coupon
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                    type="text"
                    placeholder="Search coupons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gold/30 rounded-lg bg-white dark:bg-matte"
                />
            </div>

            {/* Coupons Table */}
            <div className="lux-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gold/10">
                        <tr>
                            <th className="text-left p-3">Code</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3">Value</th>
                            <th className="text-left p-3">Min. Purchase</th>
                            <th className="text-left p-3">Expires</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCoupons.map((coupon) => (
                            <tr key={coupon._id} className="border-t border-gold/10 hover:bg-gold/5">
                                <td className="p-3 font-semibold">{coupon.code}</td>
                                <td className="p-3 capitalize">{coupon.type}</td>
                                <td className="p-3">
                                    {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                                </td>
                                <td className="p-3">
                                    {coupon.minPurchase ? `$${coupon.minPurchase}` : '-'}
                                </td>
                                <td className="p-3">
                                    {coupon.expiresAt ? (
                                        <span className={isExpired(coupon.expiresAt) ? 'text-red-500' : ''}>
                                            {new Date(coupon.expiresAt).toLocaleDateString()}
                                            {isExpired(coupon.expiresAt) && ' (Expired)'}
                                        </span>
                                    ) : (
                                        'Never'
                                    )}
                                </td>
                                <td className="p-3">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${coupon.active && !isExpired(coupon.expiresAt)
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}
                                    >
                                        {coupon.active && !isExpired(coupon.expiresAt) ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(coupon)}
                                            className="p-1 hover:bg-gold/10 rounded"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this coupon?')) {
                                                    deleteMutation.mutate(coupon._id);
                                                }
                                            }}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCoupons.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-neutral-500">
                                    No coupons found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="lux-card p-6 w-full max-w-md space-y-4">
                        <h2 className="font-display text-xl">
                            {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                className="w-full border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte uppercase"
                                placeholder="Coupon Code (e.g., SAVE20)"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                                <input
                                    className="border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte"
                                    placeholder={form.type === 'percentage' ? 'Discount %' : 'Discount $'}
                                    type="number"
                                    min="0"
                                    value={form.value}
                                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                                    required
                                />
                            </div>
                            <input
                                className="w-full border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte"
                                placeholder="Minimum Purchase (optional)"
                                type="number"
                                min="0"
                                value={form.minPurchase}
                                onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                            />
                            <div>
                                <label className="text-sm text-neutral-600 dark:text-neutral-400">Expiry Date (optional)</label>
                                <input
                                    className="w-full border border-gold/30 p-3 rounded-lg bg-white dark:bg-matte mt-1"
                                    type="date"
                                    value={form.expiresAt}
                                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                    className="rounded"
                                />
                                Active
                            </label>
                            <div className="flex gap-3">
                                <button type="submit" className="lux-btn-primary flex-1">
                                    {editingCoupon ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="lux-btn border border-gold/40 flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCoupons;
