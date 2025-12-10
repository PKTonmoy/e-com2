import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrashIcon, StarIcon } from '@heroicons/react/24/solid';
import api from '../../lib/api.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { getImageUrl } from '../../utils/imageUrl.js';

const Reviews = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['admin-reviews'],
        queryFn: async () => {
            const res = await api.get('/reviews/admin/all');
            return res.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (reviewId) => {
            await api.delete(`/reviews/admin/${reviewId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-reviews']);
            addToast('Review deleted');
        },
        onError: (err) => {
            addToast(err.response?.data?.message || 'Failed to delete review');
        },
    });

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;
    const verifiedCount = reviews.filter((r) => r.purchaseVerified).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 max-w-7xl mx-auto">
            <h1 className="font-display text-xl sm:text-2xl text-matte dark:text-ivory">Reviews Monitoring</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="lux-card p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-neutral-500">Total Reviews</p>
                    <p className="text-2xl sm:text-3xl font-bold">{totalReviews}</p>
                </div>
                <div className="lux-card p-4">
                    <p className="text-sm text-neutral-500">Average Rating</p>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold">{averageRating}</p>
                        <StarIcon className="w-6 h-6 text-gold" />
                    </div>
                </div>
                <div className="lux-card p-4">
                    <p className="text-sm text-neutral-500">Verified Purchases</p>
                    <p className="text-3xl font-bold">{verifiedCount}</p>
                </div>
            </div>

            {/* Reviews Table */}
            <div className="lux-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gold/10">
                            <tr>
                                <th className="text-left p-4">Product</th>
                                <th className="text-left p-4">User</th>
                                <th className="text-left p-4">Rating</th>
                                <th className="text-left p-4">Comment</th>
                                <th className="text-left p-4">Date</th>
                                <th className="text-left p-4">Verified</th>
                                <th className="text-left p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                                        No reviews yet
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review._id} className="border-t border-gold/10 hover:bg-gold/5">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {review.productId?.images?.[0] && (
                                                    <img
                                                        src={getImageUrl(review.productId.images[0])}
                                                        alt={review.productId?.title}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                )}
                                                <span className="font-medium truncate max-w-[150px]">
                                                    {review.productId?.title || 'Deleted Product'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{review.userId?.name || 'Anonymous'}</p>
                                            <p className="text-xs text-neutral-500">{review.userId?.email}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <StarIcon
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= review.rating ? 'text-gold' : 'text-neutral-300'}`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="truncate max-w-[200px]" title={review.comment}>
                                                {review.comment}
                                            </p>
                                        </td>
                                        <td className="p-4 text-neutral-500">
                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="p-4">
                                            {review.purchaseVerified ? (
                                                <span className="text-xs bg-emerald-500/20 text-emerald-600 px-2 py-1 rounded-full">
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => deleteMutation.mutate(review._id)}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded transition"
                                                title="Delete review"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
