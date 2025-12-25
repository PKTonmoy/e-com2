/**
 * AnimatedButton Component - Premium animated button
 * Hover effect reveals text with elegant animation
 */

const AnimatedButton = ({
    text,
    onClick,
    disabled = false,
    variant = 'primary', // 'primary' | 'secondary'
    size = 'normal', // 'normal' | 'compact'
    fullWidth = false,
    className = ''
}) => {
    // Split text into individual letters for animation
    const letters = text.split('');

    const baseClasses = `
    animated-btn
    ${variant === 'secondary' ? 'animated-btn-secondary' : 'animated-btn-primary'}
    ${size === 'compact' ? 'animated-btn-compact' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <button
            className={baseClasses}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            <span className="animated-btn-bg"></span>
            <span className="animated-btn-text">{text}</span>
            <span className="animated-btn-letters" aria-hidden="true">
                {letters.map((letter, index) => (
                    <span
                        key={index}
                        style={{ transitionDelay: `${index * 0.03}s` }}
                    >
                        {letter === ' ' ? '\u00A0' : letter}
                    </span>
                ))}
            </span>
        </button>
    );
};

export default AnimatedButton;
