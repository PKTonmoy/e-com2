import { Link } from 'react-router-dom';
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { getImageUrl } from '../utils/imageUrl';
import { useWishlist } from '../store/useWishlist';
import { useToast } from './ToastProvider';

const DesktopProductCard = ({
    product
}) => {
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

    // Determine sale state
    const isSale = product.salePrice && product.salePrice < product.price;

    return (
        <div className="group flex flex-col w-full bg-transparent">
            {/* Image Container - Aspect 4:5 for premium vertical feel */}
            <Link
                to={`/product/${product.slug}`}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#F0F0F0] dark:bg-[#151515] mb-4"
            >
                {/* Product Image - Full bleed/Cover for maximum size */}
                <div className="h-full w-full">
                    <img
                        src={getImageUrl(product.images?.[0])}
                        alt={product.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-105"
                    />
                </div>

                {/* Badges - Floating with padding */}
                {product.limitedEdition && (
                    <div className="absolute top-3 left-3 flex items-center justify-center rounded-sm bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm dark:bg-black/70">
                        <SparklesIcon className="mr-1 h-3 w-3 text-gold" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-black dark:text-white">Limited</span>
                    </div>
                )}

                <button
                    className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95 dark:bg-black/30 dark:border-white/10 dark:hover:bg-black/50"
                    onClick={handleWishlist}
                >
                    {inWishlist ? (
                        <HeartIconSolid className="h-5 w-5 text-gold drop-shadow-sm" />
                    ) : (
                        <HeartIcon className="h-5 w-5 text-neutral-800 transition-colors group-hover:text-gold dark:text-white" />
                    )}
                </button>
            </Link>

            {/* Product Details - Clean, Minimal, Centered or Left Aligned */}
            <div className="flex flex-col space-y-1.5 px-1">
                {/* Title and Price Row for efficiency or Stacked? LV uses Stacked. */}
                <Link to={`/product/${product.slug}`}>
                    <h3 className="font-display text-lg font-medium text-matte dark:text-white leading-snug line-clamp-1 group-hover:underline decoration-gold decoration-1 underline-offset-4">
                        {product.title}
                    </h3>
                </Link>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="font-body text-base font-light text-neutral-600 dark:text-neutral-400">
                        ৳{product.salePrice || product.price}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DesktopProductCard;
