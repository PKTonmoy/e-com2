import React from 'react';

const MobileHeader = ({ title, subtitle }) => {
    return (
        <div className="sm:hidden bg-ivory dark:bg-matte border-b border-gold/20 px-4 py-3 z-40">
            <div className="flex flex-col items-center justify-center text-center space-y-1">
                {subtitle && (
                    <p className="text-gold text-[10px] font-medium uppercase tracking-[0.2em] leading-none">
                        {subtitle}
                    </p>
                )}
                <h1 className="font-display text-xl text-matte dark:text-ivory leading-none tracking-wide uppercase">
                    {title}
                </h1>
                {/* Premium Divider */}
                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent mt-1" />
            </div>
        </div>
    );
};

export default MobileHeader;
