import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

const DataTable = ({
    columns,
    data,
    onSort,
    sortColumn,
    sortDirection,
    selectedIds = [],
    onSelectAll,
    onSelectRow,
    isLoading = false,
    emptyMessage = "No data available",
}) => {
    return (
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-surface-light dark:bg-surface-dark shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" aria-busy={isLoading}>
                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                            {onSelectAll && (
                                <th scope="col" className="px-6 py-4 w-12">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-transparent"
                                            checked={data.length > 0 && selectedIds.length === data.length}
                                            onChange={onSelectAll}
                                            aria-label="Select all rows"
                                        />
                                    </div>
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={`px-6 py-4 font-display font-semibold text-neutral-900 dark:text-ivory tracking-wide whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none group hover:text-primary-600 transition-colors' : ''
                                        }`}
                                    onClick={() => col.sortable && onSort && onSort(col.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.header}
                                        {col.sortable && sortColumn === col.key && (
                                            <span className="text-primary-600">
                                                {sortDirection === 'asc' ? (
                                                    <ChevronUpIcon className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDownIcon className="h-4 w-4" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {/* Actions Column Placeholder */}
                            <th scope="col" className="px-6 py-4 w-12 text-right">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {isLoading ? (
                            // Skeleton Loading State
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={columns.length + 2} className="px-6 py-4">
                                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 2}
                                    className="px-6 py-12 text-center text-neutral-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors duration-200"
                                >
                                    {onSelectRow && (
                                        <td className="px-6 py-4 w-12">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-transparent"
                                                    checked={selectedIds.includes(row.id)}
                                                    onChange={() => onSelectRow(row.id)}
                                                    aria-label={`Select row ${rowIndex + 1}`}
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td
                                            key={`${row.id}-${col.key}`}
                                            className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-medium"
                                        >
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 w-12 text-right">
                                        <button className="text-neutral-400 hover:text-primary-600 transition-colors">
                                            <EllipsisHorizontalIcon className="h-5 w-5" />
                                            <span className="sr-only">Row Actions</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination Footer could go here */}
        </div>
    );
};

export default DataTable;
