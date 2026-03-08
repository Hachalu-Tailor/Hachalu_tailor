import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineScissors,
    HiOutlineCheckCircle,
    HiOutlineCube,
    HiOutlineMagnifyingGlass,
    HiOutlineTruck,
    HiOutlineArrowPath,
    HiOutlineXMark,
    HiOutlineFunnel
} from 'react-icons/hi2';
import {
    getGarmentOrdersInProgress,
    getGarmentShippedOrders,
    getOrders,
    processGarmentOrder
} from '../api/api';

const GarmentDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [error, setError] = useState(null);
    const [filterSuitType, setFilterSuitType] = useState('all');
    const [filterMaterial, setFilterMaterial] = useState('all');
    const [sortBy, setSortBy] = useState('due_date_asc');

    const handlePaginatedResponse = (response) => {
        if (!response || !response.data) return [];
        let data = response.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            data = data.results || data.data || data.items || [];
        }
        return data || [];
    };

    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                loadOrders();
                setLastRefresh(new Date());
            }, 30000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedOrder(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // Helper: Check if order is overdue
    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        return due < now;
    };

    // Helper: Get days remaining or overdue
    const getTimeStatus = (dueDate) => {
        if (!dueDate) return { text: 'No due date', isOverdue: false, daysLeft: null };
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, daysLeft: diffDays };
        } else if (diffDays === 0) {
            return { text: 'Due today', isOverdue: false, daysLeft: 0 };
        } else if (diffDays <= 2) {
            return { text: `${diffDays}d left`, isOverdue: false, daysLeft: diffDays };
        }
        return { text: `${diffDays} days`, isOverdue: false, daysLeft: diffDays };
    };

    // Get progress stages
    const getProgressStages = (status) => {
        const stages = [
            { id: 'PENDING_APPROVAL', label: 'Approved' },
            { id: 'IN_PROGRESS', label: 'Cutting' },
            { id: 'IN_PROGRESS_STITCHING', label: 'Stitching' },
            { id: 'IN_PROGRESS_FINISHING', label: 'Finishing' },
            { id: 'COMPLETED', label: 'Done' },
            { id: 'SHIPPED', label: 'Shipped' }
        ];

        const statusOrder = {
            'PENDING_APPROVAL': 0,
            'IN_PROGRESS': 1,
            'IN_PROGRESS_STITCHING': 2,
            'IN_PROGRESS_FINISHING': 3,
            'COMPLETED': 4,
            'SHIPPED': 5
        };

        const currentIndex = statusOrder[status] ?? 0;
        return stages.map((stage, index) => ({
            ...stage,
            isActive: index <= currentIndex,
            isCurrent: index === currentIndex
        }));
    };

    const loadOrders = async () => {
        setLoading(true);
        setError(null);

        try {
            const [inProgressResponse, shippedResponse, allOrdersResponse] = await Promise.all([
                getGarmentOrdersInProgress().catch(() => ({ data: [] })),
                getGarmentShippedOrders().catch(() => ({ data: [] })),
                getOrders().catch(() => ({ data: [] }))
            ]);

            const inProgressOrders = handlePaginatedResponse(inProgressResponse);
            const shippedOrders = handlePaginatedResponse(shippedResponse);
            const allOrders = handlePaginatedResponse(allOrdersResponse);

            const relevantStatuses = new Set([
                'INITIATED',
                'AWAITING_PAYMENT',
                'PENDING_APPROVAL',
                'IN_PROGRESS',
                'COMPLETED',
                'SHIPPED',
                'READY_FOR_PICKUP',
                'INSTORE',
                'CLOSED',
                'IN_PROGRESS_STITCHING',
                'IN_PROGRESS_FINISHING'
            ]);

            const combinedOrders = [
                ...inProgressOrders,
                ...shippedOrders,
                ...(allOrders || []).filter(order => relevantStatuses.has(order.status))
            ];

            const uniqueOrders = [];
            const seen = new Set();

            combinedOrders.forEach(order => {
                const key = order.order_code || order.id;
                if (key && !seen.has(key)) {
                    seen.add(key);
                    uniqueOrders.push(order);
                }
            });

            setOrders(uniqueOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            if (error.response?.status === 403) {
                setError('Permission denied. Please contact administrator.');
            } else if (!error.response) {
                setError('Network error. Please check your connection.');
            }
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteOrder = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'COMPLETED' });
            await loadOrders();
            setSelectedOrder(null);
            alert('Order completed!');
        } catch (error) {
            alert('Failed to complete order.');
        }
    };
    
    const handleShipOrder = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'SHIPPED' });
            await loadOrders();
            setSelectedOrder(null);
            alert('Order marked as shipped!');
        } catch (error) {
            alert('Failed to mark order as shipped.');
        }
    };

    const suitTypeOptions = useMemo(
        () => Array.from(new Set(orders.map(o => o.suit_type_name).filter(Boolean))),
        [orders]
    );

    const materialOptions = useMemo(
        () => Array.from(new Set(orders.map(o => o.material_name).filter(Boolean))),
        [orders]
    );

    // Filter and sort orders
    const filteredOrders = useMemo(() => {
        let list = orders.filter(order => {
            const matchesSearch = !searchTerm || order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (filterSuitType !== 'all' && order.suit_type_name !== filterSuitType) return false;
            if (filterMaterial !== 'all' && order.material_name !== filterMaterial) return false;

            if (activeTab === 'all') return true;
            if (activeTab === 'in_progress') return order.status === 'IN_PROGRESS' || order.status === 'IN_PROGRESS_STITCHING' || order.status === 'IN_PROGRESS_FINISHING';
            if (activeTab === 'completed') return order.status === 'COMPLETED';
            if (activeTab === 'shipped') return order.status === 'SHIPPED';
            if (activeTab === 'pending') return order.status === 'INITIATED' || order.status === 'PENDING_APPROVAL' || order.status === 'AWAITING_PAYMENT';
            if (activeTab === 'overdue') return isOverdue(order.due_date);

            return true;
        });

        const statusOrder = { PENDING_APPROVAL: 0, IN_PROGRESS: 1, IN_PROGRESS_STITCHING: 2, IN_PROGRESS_FINISHING: 3, COMPLETED: 4, SHIPPED: 5 };
        const getSortKey = (o) => o.due_date ? new Date(o.due_date).getTime() : 0;
        if (sortBy === 'due_date_asc') list.sort((a, b) => getSortKey(a) - getSortKey(b));
        if (sortBy === 'due_date_desc') list.sort((a, b) => getSortKey(b) - getSortKey(a));
        if (sortBy === 'customer') list.sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));
        if (sortBy === 'status') list.sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

        return list;
    }, [orders, searchTerm, activeTab, filterSuitType, filterMaterial, sortBy]);

    // Stats
    const stats = {
        inProgress: orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'IN_PROGRESS_STITCHING' || o.status === 'IN_PROGRESS_FINISHING').length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length,
        pending: orders.filter(o => o.status === 'INITIATED' || o.status === 'PENDING_APPROVAL' || o.status === 'AWAITING_PAYMENT').length,
        overdue: orders.filter(o => isOverdue(o.due_date) && o.status !== 'COMPLETED').length,
        total: orders.length
    };

    const tabs = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
        { id: 'completed', label: 'Done', count: stats.completed },
        { id: 'shipped', label: 'Shipped', count: stats.shipped },
        { id: 'pending', label: 'Pending', count: stats.pending },
        { id: 'overdue', label: 'Overdue', count: stats.overdue, isAlert: true },
    ];

    // Status badge colors
    const getStatusBadge = (status) => {
        const statusMap = {
            'IN_PROGRESS': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Cutting' },
            'IN_PROGRESS_STITCHING': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Stitching' },
            'IN_PROGRESS_FINISHING': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Finishing' },
            'COMPLETED': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
            'PENDING_APPROVAL': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            'SHIPPED': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Shipped' },
        };
        return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status?.replace(/_/g, ' ') };
    };

    return (
        <div className="w-full space-y-4">
            {/* Header Card - neutral professional design */}
            <div className="mb-4">
                <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                    <HiOutlineScissors className="w-6 h-6" />
                                </span>
                                Garment Workshop
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage production orders</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { loadOrders(); setLastRefresh(new Date()); }}
                                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                title="Refresh now"
                            >
                                <HiOutlineArrowPath className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${autoRefresh
                                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 border border-transparent'}`}
                            >
                                Auto-refresh {autoRefresh ? 'On' : 'Off'}
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
                        {[
                            { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                            { label: 'Completed', value: stats.completed, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                            { label: 'Shipped', value: stats.shipped, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
                            { label: 'Pending', value: stats.pending, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                            ...(stats.overdue > 0 ? [{ label: 'Overdue', value: stats.overdue, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' }] : []),
                            { label: 'Total', value: stats.total, color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
                        ].map((s) => (
                            <div key={s.label} className={`rounded-xl px-4 py-2.5 min-w-[72px] ${s.color}`}>
                                <div className="text-lg font-bold">{s.value}</div>
                                <div className="text-[10px] font-medium opacity-90">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-3">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Tabs, Search & Filters */}
            <div className="mb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex gap-2 overflow-x-auto w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-teal-600 text-white dark:bg-teal-500'
                                    : tab.isAlert
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500/50 outline-none"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="hidden sm:flex px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/50 outline-none"
                            title="Sort by"
                        >
                            <option value="due_date_asc">Due: Soonest</option>
                            <option value="due_date_desc">Due: Latest</option>
                            <option value="customer">Customer A–Z</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <HiOutlineFunnel className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Suit Type</span>
                        <select
                            value={filterSuitType}
                            onChange={(e) => setFilterSuitType(e.target.value)}
                            className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white px-2 py-1.5 focus:ring-1 focus:ring-teal-500/50 outline-none"
                        >
                            <option value="all">All</option>
                            {suitTypeOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Material</span>
                        <select
                            value={filterMaterial}
                            onChange={(e) => setFilterMaterial(e.target.value)}
                            className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white px-2 py-1.5 focus:ring-1 focus:ring-teal-500/50 outline-none"
                        >
                            <option value="all">All</option>
                            {materialOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setFilterSuitType('all');
                            setFilterMaterial('all');
                            setSearchTerm('');
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4">
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm mt-1">{error}</p>
                        <button onClick={loadOrders} className="text-sm font-medium underline mt-2 hover:no-underline">Retry</button>
                    </div>
                </div>
            )}

            {/* Orders Grid */}
            <div>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 dark:border-gray-700 border-t-teal-500"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-white/5 rounded-xl">
                        <HiOutlineCube className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">No Orders Found</h3>
                        <p className="text-gray-400 mt-2">There are no orders in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOrders.map((order) => {
                            const timeStatus = getTimeStatus(order.due_date);
                            const statusBadge = getStatusBadge(order.status);
                            const progressStages = getProgressStages(order.status);

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedOrder(order)}
                                    className={`bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all cursor-pointer overflow-hidden ${timeStatus.isOverdue ? 'ring-2 ring-rose-400' : ''
                                        }`}
                                >
                                    {/* Status Bar */}
                                    <div className={`h-1 ${timeStatus.isOverdue ? 'bg-rose-500' : 'bg-teal-500'}`} />

                                    <div className="p-4">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-lg dark:text-white">{order.order_code}</h3>
                                                <p className="text-sm text-gray-500">{order.customer_name || 'Unknown'}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                {statusBadge.label}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex gap-1">
                                                {progressStages.slice(0, 4).map((stage, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex-1 h-2 rounded-full ${stage.isActive
                                                            ? stage.isCurrent ? 'bg-teal-500' : 'bg-emerald-500'
                                                            : 'bg-gray-200 dark:bg-gray-700'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Suit:</span>
                                                <span className="dark:text-white font-medium">{order.suit_type_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Material:</span>
                                                <span className="dark:text-white font-medium">{order.material_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Qty:</span>
                                                <span className="dark:text-white font-medium">{order.quantity}</span>
                                            </div>
                                            {/* Measurements - if available */}
                                            {order.measurements && (
                                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 mb-1">Measurements:</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
                                                        {order.measurements.chest && (
                                                            <span className="text-gray-600 dark:text-gray-300">Chest: <b className="dark:text-white">{order.measurements.chest}</b></span>
                                                        )}
                                                        {order.measurements.shoulder && (
                                                            <span className="text-gray-600 dark:text-gray-300">Shldr: <b className="dark:text-white">{order.measurements.shoulder}</b></span>
                                                        )}
                                                        {order.measurements.waist && (
                                                            <span className="text-gray-600 dark:text-gray-300">Waist: <b className="dark:text-white">{order.measurements.waist}</b></span>
                                                        )}
                                                        {order.measurements.hips && (
                                                            <span className="text-gray-600 dark:text-gray-300">Hips: <b className="dark:text-white">{order.measurements.hips}</b></span>
                                                        )}
                                                        {order.measurements.arm_length && (
                                                            <span className="text-gray-600 dark:text-gray-300">Arm: <b className="dark:text-white">{order.measurements.arm_length}</b></span>
                                                        )}
                                                        {order.measurements.height && (
                                                            <span className="text-gray-600 dark:text-gray-300">Height: <b className="dark:text-white">{order.measurements.height}</b></span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs ${timeStatus.isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                                    Due: {order.due_date || 'N/A'}
                                                </span>
                                                {timeStatus.isOverdue && (
                                                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-full font-semibold">
                                                        OVERDUE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setSelectedOrder(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
                        >
                            {/* Header */}
                            <div className="bg-gray-900 dark:bg-gray-950 p-6 text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedOrder.order_code}</h2>
                                        <p className="text-gray-400 text-sm mt-0.5">{selectedOrder.customer_name || 'Unknown Customer'}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        <HiOutlineXMark className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Status */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <span className="text-gray-500 dark:text-gray-300">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedOrder.status).bg} ${getStatusBadge(selectedOrder.status).text}`}>
                                        {getStatusBadge(selectedOrder.status).label}
                                    </span>
                                </div>

                                {/* Progress */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">Production Progress</p>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {getProgressStages(selectedOrder.status).map((stage, idx) => (
                                            <React.Fragment key={stage.id}>
                                                <div className={`min-w-[40px] h-2 rounded-full ${stage.isActive
                                                    ? stage.isCurrent ? 'bg-teal-500' : 'bg-emerald-500'
                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                    }`} />
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 overflow-x-auto">
                                        {getProgressStages(selectedOrder.status).map(stage => (
                                            <span key={stage.id} className="text-[10px] text-gray-400 whitespace-nowrap px-1">{stage.label}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <p className="text-xs text-gray-500">Suit Type</p>
                                        <p className="font-medium dark:text-white">{selectedOrder.suit_type_name || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <p className="text-xs text-gray-500">Material</p>
                                        <p className="font-medium dark:text-white">{selectedOrder.material_name || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <p className="text-xs text-gray-500">Quantity</p>
                                        <p className="font-medium dark:text-white">{selectedOrder.quantity}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <p className="text-xs text-gray-500">Due Date</p>
                                        <p className={`font-medium ${getTimeStatus(selectedOrder.due_date).isOverdue ? 'text-red-500' : 'dark:text-white'}`}>
                                            {selectedOrder.due_date || 'Not set'}
                                        </p>
                                    </div>
                                </div>

                                {/* Color Selection */}
                                {(selectedOrder.selected_color || selectedOrder.selected_color_name) && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                                            Selected Color
                                        </p>
                                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg">
                                            <div
                                                className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-md"
                                                style={{ backgroundColor: selectedOrder.selected_color_name || selectedOrder.selected_color || '#888' }}
                                            />
                                            <div>
                                                <p className="font-medium dark:text-white">{selectedOrder.selected_color_name || selectedOrder.selected_color}</p>
                                                <p className="text-xs text-gray-500">{selectedOrder.material_color || 'Color selected'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Measurements Section */}
                                {selectedOrder.measurements && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-xl overflow-x-auto">
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                                            Measurements
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 min-w-[280px]">
                                            {selectedOrder.measurements.chest && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Chest</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.chest}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.shoulder && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Shoulder</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.shoulder}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.waist && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Waist</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.waist}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.hips && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Hips</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.hips}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.arm_length && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Arm Length</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.arm_length}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.height && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Height</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.height}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.neck && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Neck</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.neck}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.sleeve && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Sleeve</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.sleeve}</p>
                                                </div>
                                            )}
                                            {selectedOrder.measurements.inside_leg && (
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-center">
                                                    <p className="text-xs text-gray-500">Inside Leg</p>
                                                    <p className="font-bold dark:text-white">{selectedOrder.measurements.inside_leg}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Customer Info */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-xl">
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                                        Customer Info
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">Customer Name</p>
                                            <p className="font-medium dark:text-white">{selectedOrder.customer_name || 'N/A'}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="font-medium dark:text-white">{selectedOrder.customer_phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl">
                                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
                                        Pricing
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                                            <p className="text-xs text-gray-500">Expected Price</p>
                                            <p className="font-bold text-lg dark:text-white">{selectedOrder.expected_price ? `ETB ${selectedOrder.expected_price}` : 'N/A'}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                                            <p className="text-xs text-gray-500">Total Price</p>
                                            <p className="font-bold text-lg text-green-600">{selectedOrder.total_price ? `ETB ${selectedOrder.total_price}` : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 pt-4">
                                    {selectedOrder.status === 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => handleCompleteOrder(selectedOrder.order_code)}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Mark as Completed
                                        </button>
                                    )}
                                    {selectedOrder.status === 'COMPLETED' && (
                                        <button
                                            onClick={() => handleShipOrder(selectedOrder.order_code)}
                                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <HiOutlineTruck className="w-5 h-5" />
                                            Mark as Shipped
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GarmentDashboard;
