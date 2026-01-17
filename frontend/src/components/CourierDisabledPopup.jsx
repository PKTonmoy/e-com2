import { useCourierService } from '../contexts/CourierServiceContext.jsx';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal popup that appears when admin enters admin panel with courier service disabled
 */
const CourierDisabledPopup = () => {
    const { showDisabledPopup, dismissPopup, courierSettings } = useCourierService();

    if (!showDisabledPopup) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={dismissPopup}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-matte rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-display font-bold text-white">
                            Courier Service Disabled
                        </h2>
                    </div>
                    <button
                        onClick={dismissPopup}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-neutral-600 dark:text-neutral-300">
                        The <strong>Steadfast courier service</strong> is currently <strong className="text-amber-600">disabled</strong>.
                        Courier-related features are not operational.
                    </p>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>What this means:</strong>
                        </p>
                        <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                            <li>Orders cannot be sent to courier automatically</li>
                            <li>Courier balance and status won't be fetched</li>
                            <li>You can still process orders manually</li>
                        </ul>
                    </div>

                    {courierSettings?.disabledAt && (
                        <p className="text-xs text-neutral-400">
                            Disabled on: {new Date(courierSettings.disabledAt).toLocaleString()}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
                    <button
                        onClick={dismissPopup}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourierDisabledPopup;
