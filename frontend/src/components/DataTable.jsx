import React from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineDocumentText
} from 'react-icons/hi2';
import Loading from './Loading';

const DataTable = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'No data found',
    emptyIcon: EmptyIcon = HiOutlineDocumentText,
    onRowClick,
    pagination = null,
    onPageChange,
    className = '',
    rowKey = 'id',
}) => {
    // Pagination controls
    const renderPagination = () => {
        if (!pagination) return null;

        const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

        return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                <p className="text-gray-400 text-sm">
                    Page {page} of {totalPages || 1}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange?.(page - 1)}
                        disabled={!hasPrevPage}
                        className={`
              p-2 rounded-lg transition-all
              ${hasPrevPage
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-600 cursor-not-allowed'}
            `}
                    >
                        <HiOutlineChevronLeft size={18} />
                    </button>

                    <button
                        onClick={() => onPageChange?.(page + 1)}
                        disabled={!hasNextPage}
                        className={`
              p-2 rounded-lg transition-all
              ${hasNextPage
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-600 cursor-not-allowed'}
            `}
                    >
                        <HiOutlineChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    };

    // Empty state
    if (!loading && data.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <EmptyIcon className="text-gray-500 mx-auto mb-4" size={48} />
                <p className="text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden ${className}`}>
            {loading ? (
                <Loading text="Loading data..." />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    {columns.map((column, index) => (
                                        <th
                                            key={column.key || index}
                                            className={`
                        text-left px-6 py-4 
                        text-[10px] font-bold uppercase tracking-widest text-gray-400
                        ${column.className || ''}
                      `}
                                            style={{ width: column.width }}
                                        >
                                            {column.title}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map((row, rowIndex) => (
                                    <motion.tr
                                        key={row[rowKey] || rowIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: rowIndex * 0.05 }}
                                        onClick={() => onRowClick?.(row)}
                                        className={`
                      hover:bg-white/5 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                                    >
                                        {columns.map((column, colIndex) => (
                                            <td
                                                key={column.key || colIndex}
                                                className={`px-6 py-4 ${column.cellClassName || ''}`}
                                            >
                                                {column.render
                                                    ? column.render(row[column.key], row, rowIndex)
                                                    : row[column.key]}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {renderPagination()}
                </>
            )}
        </div>
    );
};

export default DataTable;
