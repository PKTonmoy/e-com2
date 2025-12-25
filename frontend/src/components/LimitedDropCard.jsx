/**
 * LimitedDropCard - Premium animated card
 * Product details rise up with animation when card is visible
 */
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

const LimitedDropCard = ({
    id,
    slug,
    imageUrl,
    title,
    subtitle,
    price,
    badgeText = 'LIMITED',
    className = ''
}) => {
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    // Intersection Observer to detect when card is in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <Link
            ref={cardRef}
            to={`/product/${slug || id}`}
            className={`
        limited-drop-card group
        relative overflow-hidden rounded-3xl cursor-pointer
        bg-matte
        border-2 border-gold/30
        transition-all duration-500 ease-out
        hover:shadow-2xl hover:shadow-gold/30
        hover:border-gold/60
        active:scale-[0.98] active:border-gold
        ${className}
      `}
        >
            {/* Top-left animated circle */}
            <div
                className="
          absolute w-24 h-24 
          -top-12 -left-12
          rounded-full 
          bg-gradient-to-br from-gold/40 to-gold/20
          transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          scale-0 opacity-0
          group-hover:scale-[8] group-hover:opacity-100
          group-hover:-top-8 group-hover:-left-8
          group-active:scale-[8] group-active:opacity-100
          group-active:-top-8 group-active:-left-8
        "
            />

            {/* Bottom-right animated circle */}
            <div
                className="
          absolute w-24 h-24 
          -bottom-12 -right-12
          rounded-full 
          bg-gradient-to-tl from-gold/50 to-gold/30
          transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-75
          scale-0 opacity-0
          group-hover:scale-[10] group-hover:opacity-100
          group-hover:-bottom-8 group-hover:-right-8
          group-active:scale-[10] group-active:opacity-100
          group-active:-bottom-8 group-active:-right-8
        "
            />

            {/* Product Image Container */}
            <div className="relative w-full h-full p-2 md:p-3 z-10">
                <div className="
          w-full h-full rounded-2xl overflow-hidden
          bg-neutral-900
          transition-all duration-500 ease-out
          group-hover:scale-[0.92] group-hover:rounded-3xl
          group-active:scale-[0.92] group-active:rounded-3xl
        ">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="
              w-full h-full object-cover
              transition-transform duration-700 ease-out
            "
                    />
                </div>

                {/* Badge */}
                {badgeText && (
                    <div className="absolute top-4 left-4 z-20">
                        <span className="
              inline-flex items-center gap-1.5 
              px-2.5 py-1 md:px-3 md:py-1.5 
              text-[9px] md:text-[10px] uppercase tracking-widest 
              bg-matte/90 backdrop-blur-sm 
              text-gold font-medium 
              rounded-full border border-gold/30 shadow-lg
              transition-all duration-300
              group-hover:bg-gold group-hover:text-matte
              group-active:bg-gold group-active:text-matte
            ">
                            <SparklesIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                            {badgeText}
                        </span>
                    </div>
                )}
            </div>

            {/* Product Details - Rise up animation when visible */}
            <div
                className={`
          absolute bottom-0 left-0 right-0
          p-3 md:p-5 z-20
          transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0'
                    }
        `}
                style={{ transitionDelay: '0.15s' }}
            >
                <div className="
          bg-matte/95 backdrop-blur-md
          rounded-xl md:rounded-2xl p-3 md:p-4
          border border-gold/20
          shadow-xl
          transition-all duration-300
          group-active:bg-gold/20 group-active:border-gold/50
        ">
                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-gold/70 mb-0.5 font-body">
                        {subtitle}
                    </p>
                    <h3 className="font-display text-base md:text-lg text-ivory leading-tight line-clamp-1">
                        {title}
                    </h3>
                    <p className="font-display text-lg md:text-xl font-semibold text-gold mt-0.5 md:mt-1">
                        {price}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default LimitedDropCard;
