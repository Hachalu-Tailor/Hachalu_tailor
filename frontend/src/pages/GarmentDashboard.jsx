import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineScissors,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineCube,
    HiOutlineMagnifyingGlass,
    HiOutlineBell,
    HiOutlineTruck,
    HiOutlineArrowPath,
    HiOutlineXMark,
    HiOutlineFunnel,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineCalendar,
    HiOutlineExclamationCircle,
    HiOutlineEye,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineArrowDownTray,
    HiOutlinePlus,
    HiOutlineMinus,
    HiOutlineSquare2Stack,
    HiOutlineChartBar,
    HiOutlineViewColumns,
    HiOutlineListBullet,
    HiOutlineXCircle,
    HiOutlineShieldCheck,
    HiOutlineUserGroup,
    HiOutlineCurrencyDollar
} from 'react-icons/hi2';
import api, {
    getGarmentOrdersInProgress,
    getGarmentShippedOrders,
    getOrders,
    processGarmentOrder,
    getNotifications
} from '../api/api';
import { useAuth } from '../hooks/useAuth';

const GarmentDashboard = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [error, setError] = useState(null);
    const [filterSuitType, setFilterSuitType] = useState('all');
    const [filterMaterial, setFilterMaterial] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('due_date');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState('all');
    const [prevNotifications, setPrevNotifications] = useState([]);

    const handlePaginatedResponse = (response) => {
        if (!response || !response.data) return [];
        let data = response.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            data = data.results || data.data || data.items || [];
        }
        return data || [];
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                loadOrders();
                loadNotifications();
                setLastRefresh(new Date());
            }, 30000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, activeTab]);

    useEffect(() => {
        loadOrders();
        loadNotifications();
    }, [activeTab]);

    // Helper: Check if order is overdue
    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        return due < now;
    };

    // Helper: Get days remaining or overdue
    const getTimeStatus = (dueDate) => {
        if (!dueDate) return { text: 'No due date', isOverdue: false, daysLeft: null, color: 'text-gray-500' };
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                text: `${Math.abs(diffDays)}d overdue`,
                isOverdue: true,
                daysLeft: diffDays,
                color: 'text-red-600'
            };
        } else if (diffDays === 0) {
            return {
                text: 'Due today',
                isOverdue: false,
                daysLeft: 0,
                color: 'text-orange-600'
            };
        } else if (diffDays <= 2) {
            return {
                text: `${diffDays}d left`,
                isOverdue: false,
                daysLeft: diffDays,
                color: 'text-amber-600'
            };
        }
        return {
            text: `${diffDays} days`,
            isOverdue: false,
            daysLeft: diffDays,
            color: 'text-emerald-600'
        };
    };

    // Get progress stages
    const getProgressStages = (status) => {
        const stages = [
            { id: 'PENDING_APPROVAL', label: 'Approved', icon: HiOutlineShieldCheck },
            { id: 'IN_PROGRESS', label: 'Cutting', icon: HiOutlineScissors },
            { id: 'IN_PROGRESS_STITCHING', label: 'Stitching', icon: HiOutlineScissors },
            { id: 'IN_PROGRESS_FINISHING', label: 'Finishing', icon: HiOutlineCheckCircle },
            { id: 'COMPLETED', label: 'Done', icon: HiOutlineCheckCircle },
            { id: 'SHIPPED', label: 'Shipped', icon: HiOutlineTruck }
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
            isCurrent: index === currentIndex,
            isCompleted: index < currentIndex
        }));
    };

    // Deduplicate notifications by ID
    const deduplicateNotifications = useCallback((newNotifications) => {
        const seen = new Set();
        const unique = [];

        // First add existing notifications
        prevNotifications.forEach(n => {
            if (n.id) {
                seen.add(n.id);
                unique.push(n);
            }
        });

        // Then add new ones that aren't duplicates
        newNotifications.forEach(n => {
            if (n.id && !seen.has(n.id)) {
                unique.push(n);
            } else if (!n.id) {
                unique.push({ ...n, uniqueKey: Math.random().toString(36).substr(2, 9) });
            }
        });

        return unique.slice(0, 20); // Keep max 20 notifications
    }, [prevNotifications]);

    const loadNotifications = async () => {
        try {
            const response = await getNotifications({ limit: 20 });
            const rawNotifications = response.data?.results || [];
            const uniqueNotifications = deduplicateNotifications(rawNotifications);
            setPrevNotifications(uniqueNotifications);
            setNotifications(uniqueNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
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

    const handleStageUpdate = async (orderCode, newStatus) => {
        try {
            await processGarmentOrder(orderCode, { status: newStatus });
            await loadOrders();
            setSelectedOrder(null);
        } catch (error) {
            alert('Failed to update order status.');
        }
    };

    // Bulk actions
    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedOrders.length === 0) return;

        setBulkActionLoading(true);
        try {
            await Promise.all(
                selectedOrders.map(orderCode =>
                    processGarmentOrder(orderCode, { status: newStatus })
                )
            );
            await loadOrders();
            setSelectedOrders([]);
            alert(`Successfully updated ${selectedOrders.length} orders!`);
        } catch (error) {
            alert('Failed to update some orders.');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const toggleOrderSelection = (orderCode) => {
        setSelectedOrders(prev =>
            prev.includes(orderCode)
                ? prev.filter(code => code !== orderCode)
                : [...prev, orderCode]
        );
    };

    const selectAllVisible = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.order_code || o.id));
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
        let result = orders.filter(order => {
            const matchesSearch = order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (filterSuitType !== 'all' && order.suit_type_name !== filterSuitType) return false;
            if (filterMaterial !== 'all' && order.material_name !== filterMaterial) return false;

            // Date range filter
            if (dateRange.start && order.due_date) {
                if (new Date(order.due_date) < new Date(dateRange.start)) return false;
            }
            if (dateRange.end && order.due_date) {
                if (new Date(order.due_date) > new Date(dateRange.end)) return false;
            }

            if (activeTab === 'all') return true;
            if (activeTab === 'in_progress') return order.status === 'IN_PROGRESS' || order.status === 'IN_PROGRESS_STITCHING' || order.status === 'IN_PROGRESS_FINISHING';
            if (activeTab === 'completed') return order.status === 'COMPLETED';
            if (activeTab === 'shipped') return order.status === 'SHIPPED';
            if (activeTab === 'pending') return order.status === 'INITIATED' || order.status === 'PENDING_APPROVAL' || order.status === 'AWAITING_PAYMENT';
            if (activeTab === 'overdue') return isOverdue(order.due_date);

            return true;
        });

        // Sort
        result.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'due_date':
                    aVal = a.due_date ? new Date(a.due_date).getTime() : Infinity;
                    bVal = b.due_date ? new Date(b.due_date).getTime() : Infinity;
                    break;
                case 'order_code':
                    aVal = a.order_code || '';
                    bVal = b.order_code || '';
                    break;
                case 'customer':
                    aVal = a.customer_name || '';
                    bVal = b.customer_name || '';
                    break;
                case 'status':
                    aVal = a.status || '';
                    bVal = b.status || '';
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        return result;
    }, [orders, searchTerm, activeTab, filterSuitType, filterMaterial, dateRange, sortBy, sortOrder]);

    // Stats - Simplified for display
    const stats = useMemo(() => {
        return {
            inProgress: orders.filter(o => o.status?.includes('PROGRESS')).length,
            completed: orders.filter(o => o.status === 'COMPLETED').length,
            total: orders.length
        };
    }, [orders]);

    const tabs = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
        { id: 'completed', label: 'Done', count: stats.completed },
    ];

    // Status badge colors - professional slate/indigo theme
    const getStatusBadge = (status) => {
        const statusMap = {
            'IN_PROGRESS': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Cutting', color: 'bg-indigo-500' },
            'IN_PROGRESS_STITCHING': { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Stitching', color: 'bg-violet-500' },
            'IN_PROGRESS_FINISHING': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Finishing', color: 'bg-purple-500' },
            'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed', color: 'bg-emerald-500' },
            'PENDING_APPROVAL': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending', color: 'bg-amber-500' },
            'SHIPPED': { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Shipped', color: 'bg-slate-500' },
            'INITIATED': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Initiated', color: 'bg-gray-500' },
            'AWAITING_PAYMENT': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Awaiting Payment', color: 'bg-orange-500' },
        };
        return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status?.replace(/_/g, ' '), color: 'bg-gray-500' };
    };

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        if (notificationFilter === 'all') return notifications;
        if (notificationFilter === 'unread') return notifications.filter(n => !n.read);
        if (notificationFilter === 'orders') return notifications.filter(n => n.type === 'order');
        return notifications;
    }, [notifications, notificationFilter]);

    return (
        <div className="w-full space-y-4">
            {/* Header Card - Professional Indigo/Slate Theme */}
            <div className="mb-4">
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur rounded-xl">
                                <HiOutlineScissors className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                    Garment Workshop
                                </h1>
                                <p className="text-slate-300 text-sm mt-1">Manage production orders & track progress</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* View Toggle */}
                            <div className="flex bg-white/10 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-slate-800' : 'text-white/70 hover:text-white'}`}
                                >
                                    <HiOutlineViewColumns className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-800' : 'text-white/70 hover:text-white'}`}
                                >
                                    <HiOutlineListBullet className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`p-2 rounded-lg transition-colors ${autoRefresh ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
                                title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
                            >
                                <HiOutlineArrowPath className={`w-5 h-5 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
                            </button>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20"
                            >
                                <HiOutlineBell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Stats Row - Only 3 key stats */}
                    <div className="flex gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 flex-1 text-center">
                            <div className="text-3xl font-bold">{stats.inProgress}</div>
                            <div className="text-xs text-slate-300 mt-1">In Progress</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 flex-1 text-center">
                            <div className="text-3xl font-bold">{stats.completed}</div>
                            <div className="text-xs text-slate-300 mt-1">Completed</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 flex-1 text-center">
                            <div className="text-3xl font-bold">{stats.total}</div>
                            <div className="text-xs text-slate-300 mt-1">Total Orders</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-white/10">
                        <div className="text-xs text-slate-400">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedOrders.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-3 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            {selectedOrders.length} order(s) selected
                        </span>
                        <button
                            onClick={selectAllVisible}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            {selectedOrders.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkStatusUpdate('IN_PROGRESS')}
                            disabled={bulkActionLoading}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center gap-1"
                        >
                            <HiOutlineScissors className="w-3 h-3" />
                            Start Work
                        </button>
                        <button
                            onClick={() => handleBulkStatusUpdate('COMPLETED')}
                            disabled={bulkActionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg flex items-center gap-1"
                        >
                            <HiOutlineCheckCircle className="w-3 h-3" />
                            Complete
                        </button>
                        <button
                            onClick={() => handleBulkStatusUpdate('SHIPPED')}
                            disabled={bulkActionLoading}
                            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-lg flex items-center gap-1"
                        >
                            <HiOutlineTruck className="w-3 h-3" />
                            Ship
                        </button>
                        <button
                            onClick={() => setSelectedOrders([])}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg"
                        >
                            Clear
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Tabs, Search & Filters */}
            <div className="mb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex gap-2 overflow-x-auto w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-slate-800 text-white'
                                    : tab.isAlert
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`p-2 rounded-lg border transition-colors ${showAdvancedFilters
                                ? 'bg-slate-100 border-slate-300 text-slate-700'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <HiOutlineFunnel className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Suit Type</span>
                                    <select
                                        value={filterSuitType}
                                        onChange={(e) => setFilterSuitType(e.target.value)}
                                        className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-slate-500 outline-none"
                                    >
                                        <option value="all">All Types</option>
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
                                        className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-slate-500 outline-none"
                                    >
                                        <option value="all">All Materials</option>
                                        {materialOptions.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-slate-500 outline-none"
                                        placeholder="From"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-slate-500 outline-none"
                                        placeholder="To"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sort By</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-slate-500 outline-none"
                                    >
                                        <option value="due_date">Due Date</option>
                                        <option value="order_code">Order Code</option>
                                        <option value="customer">Customer</option>
                                        <option value="status">Status</option>
                                    </select>
                                    <button
                                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50"
                                    >
                                        {sortOrder === 'asc' ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setFilterSuitType('all');
                                        setFilterMaterial('all');
                                        setSearchTerm('');
                                        setDateRange({ start: '', end: '' });
                                        setSortBy('due_date');
                                        setSortOrder('asc');
                                    }}
                                    className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Clear All
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HiOutlineExclamationCircle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                        <button onClick={loadOrders} className="underline text-sm">Retry</button>
                    </div>
                </div>
            )}

            {/* Orders Display */}
            <div>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-600"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
                        <HiOutlineCube className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">No Orders Found</h3>
                        <p className="text-gray-400 mt-2">There are no orders in this category.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOrders.map((order) => {
                            const timeStatus = getTimeStatus(order.due_date);
                            const statusBadge = getStatusBadge(order.status);
                            const progressStages = getProgressStages(order.status);
                            const isSelected = selectedOrders.includes(order.order_code || order.id);

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden ${timeStatus.isOverdue ? 'ring-2 ring-red-500' : ''
                                        } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    {/* Selection Checkbox & Status Bar */}
                                    <div className="flex items-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleOrderSelection(order.order_code || order.id);
                                            }}
                                            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'text-indigo-600' : 'text-gray-300'
                                                }`}
                                        >
                                            {isSelected ? (
                                                <HiOutlineCheckCircle className="w-5 h-5" />
                                            ) : (
                                                <HiOutlineCube className="w-5 h-5" />
                                            )}
                                        </button>
                                        <div className={`flex-1 h-1 ${timeStatus.isOverdue ? 'bg-red-500' : statusBadge.color
                                            }`} />
                                    </div>

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
                                                            ? stage.isCurrent ? 'bg-indigo-500' : 'bg-emerald-500'
                                                            : 'bg-gray-200 dark:bg-gray-700'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                {progressStages.slice(0, 4).map((stage, idx) => (
                                                    <span key={idx} className="text-[8px] text-gray-400">{stage.label}</span>
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
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs font-medium ${timeStatus.color}`}>
                                                    {timeStatus.text}
                                                </span>
                                                {timeStatus.isOverdue && (
                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
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
                ) : (
                    /* List View */
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <button onClick={selectAllVisible} className="text-gray-500 hover:text-gray-700">
                                                <HiOutlineSquare2Stack className="w-4 h-4" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Suit Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredOrders.map((order) => {
                                        const timeStatus = getTimeStatus(order.due_date);
                                        const statusBadge = getStatusBadge(order.status);
                                        const isSelected = selectedOrders.includes(order.order_code || order.id);

                                        return (
                                            <tr
                                                key={order.id}
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                                    }`}
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleOrderSelection(order.order_code || order.id);
                                                        }}
                                                        className={`${isSelected ? 'text-indigo-600' : 'text-gray-300'}`}
                                                    >
                                                        {isSelected ? (
                                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                                        ) : (
                                                            <HiOutlineCube className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-medium dark:text-white">{order.order_code}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{order.customer_name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{order.suit_type_name || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-medium ${timeStatus.color}`}>
                                                        {order.due_date || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedOrder(order);
                                                            }}
                                                            className="p-1 text-gray-500 hover:text-indigo-600"
                                                        >
                                                            <HiOutlineEye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white sticky top-0 z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedOrder.order_code}</h2>
                                        <p className="text-slate-300">{selectedOrder.customer_name || 'Unknown Customer'}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                                    >
                                        <HiOutlineXMark className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                {/* Quick Stats */}
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-center">
                                        <HiOutlineCurrencyDollar className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                                        <p className="text-xs text-gray-500">Total</p>
                                        <p className="font-bold dark:text-white">ETB {selectedOrder.total_price || selectedOrder.expected_price || 0}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-center">
                                        <HiOutlineCube className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                                        <p className="text-xs text-gray-500">Quantity</p>
                                        <p className="font-bold dark:text-white">{selectedOrder.quantity}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-center">
                                        <HiOutlineCalendar className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                                        <p className="text-xs text-gray-500">Due Date</p>
                                        <p className="font-bold dark:text-white">{selectedOrder.due_date?.split('T')[0] || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-center">
                                        <HiOutlineClock className="w-5 h-5 mx-auto text-violet-600 mb-1" />
                                        <p className="text-xs text-gray-500">Status</p>
                                        <p className="font-bold dark:text-white">{getStatusBadge(selectedOrder.status).label}</p>
                                    </div>
                                </div>

                                {/* Production Progress */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Production Progress</p>
                                    <div className="flex items-center justify-between">
                                        {getProgressStages(selectedOrder.status).map((stage, idx) => (
                                            <React.Fragment key={stage.id}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stage.isCompleted
                                                        ? 'bg-emerald-500 text-white'
                                                        : stage.isCurrent
                                                            ? 'bg-indigo-500 text-white animate-pulse'
                                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                                                        }`}>
                                                        <stage.icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={`text-xs mt-1 ${stage.isActive ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-400'}`}>
                                                        {stage.label}
                                                    </span>
                                                </div>
                                                {idx < getProgressStages(selectedOrder.status).length - 1 && (
                                                    <div className={`flex-1 h-1 mx-2 ${stage.isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Details Grid */}
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
                                        <p className="text-xs text-gray-500">Measurement</p>
                                        <p className="font-medium dark:text-white">{selectedOrder.measurement_name || 'Standard'}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <p className="text-xs text-gray-500">Expected Price</p>
                                        <p className="font-medium dark:text-white">ETB {selectedOrder.expected_price || 0}</p>
                                    </div>
                                </div>

                                {/* Color Selection */}
                                {(selectedOrder.selected_color || selectedOrder.selected_color_name) && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                                            🎨 Selected Color
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
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                        <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
                                            📏 Measurements
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
                                        </div>
                                    </div>
                                )}

                                {/* Customer Info */}
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                                        👤 Customer Info
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

                                {/* Stage Actions */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Update Status</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOrder.status === 'PENDING_APPROVAL' && (
                                            <button
                                                onClick={() => handleStageUpdate(selectedOrder.order_code, 'IN_PROGRESS')}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2"
                                            >
                                                <HiOutlineScissors className="w-4 h-4" />
                                                Start Cutting
                                            </button>
                                        )}
                                        {selectedOrder.status === 'IN_PROGRESS' && (
                                            <button
                                                onClick={() => handleStageUpdate(selectedOrder.order_code, 'IN_PROGRESS_STITCHING')}
                                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium flex items-center gap-2"
                                            >
                                                <HiOutlineScissors className="w-4 h-4" />
                                                Start Stitching
                                            </button>
                                        )}
                                        {selectedOrder.status === 'IN_PROGRESS_STITCHING' && (
                                            <button
                                                onClick={() => handleStageUpdate(selectedOrder.order_code, 'IN_PROGRESS_FINISHING')}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center gap-2"
                                            >
                                                <HiOutlineCheckCircle className="w-4 h-4" />
                                                Start Finishing
                                            </button>
                                        )}
                                        {(selectedOrder.status === 'IN_PROGRESS' || selectedOrder.status === 'IN_PROGRESS_STITCHING' || selectedOrder.status === 'IN_PROGRESS_FINISHING') && (
                                            <button
                                                onClick={() => handleCompleteOrder(selectedOrder.order_code)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-2"
                                            >
                                                <HiOutlineCheckCircle className="w-4 h-4" />
                                                Mark Completed
                                            </button>
                                        )}
                                        {selectedOrder.status === 'COMPLETED' && (
                                            <button
                                                onClick={() => handleShipOrder(selectedOrder.order_code)}
                                                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium flex items-center gap-2"
                                            >
                                                <HiOutlineTruck className="w-4 h-4" />
                                                Mark Shipped
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notifications Panel */}
            <AnimatePresence>
                {showNotifications && (
                    <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                                    <HiOutlineBell className="w-5 h-5" />
                                    Notifications
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                        {notifications.length}
                                    </span>
                                </h2>
                                <button onClick={() => setShowNotifications(false)}>
                                    <HiOutlineXMark className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
                                {['all', 'unread'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setNotificationFilter(filter)}
                                        className={`px-3 py-1 text-xs rounded-lg ${notificationFilter === filter
                                            ? 'bg-slate-800 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {filteredNotifications.length === 0 ? (
                                    <div className="text-center py-8">
                                        <HiOutlineBell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">No notifications</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredNotifications.map((notif, index) => (
                                            <div
                                                key={notif.id || notif.uniqueKey || index}
                                                className={`p-3 rounded-lg transition-all ${notif.read
                                                    ? 'bg-gray-50 dark:bg-gray-700/50'
                                                    : 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium dark:text-white text-sm">
                                                        {notif.title || 'Notification'}
                                                    </p>
                                                    {!notif.read && (
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-gray-500 text-xs mt-1">{notif.message}</p>
                                                {notif.created_at && (
                                                    <p className="text-gray-400 text-xs mt-2">
                                                        {new Date(notif.created_at).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        setNotifications([]);
                                        setPrevNotifications([]);
                                    }}
                                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Clear all notifications
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GarmentDashboard;
