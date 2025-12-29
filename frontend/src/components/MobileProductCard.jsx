import { Link } from 'react-router-dom';
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { getImageUrl } from '../utils/imageUrl';
import { useWishlist } from '../store/useWishlist';
import { useToast } from './ToastProvider';

const MobileProductCard = ({
    product,
    onAddToCart,
    onBuyNow,
    isAddedToCart
}) => {
    // Determine sale state
    const isSale = product.salePrice && product.salePrice < product.price;

    const { items, addToWishlist, removeFromWishlist } = useWishlist();
    const { addToast } = useToast();
    const inWishlist = items.some(item => item._id === product._id);

    const handleWishlist = (e) => {
        e.preventDefault();
        if (inWishlist) {
            removeFromWishlist(product._id);
        } else {
            addToWishlist(product._id);
            addToast(`${product.title} added to your wishlist.`, {
                image: getImageUrl(product.images?.[0]),
                actionLabel: 'View Wishlist',
                actionLink: '/wishlist'
            });
        }
    };

    return (
        <div className="group relative flex flex-col w-full">
            {/* Image Container - Aspect 3:4 for luxury fashion feel (LV style) */}
            <Link
                to={`/product/${product.slug}`}
                className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F5F5F5] dark:bg-[#1A1A1A]"
            >
                {/* ... image ... */}
                <img
                    src={getImageUrl(product.images?.[0])}
                    alt={product.title}
                    loading="lazy"
                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Badges - Top Left - Smaller for mobile */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.limitedEdition && (
                        <div className="flex items-center justify-center rounded px-1.5 py-0.5 bg-[#333333]/90 backdrop-blur-md">
                            <SparklesIcon className="mr-0.5 h-2.5 w-2.5 text-[#D4AF37]" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[#D4AF37]">Limited</span>
                        </div>
                    )}
                </div>

                {/* Wishlist - Top Right - Smaller & Closer to Edge */}
                <button
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#1A1A1A]/40 backdrop-blur-md transition-all active:scale-95 border border-white/10 hover:bg-[#1A1A1A]/60"
                    onClick={handleWishlist}
                >
                    {inWishlist ? (
                        <HeartIconSolid className="h-4 w-4 text-gold drop-shadow-sm" />
                    ) : (
                        <HeartIcon className="h-4 w-4 text-white/70 hover:text-gold transition-colors" />
                    )}
                </button>


            </Link>

            {/* Product Details - Below Image */}
            <div className="flex flex-col pt-3 pb-4">
                {/* Title */}
                <Link to={`/product/${product.slug}`}>
                    <h3 className="font-display text-lg text-matte dark:text-ivory line-clamp-1 leading-tight">
                        {product.title}
                    </h3>
                </Link>

                {/* Price */}
                <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-body text-base font-medium text-matte dark:text-ivory">
                        ৳{product.salePrice || product.price}
                    </span>
                    {isSale && (
                        <span className="font-body text-xs text-neutral-400 line-through">
                            ৳{product.price}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileProductCard;
