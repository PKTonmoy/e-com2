/**
 * LimitedDropsCarousel - Premium Mobile-Only Hand-Scroll Carousel
 * 
 * A production-ready, accessible infinite-looping carousel optimized for mobile.
 * 
 * @prop {Array} items - Array of card data objects
 *   - id: unique identifier
 *   - imageUrl: image source URL
 *   - title: main heading
 *   - subtitle: secondary text (e.g., category)
 *   - price: formatted price string
 *   - badgeText: badge label (e.g., "LIMITED")
 * 
 * @example
 * <LimitedDropsCarousel 
 *   items={[
 *     { id: '1', imageUrl: '/img.jpg', title: 'Product', subtitle: 'Category', price: '৳999', badgeText: 'LIMITED' }
 *   ]} 
 * />
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import styles from './LimitedDropsCarousel.module.css';

const LimitedDropsCarousel = ({ items = [] }) => {
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const isJumping = useRef(false);
    const debounceTimer = useRef(null);

    const originalLength = items.length;

    // Duplicate items for infinite loop illusion
    const extendedItems = originalLength > 1 ? [...items, ...items] : items;

    // Card width calculation (82vw)
    const getCardWidth = useCallback(() => {
        if (!scrollRef.current?.firstElementChild) return 0;
        return scrollRef.current.firstElementChild.offsetWidth;
    }, []);

    const getGap = useCallback(() => {
        if (!scrollRef.current) return 16;
        const style = window.getComputedStyle(scrollRef.current);
        return parseInt(style.gap) || 16;
    }, []);

    // Initialize scroll position to first set
    useEffect(() => {
        if (!scrollRef.current || originalLength <= 1) {
            setIsReady(true);
            return;
        }

        // Wait for layout
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollLeft = 0;
                setIsReady(true);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [originalLength]);

    // Calculate active index from scroll position
    const calculateActiveIndex = useCallback(() => {
        if (!scrollRef.current || originalLength <= 1) return 0;

        const scrollLeft = scrollRef.current.scrollLeft;
        const cardWidth = getCardWidth();
        const gap = getGap();

        if (cardWidth === 0) return 0;

        const itemWidth = cardWidth + gap;
        const rawIndex = Math.round(scrollLeft / itemWidth);

        return rawIndex % originalLength;
    }, [originalLength, getCardWidth, getGap]);

    // Handle infinite loop repositioning
    const handleLoopJump = useCallback(() => {
        if (!scrollRef.current || originalLength <= 1 || isJumping.current) return;

        const container = scrollRef.current;
        const scrollLeft = container.scrollLeft;
        const cardWidth = getCardWidth();
        const gap = getGap();
        const itemWidth = cardWidth + gap;

        // Total width of one set of items
        const setWidth = originalLength * itemWidth;

        // Check if we need to jump
        // If scrolled into the second set (duplicate), jump back to first set
        if (scrollLeft >= setWidth - itemWidth / 2) {
            isJumping.current = true;
            container.style.scrollBehavior = 'auto';
            container.scrollLeft = scrollLeft - setWidth;
            container.style.scrollBehavior = '';

            requestAnimationFrame(() => {
                isJumping.current = false;
            });
        }
        // If scrolled before start (shouldn't happen with snap, but safety)
        else if (scrollLeft < -itemWidth / 4) {
            isJumping.current = true;
            container.style.scrollBehavior = 'auto';
            container.scrollLeft = scrollLeft + setWidth;
            container.style.scrollBehavior = '';

            requestAnimationFrame(() => {
                isJumping.current = false;
            });
        }
    }, [originalLength, getCardWidth, getGap]);

    // Debounced scroll handler
    const handleScroll = useCallback(() => {
        if (isJumping.current) return;

        // Update active index immediately for responsive feel
        const newIndex = calculateActiveIndex();
        setActiveIndex(newIndex);

        // Debounce the loop jump check
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            handleLoopJump();
        }, 100);
    }, [calculateActiveIndex, handleLoopJump]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (!scrollRef.current) return;

        const cardWidth = getCardWidth();
        const gap = getGap();
        const itemWidth = cardWidth + gap;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollRef.current.scrollBy({ left: -itemWidth, behavior: 'smooth' });
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
    }, [getCardWidth, getGap]);

    // Navigate to specific index via indicator click
    const goToIndex = useCallback((index) => {
        if (!scrollRef.current) return;

        const cardWidth = getCardWidth();
        const gap = getGap();
        const itemWidth = cardWidth + gap;

        scrollRef.current.scrollTo({
            left: index * itemWidth,
            behavior: 'smooth'
        });
    }, [getCardWidth, getGap]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    // Don't render if no items
    if (originalLength === 0) return null;

    return (
        <div className="md:hidden relative" role="region" aria-label="Limited Drops Carousel">
            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                className={`
          flex overflow-x-auto snap-x snap-mandatory scrollbar-hide
          gap-4 px-4 pb-2
          ${!isReady ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `}
                style={{
                    WebkitOverflowScrolling: 'touch',
                    scrollPaddingLeft: '16px'
                }}
            >
                {extendedItems.map((item, index) => {
                    const isClone = index >= originalLength;
                    const uniqueKey = `${item.id}-${isClone ? 'clone' : 'orig'}-${index}`;

                    return (
                        <Link
                            key={uniqueKey}
                            to={`/product/${item.slug || item.id}`}
                            tabIndex={isClone ? -1 : 0}
                            aria-hidden={isClone}
                            className={`
                ${styles.card}
                flex-shrink-0 snap-center
                w-[82vw] max-w-[340px]
                bg-white dark:bg-neutral-900 
                rounded-xl overflow-hidden
                border border-neutral-100 dark:border-neutral-800
                focus:outline-none
              `}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${item.title}, ${item.price}`}
                        >
                            {/* Image */}
                            <div className="aspect-[4/5] relative overflow-hidden bg-neutral-50 dark:bg-neutral-800">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                    loading={index < 3 ? 'eager' : 'lazy'}
                                />

                                {/* Badge */}
                                {item.badgeText && (
                                    <div className="absolute top-3 left-3">
                                        <span className={`
                      ${styles.badgeShimmer}
                      inline-flex items-center gap-1.5 
                      px-3 py-1.5 
                      text-[10px] uppercase tracking-widest 
                      bg-white/90 dark:bg-matte/90 backdrop-blur-sm 
                      text-gold font-medium 
                      rounded-sm border border-gold/10 shadow-sm
                    `}>
                                            <SparklesIcon className="h-3 w-3" />
                                            {item.badgeText}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-1.5">
                                <h3 className="font-display text-lg leading-tight text-matte dark:text-ivory line-clamp-1">
                                    {item.title}
                                </h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-base font-semibold text-matte dark:text-ivory">
                                        {item.price}
                                    </span>
                                    {item.subtitle && (
                                        <span className="text-xs text-neutral-400 font-light">
                                            • {item.subtitle}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Premium Indicator Dots - Max 5 visible */}
            {originalLength > 1 && (
                <div
                    className="flex items-center justify-center gap-2 mt-5 px-4"
                    role="tablist"
                    aria-label="Carousel navigation"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {(() => {
                        const MAX_DOTS = 5;
                        const totalItems = originalLength;

                        // If total items <= MAX_DOTS, show all
                        if (totalItems <= MAX_DOTS) {
                            return items.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => goToIndex(idx)}
                                    className={`
                                        ${styles.indicatorDot}
                                        ${idx === activeIndex ? styles.indicatorDotActive : ''}
                                    `}
                                    role="tab"
                                    aria-selected={idx === activeIndex}
                                    aria-label={`Go to slide ${idx + 1} of ${totalItems}`}
                                />
                            ));
                        }

                        // Calculate visible range with sliding window
                        let startIdx = Math.max(0, activeIndex - Math.floor(MAX_DOTS / 2));
                        let endIdx = startIdx + MAX_DOTS;

                        // Adjust if at the end
                        if (endIdx > totalItems) {
                            endIdx = totalItems;
                            startIdx = Math.max(0, endIdx - MAX_DOTS);
                        }

                        const visibleIndices = [];
                        for (let i = startIdx; i < endIdx; i++) {
                            visibleIndices.push(i);
                        }

                        return visibleIndices.map((idx) => (
                            <button
                                key={idx}
                                onClick={() => goToIndex(idx)}
                                className={`
                                    ${styles.indicatorDot}
                                    ${idx === activeIndex ? styles.indicatorDotActive : ''}
                                `}
                                role="tab"
                                aria-selected={idx === activeIndex}
                                aria-label={`Go to slide ${idx + 1} of ${totalItems}`}
                            />
                        ));
                    })()}
                </div>
            )}
        </div>
    );
};

export default LimitedDropsCarousel;
