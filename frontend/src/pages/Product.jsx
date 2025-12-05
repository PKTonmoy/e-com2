import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../lib/api.js';
import { useCart } from '../store/useCart.js';
import { useWishlist } from '../store/useWishlist.js';
import { socket, connectSocket, disconnectSocket } from '../lib/socket.js';
import { useToast } from '../components/ToastProvider.jsx';

const Product = () => {
  const { slug } = useParams();
  const addItem = useCart((s) => s.addItem);
  const { fetchWishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [liveStock, setLiveStock] = useState(null);
  const { addToast } = useToast();

  const { data: product } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data;
    },
  });

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    if (!product) return;

    // Connect socket
    connectSocket();

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

  if (!product) return null;

  const currentStock = liveStock !== null ? liveStock : product.stock;
  const inWishlist = isInWishlist(product._id);

  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product._id);
    }
  };

  return (
    <div className="lux-container py-10 grid gap-10 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200">
          <img src={product.images?.[0]} alt={product.title} className="h-full w-full object-cover" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {product.images?.slice(0, 4).map((img, idx) => (
            <img key={idx} src={img} alt={product.title} className="h-20 w-full rounded-md object-cover" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {product.limitedEdition && <span className="lux-badge">Limited Edition</span>}
        <h1 className="font-display text-3xl">{product.title}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: product.descriptionHTML }} />
        <p className="text-xl">
          ${product.salePrice || product.price}{' '}
          {product.salePrice && <span className="text-sm text-neutral-500 line-through">${product.price}</span>}
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
        <div className="flex space-x-3">
          <button
            className="lux-btn-primary disabled:opacity-40"
            disabled={currentStock === 0}
            onClick={() => {
              const result = addItem(product, product.variants?.[0]?.id, currentStock);
              if (result.success) {
                addToast(`${product.title} added to cart!`);
              } else {
                addToast(result.message || 'Could not add to cart');
              }
            }}
          >
            {currentStock === 0 ? 'Out of Stock' : 'Add to cart'}
          </button>
          <button
            onClick={toggleWishlist}
            className="lux-btn border border-gold/40 flex items-center gap-2"
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
        </div>
        <div className="lux-card p-4">
          <p className="font-semibold">Details</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Complimentary white-glove delivery. Returns within 30 days. Certificate of authenticity included.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Product;

