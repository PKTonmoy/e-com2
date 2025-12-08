import { useState } from 'react';
import { CheckIcon, HomeIcon, TruckIcon, CubeIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

/**
 * OrderStatusTracker - A collapsible visual order status tracker component
 * @param {string} status - The current order status: 'pending', 'confirmed', 'shipped', 'delivered'
 */
const OrderStatusTracker = ({ status }) => {
    const [isOpen, setIsOpen] = useState(false);

    const steps = [
        { key: 'pending', label: 'Order', sublabel: 'Received', icon: CubeIcon },
        { key: 'confirmed', label: 'Order', sublabel: 'Processed', icon: CubeIcon },
        { key: 'shipped', label: 'Package', sublabel: 'Shipped', icon: TruckIcon },
        { key: 'delivered', label: 'Package', sublabel: 'Arrived', icon: HomeIcon },
    ];

    const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    const getStepState = (stepIndex) => {
        if (currentIndex < 0) return 'inactive';
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'inactive';
    };

    return (
        <div className="order-status-tracker bg-ivory/30 dark:bg-matte/50 rounded-xl border border-gold/10 overflow-hidden">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gold/5 transition-colors"
            >
                <h3 className="font-display text-sm uppercase tracking-widest text-matte dark:text-white">
                    Order Status
                </h3>
                {isOpen ? (
                    <ChevronUpIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                ) : (
                    <ChevronDownIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                )}
            </button>

            {/* Collapsible Content */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-4 pb-4 relative">
                    {/* Vertical connecting line */}
                    <div className="absolute left-[38px] top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

                    {/* Progress line */}
                    <div
                        className="absolute left-[38px] top-2 w-0.5 bg-emerald-500 transition-all duration-500"
                        style={{
                            height: currentIndex >= 0
                                ? `calc(${Math.min(currentIndex, 3) * 25}% + ${currentIndex > 0 ? '8px' : '0px'})`
                                : '0%'
                        }}
                    />

                    <div className="space-y-3">
                        {steps.map((step, index) => {
                            const state = getStepState(index);
                            const Icon = step.icon;

                            return (
                                <div key={step.key} className="flex items-center gap-3 relative">
                                    {/* Icon container */}
                                    <div
                                        className={`
                      relative z-10 w-10 h-10 rounded-lg flex items-center justify-center
                      transition-all duration-300
                      ${state === 'completed'
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500'
                                                : state === 'active'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500'
                                                    : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                                            }
                    `}
                                    >
                                        <Icon
                                            className={`
                        w-4 h-4 transition-colors duration-300
                        ${state === 'completed' || state === 'active'
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-neutral-400 dark:text-neutral-500'
                                                }
                      `}
                                        />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1">
                                        <p
                                            className={`
                        font-body text-sm transition-colors duration-300
                        ${state === 'completed' || state === 'active'
                                                    ? 'text-matte dark:text-white'
                                                    : 'text-neutral-400 dark:text-neutral-500'
                                                }
                      `}
                                        >
                                            {step.label}
                                        </p>
                                        <p
                                            className={`
                        font-body text-sm font-semibold transition-colors duration-300
                        ${state === 'completed' || state === 'active'
                                                    ? 'text-matte dark:text-white'
                                                    : 'text-neutral-400 dark:text-neutral-500'
                                                }
                      `}
                                        >
                                            {step.sublabel}
                                        </p>
                                    </div>

                                    {/* Checkmark indicator */}
                                    {(state === 'completed' || state === 'active') && (
                                        <CheckCircleIcon
                                            className={`
                        w-5 h-5 transition-all duration-300
                        ${state === 'completed'
                                                    ? 'text-emerald-500'
                                                    : 'text-emerald-500 animate-pulse'
                                                }
                      `}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderStatusTracker;
