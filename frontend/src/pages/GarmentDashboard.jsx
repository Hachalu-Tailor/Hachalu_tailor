import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineTruck,
    HiOutlineArrowPath,
    HiOutlineXMark,
    HiOutlineMagnifyingGlass,
    HiOutlineUser,
    HiOutlineCalendar,
    HiOutlineExclamationCircle,
    HiOutlineScissors,
} from 'react-icons/hi2';
import {
    getGarmentOrdersInProgress,
    getGarmentShippedOrders,
    getAllGarmentOrders,
    processGarmentOrder
} from '../api/api';
import { getHexColor } from '../utils/colors';

// Backend status configuration - ONLY use backend statuses (IN_PROGRESS, COMPLETED, SHIPPED)
const BACKEND_STATUSES = {
    IN_PROGRESS: {
        id: 'IN_PROGRESS',
        label: 'In Production',
        color: 'blue',
        bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
        borderColor: 'border-blue-200 dark:border-blue-500/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
        icon: '◆'
    },
    COMPLETED: {
        id: 'COMPLETED',
        label: 'Completed',
        color: 'green',
        bgColor: 'bg-green-500/10 dark:bg-green-500/20',
        borderColor: 'border-green-200 dark:border-green-500/30',
        textColor: 'text-green-600 dark:text-green-400',
        badgeColor: 'bg-green-500/20 text-green-600 dark:text-green-400',
        icon: '✓'
    },
    SHIPPED: {
        id: 'SHIPPED',
        label: 'Shipped',
        color: 'purple',
        bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
        borderColor: 'border-purple-200 dark:border-purple-500/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
        icon: '◉'
    }
};

// Backend status stages only (IN_PROGRESS, COMPLETED, SHIPPED)
const BACKEND_STAGE_BARS = [
    { id: 'IN_PROGRESS', label: 'In Production', color: 'bg-blue-500' },
    { id: 'COMPLETED', label: 'Completed', color: 'bg-green-500' },
    { id: 'SHIPPED', label: 'Shipped', color: 'bg-purple-500' }
];

const getStageIndexFromStatus = (status) => {
    const idx = BACKEND_STAGE_BARS.findIndex(s => s.id === status);
    return idx >= 0 ? idx : -1;
};

const GarmentDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        suitType: 'all',
        material: 'all',
        color: 'all',
        sortBy: 'due_date'
    });

    const handlePaginatedResponse = (response) => {
        if (!response || !response.data) return [];
        let data = response.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            data = data.results || data.data || data.items || [];
        }
        return data || [];
    };

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

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        return due < now;
    };

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

    const loadOrders = async () => {
        setLoading(true);
        setError(null);

        try {
            const [inProgressResponse, shippedResponse, completedResponse] = await Promise.all([
                getGarmentOrdersInProgress().catch(() => ({ data: [] })),
                getGarmentShippedOrders().catch(() => ({ data: [] })),
                getAllGarmentOrders().catch(() => ({ data: [] }))
            ]);

            const inProgressOrders = handlePaginatedResponse(inProgressResponse);
            const shippedOrders = handlePaginatedResponse(shippedResponse);
            const completedOrders = handlePaginatedResponse(completedResponse);

            const combinedOrders = [...inProgressOrders, ...shippedOrders, ...completedOrders];
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
            // Optimistically update local state so the change is visible immediately
            setOrders(prev =>
                prev.map(o =>
                    (o.order_code || o.id) === orderCode ? { ...o, status: 'COMPLETED' } : o
                )
            );
            setSelectedOrder(null);
        } catch (error) {
            alert('Failed to complete order.');
        }
    };

    const handleShipOrder = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'SHIPPED' });
            // Optimistically update local state so the change is visible immediately
            setOrders(prev =>
                prev.map(o =>
                    (o.order_code || o.id) === orderCode ? { ...o, status: 'SHIPPED' } : o
                )
            );
            setSelectedOrder(null);
        } catch (error) {
            alert('Failed to ship order.');
        }
    };

    // Extract unique filter options from orders
    const filterOptions = useMemo(() => {
        const suitTypes = [...new Set(orders.map(o => o.suit_type_name).filter(Boolean))];
        const materials = [...new Set(orders.map(o => o.material_name).filter(Boolean))];
        const colors = [...new Set(orders.map(o => o.selected_color).filter(Boolean))];
        return { suitTypes, materials, colors };
    }, [orders]);

    // Filter and sort orders
    const filteredOrders = useMemo(() => {
        let list = orders.filter(order => {
            // Search filter
            const matchesSearch = !searchTerm ||
                order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Tab filter
            if (activeTab === 'all') return true;
            if (activeTab === 'in_progress') return order.status === 'IN_PROGRESS';
            if (activeTab === 'completed') return order.status === 'COMPLETED';
            if (activeTab === 'shipped') return order.status === 'SHIPPED';
            if (activeTab === 'overdue') return isOverdue(order.due_date) && order.status !== 'SHIPPED';

            return true;
        });

        // Additional filters
        if (filters.suitType !== 'all') {
            list = list.filter(o => o.suit_type_name === filters.suitType);
        }
        if (filters.material !== 'all') {
            list = list.filter(o => o.material_name === filters.material);
        }
        if (filters.color !== 'all') {
            list = list.filter(o => o.selected_color === filters.color);
        }

        // Sort
        if (filters.sortBy === 'due_date') {
            list.sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            });
        } else if (filters.sortBy === 'customer') {
            list.sort((a, b) => (a.customer_name || '').localeCompare(b.customer_name || ''));
        } else if (filters.sortBy === 'status') {
            list.sort((a, b) => {
                const order = { 'IN_PROGRESS': 1, 'COMPLETED': 2, 'SHIPPED': 3 };
                return (order[a.status] || 99) - (order[b.status] || 99);
            });
        }

        return list;
    }, [orders, searchTerm, activeTab, filters]);

    // Stats
    const stats = useMemo(() => {
        return {
            inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
            completed: orders.filter(o => o.status === 'COMPLETED').length,
            shipped: orders.filter(o => o.status === 'SHIPPED').length,
            overdue: orders.filter(o => isOverdue(o.due_date) && o.status !== 'SHIPPED').length,
            total: orders.length
        };
    }, [orders]);

    // Tabs
    const tabs = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'in_progress', label: 'In Progress', count: stats.inProgress, color: 'blue' },
        { id: 'completed', label: 'Completed', count: stats.completed, color: 'green' },
        { id: 'shipped', label: 'Shipped', count: stats.shipped, color: 'purple' },
        { id: 'overdue', label: 'Overdue', count: stats.overdue, color: 'red' }
    ];

    // Only use backend status config (IN_PROGRESS, COMPLETED, SHIPPED)
    const getStatusConfig = (status) => BACKEND_STATUSES[status] || {
        id: status,
        label: String(status || 'Unknown'),
        color: 'gray',
        bgColor: 'bg-gray-500/10 dark:bg-gray-500/20',
        borderColor: 'border-gray-200 dark:border-gray-500/30',
        textColor: 'text-gray-600 dark:text-gray-400',
        icon: '—'
    };

    const sidebarOrders = useMemo(
        () => ({
            inProgress: orders.filter(o => o.status === 'IN_PROGRESS').slice(0, 10),
            completed: orders.filter(o => o.status === 'COMPLETED').slice(0, 10),
            shipped: orders.filter(o => o.status === 'SHIPPED').slice(0, 10),
        }),
        [orders]
    );

    return (
        <div className="p-2 md:p-3 space-y-3 max-w-7xl mx-auto w-full">
            {/* Header - matches Admin & Reception style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                        Garment<span className="text-red-600"> Workshop</span>
                    </h1>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Manage production orders
                    </p>
                </div>
                <button
                    onClick={loadOrders}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-200 dark:hover:bg-white/10"
                >
                    <HiOutlineArrowPath size={16} /> Refresh
                </button>
            </div>

            {/* Stats Grid - matches Admin & Reception cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tabs.slice(1).map((tab, idx) => (
                    <motion.div
                        key={tab.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${activeTab === tab.id ? 'ring-2 ring-red-600/50 border-red-600/30' : ''
                            }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{tab.count}</p>
                                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mt-1">{tab.label}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${tab.color === 'blue' ? 'bg-blue-500' :
                                tab.color === 'green' ? 'bg-green-500' :
                                    tab.color === 'purple' ? 'bg-purple-500' :
                                        'bg-red-500'
                                }`} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search Bar - matches Admin & Reception */}
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-48">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none placeholder:text-gray-500"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                        >
                            <HiOutlineScissors className="w-4 h-4" />
                        </button>

                        {/* View Mode */}
                        <div className="flex rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/10 flex flex-wrap gap-3">
                                <select
                                    value={filters.suitType}
                                    onChange={(e) => setFilters(f => ({ ...f, suitType: e.target.value }))}
                                    className="px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 text-sm bg-white dark:bg-white/5 dark:text-white"
                                >
                                    <option value="all">All Suit Types</option>
                                    {filterOptions.suitTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <select
                                    value={filters.material}
                                    onChange={(e) => setFilters(f => ({ ...f, material: e.target.value }))}
                                    className="px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 text-sm bg-white dark:bg-white/5 dark:text-white"
                                >
                                    <option value="all">All Materials</option>
                                    {filterOptions.materials.map(mat => (
                                        <option key={mat} value={mat}>{mat}</option>
                                    ))}
                                </select>
                                <select
                                    value={filters.color}
                                    onChange={(e) => setFilters(f => ({ ...f, color: e.target.value }))}
                                    className="px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 text-sm bg-white dark:bg-white/5 dark:text-white"
                                >
                                    <option value="all">All Colors</option>
                                    {filterOptions.colors.map(color => (
                                        <option key={color} value={color}>{color}</option>
                                    ))}
                                </select>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                                    className="px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 text-sm bg-white dark:bg-white/5 dark:text-white"
                                >
                                    <option value="due_date">Sort by Due Date</option>
                                    <option value="customer">Sort by Customer</option>
                                    <option value="status">Sort by Status</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    <p className="font-semibold">{error}</p>
                    <button onClick={loadOrders} className="text-sm underline mt-1">Retry</button>
                </div>
            )}

            {/* Main content + sidebars */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 items-start">
                <div className="space-y-3">
                    {/* Orders */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-400 dark:text-gray-500 text-sm uppercase tracking-wider">Loading orders...</p>
                            </div>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <HiOutlineExclamationCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto" />
                            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mt-4">No Orders Found</h3>
                            <p className="text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredOrders.map((order) => {
                                const timeStatus = getTimeStatus(order.due_date);
                                const statusConfig = getStatusConfig(order.status);
                                const stageIndex = getStageIndexFromStatus(order.status);

                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -2 }}
                                        onClick={() => setSelectedOrder(order)}
                                        className={`bg-white dark:bg-white/5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${timeStatus.isOverdue ? 'border-red-300 dark:border-red-500/50 shadow-red-100 dark:shadow-red-500/10' : 'border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                                            }`}
                                    >
                                        {/* Header with Status */}
                                        <div className={`p-4 ${statusConfig.bgColor} rounded-t-xl`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{order.order_code}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <HiOutlineUser className="w-3 h-3" />
                                                        {order.customer_name || 'Unknown'}
                                                    </p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-4 space-y-3">
                                            {/* Backend status progress bar */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</span>
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                                <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10">
                                                    {BACKEND_STAGE_BARS.map((stage, idx) => (
                                                        <div
                                                            key={stage.id}
                                                            className={`flex-1 transition-colors ${idx <= stageIndex ? stage.color : 'bg-gray-200 dark:bg-white/10'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Suit</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate mt-0.5">{order.suit_type_name || 'N/A'}</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Material</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate mt-0.5">{order.material_name || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Color & Quantity - uses getHexColor for real swatch */}
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div
                                                        className="w-6 h-6 rounded-lg flex-shrink-0 border-2 border-gray-200 dark:border-white/10 shadow-sm"
                                                        style={{ backgroundColor: getHexColor(order.selected_color) }}
                                                        title={order.selected_color || 'No color'}
                                                    />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{order.selected_color || 'No color'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                    <span>Qty:</span>
                                                    <span className="font-semibold">{order.quantity}</span>
                                                </div>
                                            </div>

                                            {/* Due Date */}
                                            <div className={`flex items-center justify-between pt-3 mt-1 border-t ${timeStatus.isOverdue ? 'border-red-200 dark:border-red-500/30' : 'border-gray-100 dark:border-white/5'
                                                }`}>
                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                                    <HiOutlineCalendar className="w-4 h-4 flex-shrink-0" />
                                                    <span className="text-sm">{order.due_date || 'No date'}</span>
                                                </div>
                                                {timeStatus.isOverdue ? (
                                                    <span className="text-xs font-semibold text-red-600">{timeStatus.text}</span>
                                                ) : timeStatus.daysLeft <= 2 ? (
                                                    <span className="text-xs font-semibold text-amber-600">{timeStatus.text}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        /* List View */
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Order</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Suit</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Color</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {filteredOrders.map((order) => {
                                        const timeStatus = getTimeStatus(order.due_date);
                                        const statusConfig = getStatusConfig(order.status);

                                        return (
                                            <tr
                                                key={order.id}
                                                onClick={() => setSelectedOrder(order)}
                                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{order.order_code}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.customer_name || 'Unknown'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{order.suit_type_name || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-5 h-5 rounded-md flex-shrink-0 border border-gray-200 dark:border-white/10"
                                                            style={{ backgroundColor: getHexColor(order.selected_color) }}
                                                            title={order.selected_color || '-'}
                                                        />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">{order.selected_color || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium dark:text-white">{order.quantity}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-sm ${timeStatus.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {order.due_date || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sidebar: quick order list */}
                <div className="hidden">
                    <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-3">
                        Orders Sidebar
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                        Quick view of latest garment orders. Click to open details.
                    </p>

                    {orders.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            No orders to display.
                        </p>
                    )}

                    {/* In Progress */}
                    {sidebarOrders.inProgress.length > 0 && (
                        <div className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
                                In Progress
                            </p>
                            <div className="space-y-1.5">
                                {sidebarOrders.inProgress.map(order => {
                                    const statusConfig = getStatusConfig(order.status);
                                    return (
                                        <button
                                            key={order.id}
                                            type="button"
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {order.order_code}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                    {order.customer_name || 'Unknown'}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusConfig.badgeColor || statusConfig.bgColor
                                                    }`}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Completed */}
                    {sidebarOrders.completed.length > 0 && (
                        <div className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-1">
                                Completed Orders
                            </p>
                            <div className="space-y-1.5">
                                {sidebarOrders.completed.map(order => {
                                    const statusConfig = getStatusConfig(order.status);
                                    return (
                                        <button
                                            key={order.id}
                                            type="button"
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {order.order_code}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                    {order.customer_name || 'Unknown'}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusConfig.badgeColor || statusConfig.bgColor
                                                    }`}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Shipped */}
                    {sidebarOrders.shipped.length > 0 && (
                        <div className="mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-1">
                                Shipped
                            </p>
                            <div className="space-y-1.5">
                                {sidebarOrders.shipped.map(order => {
                                    const statusConfig = getStatusConfig(order.status);
                                    return (
                                        <button
                                            key={order.id}
                                            type="button"
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg:white/10 transition-colors text-left"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                    {order.order_code}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                    {order.customer_name || 'Unknown'}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusConfig.badgeColor || statusConfig.bgColor
                                                    }`}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60"
                            onClick={() => setSelectedOrder(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0c] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/10"
                        >
                            {/* Modal Header - matches Admin/Reception red accent */}
                            <div className="bg-red-600 p-6 sticky top-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedOrder.order_code}</h2>
                                        <p className="text-red-100 flex items-center gap-2 mt-1">
                                            <HiOutlineUser className="w-4 h-4" />
                                            {selectedOrder.customer_name || 'Unknown'}
                                            {selectedOrder.customer_phone && (
                                                <span className="text-red-200">• {selectedOrder.customer_phone}</span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                                    >
                                        <HiOutlineXMark className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    {(() => {
                                        const statusConfig = getStatusConfig(selectedOrder.status);
                                        return (
                                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                {statusConfig.label}
                                            </span>
                                        );
                                    })()}
                                    {isOverdue(selectedOrder.due_date) && (
                                        <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 text-red-700">
                                            ⚠️ Overdue
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Backend status progress - IN_PROGRESS, COMPLETED, SHIPPED only */}
                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Status</p>
                                    <div className="flex items-center gap-2">
                                        {BACKEND_STAGE_BARS.map((stage, idx) => {
                                            const stageIndex = getStageIndexFromStatus(selectedOrder.status);
                                            const isActive = idx <= stageIndex;
                                            const isCurrent = idx === stageIndex;
                                            return (
                                                <React.Fragment key={stage.id}>
                                                    <div className="flex flex-col items-center flex-1">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${isActive ? `${stage.color} text-white` :
                                                            'bg-gray-200 dark:bg-white/10 text-gray-400'
                                                            } ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#0c0c0c] ring-blue-500' : ''}`}>
                                                            {isActive ? '✓' : idx + 1}
                                                        </div>
                                                        <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">{stage.label}</span>
                                                    </div>
                                                    {idx < BACKEND_STAGE_BARS.length - 1 && (
                                                        <div className={`flex-1 h-1 rounded ${idx < stageIndex ? stage.color : 'bg-gray-200 dark:bg-white/10'}`} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Order Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-500/10 dark:bg-blue-500/5 rounded-xl p-4">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Suit Type</p>
                                        <p className="font-bold text-gray-900 dark:text-white mt-1">{selectedOrder.suit_type_name || 'N/A'}</p>
                                    </div>
                                    <div className="bg-purple-500/10 dark:bg-purple-500/5 rounded-xl p-4">
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Material</p>
                                        <p className="font-bold text-gray-900 dark:text-white mt-1">{selectedOrder.material_name || 'N/A'}</p>
                                    </div>
                                    <div className="bg-pink-500/10 dark:bg-pink-500/5 rounded-xl p-4">
                                        <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold uppercase flex items-center gap-1">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getHexColor(selectedOrder.selected_color) }} />
                                            Color
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div
                                                className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-white/10 shadow-md flex-shrink-0"
                                                style={{ backgroundColor: getHexColor(selectedOrder.selected_color) }}
                                                title={selectedOrder.selected_color || 'N/A'}
                                            />
                                            <p className="font-bold text-gray-900 dark:text-white">{selectedOrder.selected_color || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-red-500/10 dark:bg-red-500/5 rounded-xl p-4">
                                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">Quantity</p>
                                        <p className="font-bold text-gray-900 dark:text-white mt-1">{selectedOrder.quantity}</p>
                                    </div>
                                </div>

                                {/* Measurements */}
                                {selectedOrder.measurements && (
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                                            <HiOutlineDocumentText className="w-4 h-4" />
                                            Measurements
                                        </p>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {Object.entries(selectedOrder.measurements).map(([key, value]) => (
                                                <div key={key} className="bg-white dark:bg-white/5 rounded-lg p-2 text-center">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{key.replace('_', '')}</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">{value || '-'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Due Date & Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`rounded-xl p-4 ${isOverdue(selectedOrder.due_date) ? 'bg-red-500/10 dark:bg-red-500/5' : 'bg-amber-500/10 dark:bg-amber-500/5'
                                        }`}>
                                        <p className={`text-xs font-semibold uppercase ${isOverdue(selectedOrder.due_date) ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                                            }`}>
                                            Due Date
                                        </p>
                                        <p className={`font-bold text-gray-900 dark:text-white mt-1 ${isOverdue(selectedOrder.due_date) ? 'text-red-700 dark:text-red-300' : ''
                                            }`}>
                                            {selectedOrder.due_date || 'Not set'}
                                        </p>
                                    </div>
                                    <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl p-4">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Total Price</p>
                                        <p className="font-bold text-gray-900 dark:text-white mt-1">
                                            {selectedOrder.total_price ? `ETB ${selectedOrder.total_price}` : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
                                    {selectedOrder.status === 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => handleCompleteOrder(selectedOrder.order_code)}
                                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Mark as Completed
                                        </button>
                                    )}
                                    {selectedOrder.status === 'COMPLETED' && (
                                        <button
                                            onClick={() => handleShipOrder(selectedOrder.order_code)}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <HiOutlineTruck className="w-5 h-5" />
                                            Mark as Shipped
                                        </button>
                                    )}
                                    {selectedOrder.status === 'SHIPPED' && (
                                        <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold flex items-center justify-center gap-2">
                                            <HiOutlineTruck className="w-5 h-5" />
                                            Order Completed & Shipped
                                        </div>
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
