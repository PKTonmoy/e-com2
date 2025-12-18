import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import api from '../lib/api.js';
import { useCart } from '../store/useCart.js';
import { useWishlist } from '../store/useWishlist.js';
import { socket, connectSocket, disconnectSocket } from '../lib/socket.js';
import { useToast } from '../components/ToastProvider.jsx';
import { getImageUrl } from '../utils/imageUrl.js';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ProductSelectionModal from '../components/ProductSelectionModal.jsx';

const Product = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);
  const setItems = useCart((s) => s.setItems);
  const { fetchWishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [liveStock, setLiveStock] = useState(null);
  const { addToast } = useToast();
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [canReview, setCanReview] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState('checkout');





  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data;
    },
  });

  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: async () => {
      if (!product?._id) return null;
      const res = await api.get(`/reviews/${product._id}`);
      return res.data;
    },
    enabled: !!product?._id,
  });

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    if (!product) return;

    // Set default size (only if product has sizes enabled)
    if (product.hasSizes !== false && product.sizes?.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[2] || product.sizes[0]); // Default to L or first
    }

    // Connect socket
    connectSocket();
    setLiveStock(null);
    setSelectedImageIndex(0);

    // Reset live stock when product changes
    setLiveStock(null);

    // Listen for product updates
    const handleProductUpdate = (updatedProduct) => {
      if (updatedProduct._id === product._id || updatedProduct.slug === product.slug) {
        setLiveStock(updatedProduct.stock);
      }
    };

    socket.on('product:update', handleProductUpdate);

    return () => {
      socket.off('product:update', handleProductUpdate);
    };
  }, [product]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Check if user can review
  useEffect(() => {
    const checkCanReview = async () => {
      if (!product?._id) return;
      try {
        const res = await api.get(`/reviews/can-review/${product._id}`);
        setCanReview(res.data);
      } catch (err) {
        setCanReview({ canReview: false, reason: 'not_logged_in' });
      }
    };
    checkCanReview();
  }, [product?._id]);

  if (!product) return null;

  const currentStock = liveStock !== null ? liveStock : product.stock;
  const inWishlist = isInWishlist(product._id);
  const hasSizes = product.hasSizes !== false && product.sizes?.length > 0;
  const sizes = hasSizes ? product.sizes : [];

  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product._id);
    }
  };

  const handleAddToCart = () => {
    setSelectionMode('cart');
    setIsBuyNowOpen(true);
  };

  const handleBuyNow = () => {
    setSelectionMode('checkout');
    setIsBuyNowOpen(true);
  };

  const onConfirmSelection = (data) => {
    if (data.mode === 'cart') {
      const result = addItem(product, product.variants?.[0]?.id, currentStock, data.size);
      if (result.success) {
        setIsBuyNowOpen(false);
        const sizeText = data.size ? ` (${data.size})` : '';
        addToast(`${product.title}${sizeText} added to bag!`);
      } else {
        addToast(result.message || 'Could not add to bag');
      }
      return;
    }

    // Default to checkout mode
    const newItem = {
      productId: product._id,
      variantId: product.variants?.[0]?.id,
      qty: data.quantity,
      price: product.salePrice || product.price,
      title: product.title,
      sku: product.sku,
      stock: currentStock,
      selectedSize: data.size,
      image: getImageUrl(product.images?.[0]),
    };
    setItems([newItem]);
    navigate('/checkout');
  };

  const handleGiveReview = () => {
    if (!canReview) {
      addToast('Please log in to review');
      navigate('/login');
      return;
    }
    if (canReview.reason === 'not_purchased') {
      addToast('Please purchase this product first to review');
      handleBuyNow();
      return;
    }
    if (canReview.reason === 'already_reviewed') {
      addToast('You have already reviewed this product');
      return;
    }
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    try {
      await api.post(`/reviews/${product._id}`, reviewForm);
      addToast('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      refetchReviews();
    } catch (err) {
      if (err.response?.data?.redirectToPurchase) {
        addToast('Please purchase this product first');
        handleBuyNow();
      } else {
        addToast(err.response?.data?.message || 'Failed to submit review');
      }
    }
  };

  const stats = reviewsData?.stats || { totalReviews: 0, averageRating: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const reviews = reviewsData?.reviews || [];
  const images = product.images || [];
  const mainImage = images[selectedImageIndex] || images[0];

  // ADD THESE TWO FUNCTIONS:
  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };



  return (
    <div className="lux-container py-10 space-y-10">
      {/* Product Info Grid */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="space-y-3">
            {/* Main Image with Navigation */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200">
              <img
                src={getImageUrl(mainImage)}
                alt={product.title}
                className="h-full w-full object-cover transition-all duration-300"
              />

              {/* Navigation Arrows - Only show if multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
                    aria-label="Previous image"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition"
                    aria-label="Next image"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery - Only show if multiple images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-20 rounded-md overflow-hidden transition-all flex-shrink-0 ${idx === selectedImageIndex
                      ? 'ring-2 ring-gold border border-gold'
                      : 'border border-gold/20 hover:ring-1 hover:ring-gold/50'
                      }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Product ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Details */}
        <div className="space-y-4">
          {product.limitedEdition && <span className="lux-badge">Limited Edition</span>}
          <h1 className="font-display text-3xl">{product.title}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: product.descriptionHTML }} />
          <p className="text-xl">
            <span className="text-2xl">৳</span> {product.salePrice || product.price}{' '}
            {product.salePrice && <span className="text-sm text-neutral-500 line-through"><span className="text-base">৳</span> {product.price}</span>}
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-200">
            {currentStock > 0 ? (
              <>
                In Stock ({currentStock} left)
                {liveStock !== null && <span className="ml-2 text-xs text-gold">(Updated live)</span>}
              </>
            ) : (
              'Out of Stock'
            )}
          </p>

          {/* Available Sizes - Refined Premium UI */}
          {hasSizes && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gold rounded-full" />
                  <p className="text-sm font-display tracking-wider uppercase text-neutral-500 dark:text-neutral-400">Available Sizes</p>
                </div>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs font-body font-medium text-gold/80 hover:text-gold transition-colors hover:underline"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map((size) => (
                  <div
                    key={size}
                    className="relative group"
                  >
                    <div className="absolute -inset-1 bg-gold/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative px-5 py-2.5 rounded-xl border border-gold/20 bg-white/50 dark:bg-black/20 backdrop-blur-sm text-sm font-display font-medium text-matte dark:text-ivory shadow-sm transition-all duration-300">
                      {size}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buy Now & Add to Cart Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              className="lux-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
              disabled={currentStock === 0}
              onClick={handleBuyNow}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {currentStock === 0 ? 'Out of Stock' : 'Buy this Item'}
            </button>
            <button
              className="lux-btn border-2 border-gold/60 flex-1 hover:bg-gold/10 transition disabled:opacity-40"
              disabled={currentStock === 0}
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          </div>

          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            className="lux-btn border border-gold/40 flex items-center gap-2 w-full justify-center"
          >
            {inWishlist ? (
              <>
                <HeartSolidIcon className="h-5 w-5 text-gold" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <HeartIcon className="h-5 w-5" />
                <span>Save to wishlist</span>
              </>
            )}
          </button>

          {/* Details Card */}
          <div className="lux-card p-4">
            <p className="font-semibold">Details</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Complimentary white-glove delivery. Returns within 30 days. Certificate of authenticity included.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specifications, Reviews */}
      <div className="border-b border-gold/20">
        <div className="flex gap-6">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize transition border-b-2 ${activeTab === tab
                ? 'border-gold text-gold'
                : 'border-transparent hover:text-gold/70'
                }`}
            >
              {tab === 'reviews' ? `Reviews` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="lux-card p-6">
        {activeTab === 'description' && (
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.descriptionHTML || 'No description available.' }} />
        )}

        {activeTab === 'specifications' && (
          <div className="space-y-2 text-sm">
            <p><strong>SKU:</strong> {product.sku}</p>
            <p><strong>Category:</strong> {product.category || 'N/A'}</p>
            {hasSizes && <p><strong>Available Sizes:</strong> {sizes.join(', ')}</p>}
            <p><strong>Stock:</strong> {currentStock} units</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="grid gap-6 md:grid-cols-[auto_1fr]">
              <div className="text-center space-y-1">
                <p className="text-5xl font-bold">{stats.averageRating}</p>
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    star <= Math.round(stats.averageRating) ? (
                      <StarSolidIcon key={star} className="w-5 h-5 text-gold" />
                    ) : (
                      <StarIcon key={star} className="w-5 h-5 text-gold/40" />
                    )
                  ))}
                </div>
                <p className="text-sm text-neutral-500">{stats.totalReviews} Reviews</p>
              </div>

              {/* Rating Bars */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingCounts[rating] || 0;
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-1 w-8">
                        <StarSolidIcon className="w-3 h-3 text-gold" />
                        {rating}
                      </span>
                      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-neutral-500">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4 border-t border-gold/20 pt-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review._id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-sm font-bold">
                      {review.userId?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.userId?.name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            star <= review.rating ? (
                              <StarSolidIcon key={star} className="w-3 h-3 text-gold" />
                            ) : (
                              <StarIcon key={star} className="w-3 h-3 text-gold/40" />
                            )
                          ))}
                        </div>
                        <span className="text-xs text-neutral-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 pl-10">{review.comment}</p>
                </div>
              ))}
            </div>

            {/* Give Your Review Button */}
            <button
              onClick={handleGiveReview}
              className="w-full lux-btn border-2 border-gold/60 hover:bg-gold/10 transition py-3"
            >
              {reviews.length > 5 ? 'See All Reviews' : 'Give Your Review'}
            </button>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-white dark:bg-matte rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl mb-4">Size Guide</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="py-2 text-left">Size</th>
                  <th className="py-2">Chest (in)</th>
                  <th className="py-2">Length (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['S', '36-38', '27'],
                  ['M', '38-40', '28'],
                  ['L', '40-42', '29'],
                  ['XL', '42-44', '30'],
                  ['XXL', '44-46', '31'],
                  ['3XL', '46-48', '32'],
                ].map(([size, chest, length]) => (
                  <tr key={size} className="border-b border-gold/10">
                    <td className="py-2 font-semibold">{size}</td>
                    <td className="py-2 text-center">{chest}</td>
                    <td className="py-2 text-center">{length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowSizeGuide(false)} className="mt-4 lux-btn-primary w-full">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white dark:bg-matte rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Your Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                      {star <= reviewForm.rating ? (
                        <StarSolidIcon className="w-8 h-8 text-gold" />
                      ) : (
                        <StarIcon className="w-8 h-8 text-gold/40" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Your Review</p>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your experience with this product..."
                  className="w-full border border-gold/30 rounded-lg p-3 min-h-[100px] text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowReviewModal(false)} className="flex-1 lux-btn border border-gold/40">
                  Cancel
                </button>
                <button onClick={submitReview} className="flex-1 lux-btn-primary">
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      <ProductSelectionModal
        isOpen={isBuyNowOpen}
        onClose={() => setIsBuyNowOpen(false)}
        product={product}
        onConfirm={onConfirmSelection}
        mode={selectionMode}
      />
    </div>
  );
};

export default Product;
