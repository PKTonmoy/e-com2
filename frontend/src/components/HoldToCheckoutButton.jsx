/**
 * HoldToCheckoutButton Component
 * 
 * Premium "press and hold" checkout button with fraud prevention,
 * accessibility features, and Stripe/Apple Pay-level micro-interactions.
 * 
 * Usage:
 * <HoldToCheckoutButton
 *   onComplete={handleCheckout}
 *   holdDuration={2500}
 *   disabled={!canCheckout}
 * />
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// Generate unique session ID for fraud prevention
const generateSessionId = () => {
    return `checkout_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const HoldToCheckoutButton = ({
    onComplete,
    holdDuration = 2500,
    disabled = false,
    buttonText = 'Hold to Place Order',
    className = '',
}) => {
    // ===== STATE =====
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState(() => generateSessionId());

    // Fraud prevention: track attempt timestamps
    const [lastAttemptTime, setLastAttemptTime] = useState(0);
    const COOLDOWN_MS = 1000; // Minimum time between attempts

    // ===== REFS =====
    const holdStartTime = useRef(null);
    const animationFrameRef = useRef(null);
    const buttonRef = useRef(null);
    const completedRef = useRef(false); // Prevent double-completion

    // ===== CLEANUP ANIMATION FRAME =====
    const cancelAnimation = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    // ===== RESET STATE =====
    const resetState = useCallback(() => {
        cancelAnimation();
        setIsHolding(false);
        setProgress(0);
        holdStartTime.current = null;
    }, [cancelAnimation]);

    // ===== PROGRESS ANIMATION LOOP =====
    const updateProgress = useCallback(() => {
        if (!holdStartTime.current || completedRef.current) return;

        const elapsed = Date.now() - holdStartTime.current;
        const newProgress = Math.min((elapsed / holdDuration) * 100, 100);

        setProgress(newProgress);

        if (newProgress >= 100) {
            // Hold completed successfully!
            completedRef.current = true;
            setIsComplete(true);
            setIsHolding(false);
            cancelAnimation();

            // Trigger completion callback after brief success animation
            setTimeout(async () => {
                setIsProcessing(true);
                try {
                    await onComplete?.();
                } finally {
                    // Reset for potential retry (if checkout fails)
                    setTimeout(() => {
                        setIsProcessing(false);
                        setIsComplete(false);
                        setProgress(0);
                        completedRef.current = false;
                        // Generate new session ID for next attempt
                        setSessionId(generateSessionId());
                    }, 500);
                }
            }, 400); // Wait for success animation
        } else {
            // Continue animation
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    }, [holdDuration, onComplete, cancelAnimation]);

    // ===== START HOLD =====
    const handleHoldStart = useCallback((e) => {
        // Prevent context menu on long press (mobile)
        e.preventDefault();

        if (disabled || isComplete || isProcessing || completedRef.current) return;

        // Fraud prevention: check cooldown
        const now = Date.now();
        if (now - lastAttemptTime < COOLDOWN_MS) {
            console.warn('HoldToCheckout: Rapid attempt detected, ignoring');
            return;
        }
        setLastAttemptTime(now);

        // Start hold
        setIsHolding(true);
        holdStartTime.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(updateProgress);

        // Optional: Haptic feedback (commented for customization)
        // if (navigator.vibrate) navigator.vibrate(10);
    }, [disabled, isComplete, isProcessing, lastAttemptTime, updateProgress]);

    // ===== END HOLD =====
    const handleHoldEnd = useCallback(() => {
        if (!isHolding || completedRef.current) return;
        resetState();
    }, [isHolding, resetState]);

    // ===== KEYBOARD SUPPORT =====
    const handleKeyDown = useCallback((e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!isHolding && !disabled && !isComplete && !isProcessing) {
                handleHoldStart(e);
            }
        }
    }, [isHolding, disabled, isComplete, isProcessing, handleHoldStart]);

    const handleKeyUp = useCallback((e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleHoldEnd();
        }
    }, [handleHoldEnd]);

    // ===== VISIBILITY CHANGE HANDLER (Fraud Prevention) =====
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isHolding) {
                console.log('HoldToCheckout: Tab hidden, cancelling hold');
                resetState();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isHolding, resetState]);

    // ===== MOUSE/TOUCH LEAVE HANDLER =====
    useEffect(() => {
        const button = buttonRef.current;
        if (!button) return;

        const handleLeave = () => {
            if (isHolding) {
                resetState();
            }
        };

        button.addEventListener('mouseleave', handleLeave);
        button.addEventListener('touchend', handleHoldEnd);
        button.addEventListener('touchcancel', handleLeave);

        // Prevent context menu on long press
        button.addEventListener('contextmenu', (e) => e.preventDefault());

        return () => {
            button.removeEventListener('mouseleave', handleLeave);
            button.removeEventListener('touchend', handleHoldEnd);
            button.removeEventListener('touchcancel', handleLeave);
        };
    }, [isHolding, resetState, handleHoldEnd]);

    // ===== CLEANUP ON UNMOUNT =====
    useEffect(() => {
        return () => {
            cancelAnimation();
        };
    }, [cancelAnimation]);

    // ===== RENDER =====
    const buttonClasses = `
    hold-checkout-btn
    relative overflow-hidden
    w-full py-3.5 sm:py-4 px-6
    font-display font-semibold text-xs sm:text-sm uppercase tracking-[0.1em]
    rounded-full
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-ivory dark:focus:ring-offset-matte
    ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${isHolding ? 'scale-[0.98]' : 'hover:scale-[1.01]'}
    ${isComplete ? 'hold-checkout-success' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <button
            ref={buttonRef}
            className={buttonClasses}
            disabled={disabled || isProcessing}
            aria-label={isProcessing ? 'Processing order...' : buttonText}
            aria-pressed={isHolding}
            data-session-id={sessionId}
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
        >
            {/* Background gradient base */}
            <span className="absolute inset-0 bg-gradient-to-r from-gold via-amber-400 to-gold" />

            {/* Center-out progress fill overlay - expands from center to edges */}
            <span
                className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 via-white/50 to-white/30 origin-center transition-transform duration-75 ease-linear"
                style={{
                    transform: `scaleX(${progress / 100})`,
                    opacity: isHolding || progress > 0 ? 1 : 0,
                }}
            />

            {/* Subtle inner glow on hold */}
            <span
                className={`
                    absolute inset-0 rounded-full pointer-events-none
                    transition-all duration-200
                    ${isHolding ? 'shadow-[inset_0_0_20px_rgba(255,255,255,0.3)]' : ''}
                    ${isComplete ? 'hold-checkout-glow-pulse' : ''}
                `}
            />

            {/* Button content */}
            <span className="relative z-10 flex items-center justify-center gap-2 text-matte">
                {isProcessing ? (
                    <>
                        {/* Loading spinner */}
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs sm:text-sm">Processing...</span>
                    </>
                ) : isComplete ? (
                    <>
                        {/* Success checkmark */}
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 hold-checkout-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs sm:text-sm">Order Placed!</span>
                    </>
                ) : (
                    <>
                        {/* Lock icon */}
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <span>{buttonText}</span>
                    </>
                )}
            </span>
        </button>
    );
};

export default HoldToCheckoutButton;
