import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../store/useWishlist.js';
import { getImageUrl } from '../utils/imageUrl.js';
import MobileHeader from '../components/MobileHeader';

const Wishlist = () => {
  const { items, fetchWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <div className="min-h-screen bg-ivory dark:bg-matte">
      {/* Compact Mobile Header */}
      <MobileHeader title="Wishlist" subtitle="Coveted" />

      {/* Content */}
      <div className="lux-container py-4 sm:py-12 space-y-4">
        <div className="hidden sm:block">
          <h1 className="lux-heading">Wishlist</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Save your coveted pieces for later.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="lux-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gold/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">Your wishlist is empty.</p>
            <Link to="/shop" className="lux-btn-primary inline-block">
              Discover Collection
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <div key={product._id} className="lux-card overflow-hidden group">
                <Link to={`/product/${product.slug}`}>
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="p-3 sm:p-4 space-y-2">
                  {product.limitedEdition && <span className="lux-badge text-xs">Limited</span>}
                  <Link to={`/product/${product.slug}`}>
                    <p className="font-display text-sm sm:text-xl hover:text-gold line-clamp-1">{product.title}</p>
                  </Link>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      ৳{product.salePrice || product.price}
                    </p>
                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      className="p-1.5 rounded-full hover:bg-gold/10 transition-colors group/btn"
                      title="Remove from wishlist"
                    >
                      <svg className="w-4 h-4 text-neutral-400 group-hover/btn:text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
