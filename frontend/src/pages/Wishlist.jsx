import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../store/useWishlist.js';
import { getImageUrl } from '../utils/imageUrl.js';

const Wishlist = () => {
  const { items, fetchWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <div className="lux-container py-12 space-y-4">
      <h1 className="lux-heading">Wishlist</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Save your coveted pieces for later.
      </p>

      {items.length === 0 ? (
        <div className="lux-card p-8 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Your wishlist is empty.</p>
          <Link to="/shop" className="lux-btn-primary mt-4">
            Discover Collection
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <div key={product._id} className="lux-card overflow-hidden">
              <Link to={`/product/${product.slug}`}>
                <div className="aspect-[4/5]">
                  <img
                    src={getImageUrl(product.images?.[0])}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
              <div className="p-4 space-y-2">
                {product.limitedEdition && <span className="lux-badge">Limited</span>}
                <Link to={`/product/${product.slug}`}>
                  <p className="font-display text-xl hover:text-gold">{product.title}</p>
                </Link>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  ৳{product.salePrice || product.price}
                </p>
                <button
                  onClick={() => removeFromWishlist(product._id)}
                  className="text-sm text-gold hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

