import React from 'react';

const ProductVariantMatrix = ({
    xOptions = [], // e.g. Sizes ['S', 'M']
    yOptions = [], // e.g. Colors ['Red', 'Blue']
    value = {}, // { "S-Red": { stock: 10, price: 99 } }
    onChange,
    xLabel = "Sizes",
    yLabel = "Colors"
}) => {

    const handleChange = (x, y, field, val) => {
        const key = `${x}-${y}`;
        const currentVariant = value[key] || { stock: 0, price: 0 };
        const newValue = {
            ...value,
            [key]: {
                ...currentVariant,
                [field]: val
            }
        };
        onChange(newValue);
    };

    if (!xOptions.length || !yOptions.length) {
        return (
            <div className="p-4 text-center text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
                Add options for {xLabel} and {yLabel} to generate valid variants.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                        <th className="px-4 py-3 font-semibold">{yLabel} \ {xLabel}</th>
                        {xOptions.map(x => (
                            <th key={x} className="px-4 py-3 text-center min-w-[140px] font-semibold text-neutral-900 dark:text-ivory">
                                {x}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-surface-light dark:bg-surface-dark">
                    {yOptions.map(y => (
                        <tr key={y} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                            <td className="px-4 py-4 font-medium text-neutral-900 dark:text-ivory whitespace-nowrap bg-neutral-50/50 dark:bg-neutral-900/20">
                                {y}
                            </td>
                            {xOptions.map(x => {
                                const key = `${x}-${y}`;
                                const variantData = value[key] || { stock: '', price: '' };
                                return (
                                    <td key={key} className="px-2 py-2">
                                        <div className="flex flex-col gap-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Stock</span>
                                                <input
                                                    type="number"
                                                    value={variantData.stock}
                                                    onChange={(e) => handleChange(x, y, 'stock', Number(e.target.value))}
                                                    className="w-full pl-2 pb-1 pt-5 pr-2 text-sm bg-white dark:bg-matte border border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-shadow"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Price</span>
                                                <input
                                                    type="number"
                                                    value={variantData.price}
                                                    onChange={(e) => handleChange(x, y, 'price', Number(e.target.value))}
                                                    className="w-full pl-2 pb-1 pt-5 pr-2 text-sm bg-white dark:bg-matte border border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-shadow"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductVariantMatrix;
