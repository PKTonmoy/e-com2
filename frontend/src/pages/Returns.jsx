import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, TruckIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../lib/api.js';
import MobileHeader from '../components/MobileHeader';
import { useToast } from '../components/ToastProvider.jsx';
import { useState } from 'react';

const Returns = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [deletingReturnId, setDeletingReturnId] = useState(null);

    const { data: returns = [], isLoading } = useQuery({
        queryKey: ['my-returns'],
        queryFn: async () => {
            const res = await api.get('/returns/mine');
            return res.data;
        },
    });

    const deleteReturnMutation = useMutation({
        mutationFn: (id) => api.delete(`/returns/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-returns']);
            addToast('Return request removed from history', 'success');
            setDeletingReturnId(null);
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to delete return request', 'error');
            setDeletingReturnId(null);
        },
    });

    const handleDeleteReturn = (id) => {
        if (window.confirm('Are you sure you want to delete this return request from your history?')) {
            setDeletingReturnId(id);
            deleteReturnMutation.mutate(id);
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: ClockIcon },
            approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircleIcon },
            rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircleIcon },
            pickup_scheduled: { label: 'Pickup Scheduled', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: TruckIcon },
            in_transit: { label: 'In Transit', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', icon: TruckIcon },
            received: { label: 'Received', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', icon: ArchiveBoxIcon },
            completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircleIcon },
        };
        return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    };

    const getReasonLabel = (reason) => {
        const reasons = {
            defective: 'Defective Product',
            wrong_item: 'Wrong Item Received',
            not_as_described: 'Not as Described',
            other: 'Other',
        };
        return reasons[reason] || reason;
    };

    return (
        <div className="min-h-screen bg-ivory dark:bg-matte">
            <MobileHeader title="My Returns" subtitle="Track" />

            <div className="lux-container py-4 sm:py-12 space-y-6">
                <div className="hidden sm:flex items-center gap-4 mb-6">
                    <Link to="/orders" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <h1 className="lux-heading">Return Requests</h1>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : returns.length === 0 ? (
                    <div className="lux-card p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                            <ArchiveBoxIcon className="w-8 h-8 text-gold/40" />
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300">You haven't made any return requests yet.</p>
                        <Link to="/orders" className="inline-block mt-4 text-gold hover:underline">
                            View your orders
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {returns.map((returnReq) => {
                            const statusInfo = getStatusInfo(returnReq.status);
                            const StatusIcon = statusInfo.icon;

                            return (
                                <div key={returnReq._id} className="lux-card p-4 sm:p-6">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div>
                                            <p className="font-semibold text-matte dark:text-ivory">
                                                Return #{returnReq._id.slice(-8)}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                Order: {returnReq.orderNumber || returnReq.orderId?.orderNumber || 'N/A'}
                                            </p>
                                            <p className="text-xs text-neutral-400 mt-1">
                                                Requested on {new Date(returnReq.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${statusInfo.color}`}>
                                            <StatusIcon className="h-4 w-4" />
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Return Items */}
                                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 mt-4">
                                        <p className="text-sm font-medium mb-2">Return Items</p>
                                        <div className="space-y-2">
                                            {returnReq.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-sm">
                                                    {item.image && (
                                                        <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-medium">{item.title}</p>
                                                        <p className="text-xs text-neutral-500">Qty: {item.qty} × ৳{item.price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                        <p className="text-sm">
                                            <span className="font-medium">Reason:</span> {getReasonLabel(returnReq.reason)}
                                        </p>
                                        {returnReq.reasonDetails && (
                                            <p className="text-sm text-neutral-500 mt-1">{returnReq.reasonDetails}</p>
                                        )}
                                    </div>

                                    {/* Refund Info */}
                                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                                        <span className="font-medium">Refund Amount</span>
                                        <span className="text-lg font-semibold text-gold">৳{returnReq.refundAmount?.toFixed(2)}</span>
                                    </div>

                                    {/* Coupon Code if issued */}
                                    {returnReq.couponCode && (
                                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                                            <p className="text-xs text-green-600 dark:text-green-400 mb-1">Coupon Issued</p>
                                            <p className="font-mono font-bold text-lg text-green-700 dark:text-green-300">{returnReq.couponCode}</p>
                                        </div>
                                    )}

                                    {/* Admin Notes */}
                                    {returnReq.adminNotes && (
                                        <div className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                            <p className="text-xs font-medium mb-1">Admin Notes:</p>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-300">{returnReq.adminNotes}</p>
                                        </div>
                                    )}

                                    {returnReq.steadfastData?.trackingCode && (
                                        <div className="mt-3 text-sm text-neutral-500">
                                            <span className="font-medium">Pickup Tracking:</span> {returnReq.steadfastData.trackingCode}
                                        </div>
                                    )}

                                    {/* Delete Button - only for completed or rejected */}
                                    {['completed', 'rejected'].includes(returnReq.status) && (
                                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                                            <button
                                                onClick={() => handleDeleteReturn(returnReq._id)}
                                                disabled={deletingReturnId === returnReq._id}
                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-500 hover:text-red-600 bg-neutral-50 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                                {deletingReturnId === returnReq._id ? 'Deleting...' : 'Delete from History'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Returns;
