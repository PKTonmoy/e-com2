import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingBagIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../utils/imageUrl.js';
import { useBottomNav } from '../context/BottomNavContext.jsx';

const ProductSelectionModal = ({ isOpen, onClose, product, onConfirm, mode = 'checkout' }) => {
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [showSizeError, setShowSizeError] = useState(false);
    const { hideBottomNav, showBottomNav } = useBottomNav();

    // Hide/show bottom nav when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            hideBottomNav();
        } else {
            showBottomNav();
        }
    }, [isOpen, hideBottomNav, showBottomNav]);

    if (!product) return null;

    const hasSizes = product.hasSizes !== false && product.sizes?.length > 0;
    const currentPrice = product.salePrice || product.price;
    const needsSizeSelection = hasSizes && !selectedSize;

    const handleConfirm = () => {
        if (needsSizeSelection) {
            setShowSizeError(true);
            return;
        }
        onConfirm({
            size: selectedSize,
            quantity: quantity,
            mode: mode
        });
    };

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
        setShowSizeError(false);
    };

    const isCheckout = mode === 'checkout';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden">
                    {/* Backdrop - Explicitly full screen */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-white/20 dark:bg-black/60 backdrop-blur-3xl"
                    />

                    {/* Modal Content Wrapper */}
                    <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 100 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                transition: { type: 'spring', damping: 25, stiffness: 300 }
                            }}
                            exit={{ opacity: 0, scale: 0.95, y: 100 }}
                            className="relative w-full sm:max-w-lg bg-ivory dark:bg-matte rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-x border-t sm:border border-gold/10 pointer-events-auto mt-auto sm:mt-0"
                        >
                            {/* Mobile Drag Handle */}
                            <div className="sm:hidden w-12 h-1.5 bg-gold/20 rounded-full mx-auto mt-4 mb-2" />

                            {/* Header / Close - Repositioned for Mobile */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 sm:top-6 right-6 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-20"
                            >
                                <XMarkIcon className="w-5 h-5 text-matte dark:text-ivory" />
                            </button>

                            <div className="p-4 sm:p-8">
                                {/* Product Info Header - Compact for Mobile */}
                                <div className="flex flex-row sm:flex-row gap-4 sm:gap-6 items-center sm:items-start mb-6">
                                    {/* Image */}
                                    <div className="w-24 h-32 sm:w-1/3 sm:aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-white/50 dark:bg-neutral-800 flex-shrink-0 sm:border border-gold/10">
                                        <img
                                            src={getImageUrl(product.images?.[0])}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Title & Price */}
                                    <div className="flex-1">
                                        <h3 className="font-display text-xl sm:text-3xl text-matte dark:text-ivory leading-tight mb-1">
                                            {product.title}
                                        </h3>
                                        <p className="text-lg sm:text-2xl font-body font-bold text-gold">
                                            ৳ {currentPrice * quantity}
                                        </p>
                                    </div>
                                </div>

                                {/* Selection Logic */}
                                <div className="space-y-5">
                                    {/* Size Selection */}
                                    {hasSizes && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                                                    Select Size
                                                </p>
                                                <p className="text-[9px] sm:text-[10px] text-gold font-bold uppercase tracking-widest cursor-pointer hover:underline">
                                                    Size Guide
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                {product.sizes.map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => handleSizeSelect(size)}
                                                        className={`min-w-[44px] sm:min-w-[50px] h-[44px] sm:h-[50px] rounded-xl sm:rounded-2xl border font-body font-semibold transition-all duration-300 relative overflow-hidden group ${selectedSize === size
                                                            ? 'border-gold text-matte dark:text-ivory scale-105'
                                                            : showSizeError
                                                                ? 'border-red-400/60 hover:border-red-400 text-neutral-500'
                                                                : 'border-gold/20 hover:border-gold/40 text-neutral-500'
                                                            }`}
                                                    >
                                                        {selectedSize === size && (
                                                            <motion.div
                                                                layoutId="activeSize"
                                                                className="absolute inset-0 bg-gold/10"
                                                            />
                                                        )}
                                                        <span className="relative z-10 text-sm sm:text-base">{size}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Size Error Message */}
                                            <AnimatePresence>
                                                {showSizeError && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="flex items-center gap-2 text-red-500 mt-2"
                                                    >
                                                        <ExclamationCircleIcon className="w-4 h-4" />
                                                        <span className="text-xs font-medium">Please select a size to continue</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Quantity Selection */}
                                    <div className="space-y-3">
                                        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 px-1">
                                            Quantity
                                        </p>
                                        <div className="flex items-center gap-6 bg-matte/[0.03] dark:bg-white/[0.03] w-full sm:w-fit px-5 py-2.5 rounded-xl sm:rounded-2xl border border-gold/10 justify-between sm:justify-start">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                                className="p-1 rounded-lg hover:text-gold transition-colors disabled:opacity-30 disabled:hover:text-inherit disabled:cursor-not-allowed"
                                            >
                                                <MinusIcon className="w-5 h-5 sm:w-5 sm:h-5" />
                                            </button>
                                            <span className="w-8 text-center font-display text-lg sm:text-xl">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                                disabled={quantity >= product.stock}
                                                className="p-1 rounded-lg hover:text-gold transition-colors disabled:opacity-30 disabled:hover:text-inherit disabled:cursor-not-allowed"
                                            >
                                                <PlusIcon className="w-5 h-5 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button Footer */}
                            <div className="p-4 sm:p-8 pt-0 sm:pt-0">
                                <motion.button
                                    onClick={handleConfirm}
                                    animate={showSizeError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className={`w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-display text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg sm:shadow-xl relative overflow-hidden group ${isCheckout
                                        ? needsSizeSelection
                                            ? 'bg-matte/50 dark:bg-ivory/50 text-ivory/70 dark:text-matte/70 cursor-not-allowed'
                                            : 'bg-matte dark:bg-ivory text-ivory dark:text-matte'
                                        : needsSizeSelection
                                            ? 'bg-gold/50 text-white/70 cursor-not-allowed'
                                            : 'bg-gold text-white'
                                        }`}
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"
                                        style={{ skewX: -20 }}
                                    />
                                    {isCheckout ? (
                                        <>
                                            <ShoppingBagIcon className="w-6 h-6" />
                                            <span className="tracking-wide">{needsSizeSelection ? 'Select Size First' : 'Proceed to Checkout'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusIcon className="w-6 h-6" />
                                            <span className="tracking-wide">{needsSizeSelection ? 'Select Size First' : 'Add to Bag'}</span>
                                        </>
                                    )}
                                </motion.button>
                                <div className="flex items-center justify-center gap-3 mt-6">
                                    <span className="h-[1px] flex-1 bg-gold/10" />
                                    <p className="text-[10px] text-neutral-400 uppercase tracking-[0.25em] font-bold">
                                        {isCheckout ? 'Secure Luxury Checkout' : 'Exclusive Collection'}
                                    </p>
                                    <span className="h-[1px] flex-1 bg-gold/10" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProductSelectionModal;
