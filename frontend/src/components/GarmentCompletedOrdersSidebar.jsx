import React from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCheckCircle, HiOutlineUser, HiOutlineCalendar, HiOutlineChevronRight } from 'react-icons/hi2';
import { getHexColor } from '../utils/colors';

const GarmentCompletedOrdersSidebar = ({
    completedOrders = [],
    onOrderClick,
    isLoading = false
}) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4"></div>
                    <div className="space-y-2">
                        <div className="h-12 bg-gray-200 dark:bg-white/10 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-white/10 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (completedOrders.length === 0) {
        return (
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">
                        Completed Orders
                    </h3>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                    Orders ready for pickup or shipping
                </p>
                <div className="text-center py-6">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <HiOutlineCheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        No completed orders yet
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">
                        Completed Orders
                    </h3>
                </div>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded-full">
                    {completedOrders.length}
                </span>
            </div>

            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                Orders ready for pickup or shipping
            </p>

            {/* Orders List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {completedOrders.map((order, index) => (
                    <motion.button
                        key={order.id || order.order_code}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onOrderClick?.(order)}
                        className="w-full group text-left bg-gray-50 dark:bg-white/5 hover:bg-green-50 dark:hover:bg-green-500/10 border border-gray-100 dark:border-white/5 hover:border-green-200 dark:hover:border-green-500/30 rounded-xl p-3 transition-all hover:shadow-md"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                {/* Order Code */}
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                        {order.order_code}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[9px] font-bold uppercase rounded">
                                        Done
                                    </span>
                                </div>

                                {/* Customer Name */}
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1.5">
                                    <HiOutlineUser className="w-3 h-3" />
                                    <span className="truncate">{order.customer_name || 'Unknown'}</span>
                                </p>

                                {/* Order Details */}
                                <div className="flex items-center gap-2 text-[9px]">
                                    {order.suit_type_name && (
                                        <span className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                                            {order.suit_type_name}
                                        </span>
                                    )}
                                    {order.selected_color && (
                                        <div className="flex items-center gap-1">
                                            <div
                                                className="w-3 h-3 rounded-full border border-gray-200 dark:border-white/20"
                                                style={{ backgroundColor: getHexColor(order.selected_color) }}
                                            />
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {order.selected_color}
                                            </span>
                                        </div>
                                    )}
                                    {order.quantity > 1 && (
                                        <span className="text-gray-500 dark:text-gray-400">
                                            x{order.quantity}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Arrow Icon */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <HiOutlineChevronRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                        </div>

                        {/* Due Date / Completion Date */}
                        {order.due_date && (
                            <div className={`flex items-center gap-1 mt-2 pt-2 border-t ${order.completed_at ? 'border-green-200 dark:border-green-500/20' : 'border-gray-200 dark:border-white/10'}`}>
                                <HiOutlineCalendar className="w-3 h-3 text-gray-400" />
                                <span className={`text-[9px] font-medium ${order.completed_at ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {order.completed_at ? `Completed: ${formatDate(order.completed_at)}` : `Due: ${formatDate(order.due_date)}`}
                                </span>
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* View All Link */}
            {completedOrders.length >= 5 && (
                <button
                    onClick={() => {
                        // Could trigger a "view all completed" action
                    }}
                    className="w-full mt-3 pt-3 border-t border-gray-100 dark:border-white/5 text-center text-[10px] font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 uppercase tracking-wider transition-colors"
                >
                    View All Completed ({completedOrders.length})
                </button>
            )}
        </div>
    );
};

export default GarmentCompletedOrdersSidebar;
