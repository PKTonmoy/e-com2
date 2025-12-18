import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../utils/imageUrl.js';

const ProductSelectionModal = ({ isOpen, onClose, product, onConfirm, mode = 'checkout' }) => {
    const [selectedSize, setSelectedSize] = useState(
        product?.sizes?.[2] || product?.sizes?.[0] || null
    );
    const [quantity, setQuantity] = useState(1);

    if (!product) return null;

    const hasSizes = product.hasSizes !== false && product.sizes?.length > 0;
    const currentPrice = product.salePrice || product.price;

    const handleConfirm = () => {
        onConfirm({
            size: selectedSize,
            quantity: quantity,
            mode: mode
        });
    };

    const isCheckout = mode === 'checkout';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-ivory dark:bg-matte rounded-[2rem] overflow-hidden shadow-2xl border border-gold/20"
                    >
                        {/* Header / Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col sm:flex-row gap-6 p-8">
                            {/* Product Info Left (Image) */}
                            <div className="w-full sm:w-1/3 aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-gold/10">
                                <img
                                    src={getImageUrl(product.images?.[0])}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Selection Logic Right */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="font-display text-2xl text-matte dark:text-ivory leading-tight mb-1">
                                        {product.title}
                                    </h3>
                                    <p className="text-xl font-body font-semibold text-gold">
                                        ৳ {currentPrice * quantity}
                                    </p>
                                </div>

                                {/* Size Selection */}
                                {hasSizes && (
                                    <div className="space-y-3">
                                        <p className="text-xs uppercase tracking-widest font-semibold text-neutral-400">
                                            Select Size
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {product.sizes.map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-[44px] h-[44px] rounded-xl border-2 font-body font-medium transition-all duration-300 ${selectedSize === size
                                                        ? 'bg-gold border-gold text-white scale-105 shadow-lg shadow-gold/20'
                                                        : 'border-gold/20 hover:border-gold/40 text-neutral-600 dark:text-neutral-400'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Selection */}
                                <div className="space-y-3">
                                    <p className="text-xs uppercase tracking-widest font-semibold text-neutral-400">
                                        Quantity
                                    </p>
                                    <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 w-fit p-1 rounded-2xl border border-gold/10">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-black/50 transition-colors"
                                        >
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-display text-lg">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-black/50 transition-colors"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Button Footer */}
                        <div className="p-8 pt-0">
                            <button
                                onClick={handleConfirm}
                                className={`w-full py-4 rounded-2xl font-display text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] group ${isCheckout
                                    ? 'bg-matte dark:bg-ivory text-ivory dark:text-matte'
                                    : 'bg-gold text-white'
                                    }`}
                            >
                                {isCheckout ? (
                                    <>
                                        <ShoppingBagIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        Proceed to Checkout
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        Add to Bag
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-neutral-400 mt-4 uppercase tracking-[0.2em]">
                                {isCheckout ? 'Secure & Fast Luxury Checkout' : 'Luxury Shopping Experience'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProductSelectionModal;
