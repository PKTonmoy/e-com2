import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const KPICard = ({ label, value, trend, icon: Icon, color = 'primary' }) => {
    // Map abstract colors to our theme implementation
    // Using simple semantic mapping logic based on our tailwind config
    const colorStyles = {
        primary: {
            iconBg: 'bg-primary-500/10',
            iconText: 'text-primary-600 dark:text-primary-400',
            border: 'border-primary-500/20'
        },
        secondary: {
            iconBg: 'bg-secondary-500/10',
            iconText: 'text-secondary-600 dark:text-secondary-400',
            border: 'border-secondary-500/20'
        },
        success: {
            iconBg: 'bg-green-500/10',
            iconText: 'text-green-600 dark:text-green-400',
            border: 'border-green-500/20'
        },
        warning: {
            iconBg: 'bg-yellow-500/10',
            iconText: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-500/20'
        }
    };

    const styles = colorStyles[color] || colorStyles.primary;

    return (
        <article
            className="rounded-2xl bg-surface-light dark:bg-surface-dark border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            role="article"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        {label}
                    </p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-display tracking-tight">
                        {value}
                    </h3>
                </div>
                {Icon && (
                    <div className={`p-3 rounded-xl ${styles.iconBg} ${styles.iconText}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>

            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend.direction === 'up'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                        aria-label={`Trending ${trend.direction} by ${trend.value}%`}
                    >
                        {trend.direction === 'up' ? (
                            <ArrowUpIcon className="w-3 h-3" />
                        ) : (
                            <ArrowDownIcon className="w-3 h-3" />
                        )}
                        {trend.value}%
                    </span>
                    <span className="text-xs text-neutral-400">vs last month</span>
                </div>
            )}
        </article>
    );
};

export default KPICard;
