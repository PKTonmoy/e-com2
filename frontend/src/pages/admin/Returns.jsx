import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, XMarkIcon, TruckIcon, ArchiveBoxIcon, GiftIcon, BanknotesIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';

const AdminReturns = () => {
    const [expandedReturn, setExpandedReturn] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [completeModal, setCompleteModal] = useState(null);
    const qc = useQueryClient();
    const { addToast } = useToast();

    const { data: returns = [], isLoading } = useQuery({
        queryKey: ['admin-returns', statusFilter],
        queryFn: async () => {
            const params = statusFilter ? { status: statusFilter } : {};
            const res = await api.get('/returns', { params });
            return res.data;
        },
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: ({ id, adminNotes }) => api.put(`/returns/${id}/approve`, { adminNotes }),
        onSuccess: () => {
            qc.invalidateQueries(['admin-returns']);
            addToast('Return request approved. Pickup scheduled.', 'success');
            setProcessingId(null);
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to approve', 'error');
            setProcessingId(null);
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: ({ id, adminNotes }) => api.put(`/returns/${id}/reject`, { adminNotes }),
        onSuccess: () => {
            qc.invalidateQueries(['admin-returns']);
            addToast('Return request rejected.', 'success');
            setProcessingId(null);
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to reject', 'error');
            setProcessingId(null);
        },
    });

    // Mark received mutation
    const receivedMutation = useMutation({
        mutationFn: (id) => api.put(`/returns/${id}/received`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-returns']);
            addToast('Products marked as received. Stock restored.', 'success');
            setProcessingId(null);
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to mark as received', 'error');
            setProcessingId(null);
        },
    });

    // Complete return mutation
    const completeMutation = useMutation({
        mutationFn: ({ id, refundType, adminNotes }) => api.put(`/returns/${id}/complete`, { refundType, adminNotes }),
        onSuccess: (data) => {
            qc.invalidateQueries(['admin-returns']);
            const msg = data.data.refundType === 'coupon'
                ? `Return completed. Coupon ${data.data.couponCode} issued.`
                : 'Return completed. Refund marked for processing.';
            addToast(msg, 'success');
            setCompleteModal(null);
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to complete', 'error');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/returns/${id}`),
        onSuccess: () => {
            qc.invalidateQueries(['admin-returns']);
            addToast('Return request deleted from history.', 'success');
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to delete', 'error');
        },
    });

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
            approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
            rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
            pickup_scheduled: { label: 'Pickup Scheduled', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
            in_transit: { label: 'In Transit', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
            received: { label: 'Received', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
            completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
        };
        return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    };

    const getReasonLabel = (reason) => {
        const reasons = {
            defective: 'Defective Product',
            wrong_item: 'Wrong Item',
            not_as_described: 'Not as Described',
            other: 'Other',
        };
        return reasons[reason] || reason;
    };

    const handleApprove = (returnReq) => {
        const notes = prompt('Admin notes (optional):');
        setProcessingId(returnReq._id);
        approveMutation.mutate({ id: returnReq._id, adminNotes: notes });
    };

    const handleReject = (returnReq) => {
        const notes = prompt('Rejection reason:');
        if (!notes) {
            addToast('Please provide a rejection reason', 'error');
            return;
        }
        setProcessingId(returnReq._id);
        rejectMutation.mutate({ id: returnReq._id, adminNotes: notes });
    };

    const handleMarkReceived = (returnReq) => {
        if (window.confirm('Mark products as received at warehouse? This will restore stock.')) {
            setProcessingId(returnReq._id);
            receivedMutation.mutate(returnReq._id);
        }
    };

    const handleComplete = (refundType) => {
        if (!completeModal) return;
        const notes = refundType === 'refund'
            ? 'Refund to be processed manually'
            : 'Coupon issued for store credit';
        completeMutation.mutate({ id: completeModal._id, refundType, adminNotes: notes });

    };

    const handleDelete = (returnReq) => {
        if (window.confirm('Are you sure you want to delete this return request from history?')) {
            deleteMutation.mutate(returnReq._id);
        }
    };

    const statusOptions = ['', 'pending', 'approved', 'pickup_scheduled', 'in_transit', 'received', 'completed', 'rejected'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-display text-matte dark:text-ivory">Return Requests</h1>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
                >
                    <option value="">All Status</option>
                    {statusOptions.filter(s => s).map(s => (
                        <option key={s} value={s}>{getStatusInfo(s).label}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
            ) : returns.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 text-center border border-neutral-200 dark:border-neutral-800">
                    <ArchiveBoxIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">No return requests found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {returns.map((returnReq) => {
                        const isExpanded = expandedReturn === returnReq._id;
                        const statusInfo = getStatusInfo(returnReq.status);
                        const isProcessing = processingId === returnReq._id;

                        return (
                            <div key={returnReq._id} className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
                                {/* Header */}
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-semibold text-matte dark:text-ivory">Return #{returnReq._id.slice(-8)}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-500">
                                            Order: {returnReq.orderNumber || returnReq.orderId?.orderNumber}
                                        </p>
                                        <p className="text-sm text-neutral-500">
                                            Customer: {returnReq.userId?.name} ({returnReq.userId?.email})
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            {new Date(returnReq.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-semibold text-lg text-gold">৳{returnReq.refundAmount?.toFixed(2)}</p>
                                        <button
                                            onClick={() => setExpandedReturn(isExpanded ? null : returnReq._id)}
                                            className="text-xs text-gold hover:underline flex items-center gap-1 mt-2"
                                        >
                                            {isExpanded ? 'Hide' : 'Details'}
                                            {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Actions based on status */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {returnReq.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(returnReq)}
                                                disabled={isProcessing}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                                {isProcessing ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(returnReq)}
                                                disabled={isProcessing}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {['approved', 'pickup_scheduled', 'in_transit'].includes(returnReq.status) && (
                                        <button
                                            onClick={() => handleMarkReceived(returnReq)}
                                            disabled={isProcessing}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            <ArchiveBoxIcon className="h-4 w-4" />
                                            {isProcessing ? 'Processing...' : 'Mark Received'}
                                        </button>
                                    )}

                                    {returnReq.status === 'received' && (
                                        <button
                                            onClick={() => setCompleteModal(returnReq)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold text-matte rounded-lg text-sm hover:bg-amber-400"
                                        >
                                            <CheckIcon className="h-4 w-4" />
                                            Complete Return
                                        </button>
                                    )}

                                    {returnReq.couponCode && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm">
                                            <GiftIcon className="h-4 w-4" />
                                            Coupon: {returnReq.couponCode}
                                        </span>
                                    )}


                                    {/* Delete Button - only for completed or rejected */}
                                    {['completed', 'rejected'].includes(returnReq.status) && (
                                        <button
                                            onClick={() => handleDelete(returnReq)}
                                            disabled={deleteMutation.isPending}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Delete
                                        </button>
                                    )}
                                </div>

                                {/* Expanded Details */}
                                {
                                    isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                                            {/* Items */}
                                            <div>
                                                <p className="font-medium text-sm mb-2">Return Items</p>
                                                <div className="space-y-2">
                                                    {returnReq.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                                            {item.image && (
                                                                <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                                                            )}
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm">{item.title}</p>
                                                                <p className="text-xs text-neutral-500">
                                                                    {item.selectedSize && `Size: ${item.selectedSize} • `}
                                                                    Qty: {item.qty} × ৳{item.price}
                                                                </p>
                                                            </div>
                                                            <p className="font-semibold">৳{(item.qty * item.price).toFixed(2)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Reason */}
                                            <div>
                                                <p className="font-medium text-sm">Reason</p>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                                    {getReasonLabel(returnReq.reason)}
                                                    {returnReq.reasonDetails && ` - ${returnReq.reasonDetails}`}
                                                </p>
                                            </div>

                                            {/* Shipping Address */}
                                            {returnReq.orderId?.shipping && (
                                                <div>
                                                    <p className="font-medium text-sm">Pickup Address</p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                                        {returnReq.orderId.shipping.name}, {returnReq.orderId.shipping.phone}<br />
                                                        {returnReq.orderId.shipping.address}, {returnReq.orderId.shipping.city}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Steadfast Info */}
                                            {returnReq.steadfastData?.trackingCode && (
                                                <div>
                                                    <p className="font-medium text-sm">Pickup Tracking</p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                                        ID: {returnReq.steadfastData.consignmentId} •
                                                        Code: {returnReq.steadfastData.trackingCode}
                                                    </p>
                                                </div>
                                            )}

                                            {returnReq.steadfastData?.error && (
                                                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                    <p className="text-sm text-red-600 dark:text-red-400">
                                                        Courier Error: {returnReq.steadfastData.error}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Admin Notes */}
                                            {returnReq.adminNotes && (
                                                <div>
                                                    <p className="font-medium text-sm">Admin Notes</p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{returnReq.adminNotes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                            </div>
                        );
                    })}
                </div>
            )
            }

            {/* Complete Return Modal */}
            {
                completeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full mx-4">
                            <h2 className="text-xl font-display mb-4">Complete Return</h2>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                                Choose how to refund ৳{completeModal.refundAmount?.toFixed(2)} to the customer:
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleComplete('coupon')}
                                    disabled={completeMutation.isPending}
                                    className="w-full flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-gold transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                                        <GiftIcon className="h-6 w-6 text-gold" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">Issue Coupon</p>
                                        <p className="text-sm text-neutral-500">Customer gets store credit coupon</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleComplete('refund')}
                                    disabled={completeMutation.isPending}
                                    className="w-full flex items-center gap-3 p-4 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-gold transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                        <BanknotesIcon className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">Process Refund</p>
                                        <p className="text-sm text-neutral-500">Mark for manual refund processing</p>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setCompleteModal(null)}
                                className="w-full mt-4 py-2 text-neutral-500 hover:text-neutral-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminReturns;
