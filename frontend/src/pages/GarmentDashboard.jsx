import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineScissors,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineCube,
    HiOutlineMagnifyingGlass,
    HiOutlineBell,
    HiOutlinePlay,
    HiOutlinePause,
    HiOutlineStop,
    HiOutlineStar,
    HiOutlineTruck,
    HiOutlineArrowPath,
    HiOutlineXMark
} from 'react-icons/hi2';
import api, { getGarmentOrdersInProgress, getGarmentShippedOrders, processGarmentOrder, getNotifications } from '../api/api';
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

    const loadNotifications = async () => {
        try {
            const response = await getNotifications({ limit: 10 });
            setNotifications(response.data?.results || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const loadOrders = async () => {
        setLoading(true);
        setOrders([]);
        setError(null);

        try {
            let garmentOrders = [];
            const userRole = user?.role || localStorage.getItem('user_role') || '';
            const isAuthorizedUser =
                userRole.toUpperCase() === 'GARMENT' ||
                userRole.toUpperCase() === 'GARMENT_ADMIN' ||
                userRole.toUpperCase() === 'ADMIN' ||
                userRole.toUpperCase() === 'RECEPTIONIST';

            if (isAuthorizedUser) {
                try {
                    const inProgressResponse = await getGarmentOrdersInProgress();
                    garmentOrders = [...garmentOrders, ...(inProgressResponse.data?.results || inProgressResponse.data || [])];
                } catch (err) {
                    console.log('Could not fetch in-progress orders:', err.message);
                }

                try {
                    const shippedResponse = await getGarmentShippedOrders();
                    garmentOrders = [...garmentOrders, ...(shippedResponse.data?.results || shippedResponse.data || [])];
                } catch (err) {
                    console.log('Could not fetch shipped orders:', err.message);
                }
            }

            if (garmentOrders.length === 0) {
                try {
                    const allResponse = await api.get('/orders/', { params: { active_only: true } });
                    let allOrders = allResponse.data;
                    if (allOrders && typeof allOrders === 'object' && !Array.isArray(allOrders)) {
                        allOrders = allOrders.results || allOrders.data || allOrders.items || [];
                    }
                    garmentOrders = (allOrders || []).filter(order => {
                        const status = order.status;
                        return status === 'IN_PROGRESS' ||
                            status === 'PENDING_APPROVAL' ||
                            status === 'COMPLETED' ||
                            status === 'SHIPPED' ||
                            status === 'IN_PROGRESS_STITCHING' ||
                            status === 'IN_PROGRESS_FINISHING';
                    });
                } catch (ordersErr) {
                    if (ordersErr.response?.status === 403) {
                        setError('Permission denied. Please contact administrator.');
                    }
                }
            }

            // Remove duplicates
            const uniqueOrders = [];
            const seen = new Set();
            garmentOrders.forEach(order => {
                if (!seen.has(order.order_code)) {
                    seen.add(order.order_code);
                    uniqueOrders.push(order);
                }
            });

            setOrders(uniqueOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            if (!error.response) {
                setError('Network error. Please check your connection.');
            }
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStartOrder = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'IN_PROGRESS' });
            loadOrders();
            setSelectedOrder(null);
            alert('Order started successfully!');
        } catch (error) {
            console.error('Error starting order:', error);
            alert('Failed to start order.');
        }
    };

    const handleMoveToStitching = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'IN_PROGRESS_STITCHING' });
            loadOrders();
            setSelectedOrder(null);
            alert('Moved to stitching!');
        } catch (error) {
            alert('Failed to move order.');
        }
    };

    const handleMoveToFinishing = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'IN_PROGRESS_FINISHING' });
            loadOrders();
            setSelectedOrder(null);
            alert('Moved to finishing!');
        } catch (error) {
            alert('Failed to move order.');
        }
    };

    const handleCompleteOrder = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'COMPLETED' });
            loadOrders();
            setSelectedOrder(null);
            alert('Order completed!');
        } catch (error) {
            alert('Failed to complete order.');
        }
    };

    const handlePauseOrder = async (orderCode) => {
        try {
            await processGarmentOrder(orderCode, { status: 'PENDING_APPROVAL' });
            loadOrders();
            setSelectedOrder(null);
            alert('Order paused!');
        } catch (error) {
            alert('Failed to pause order.');
        }
    };

    // Filter orders
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (activeTab === 'all') return true;
            if (activeTab === 'in_progress') return order.status === 'IN_PROGRESS' || order.status === 'IN_PROGRESS_STITCHING' || order.status === 'IN_PROGRESS_FINISHING';
            if (activeTab === 'completed') return order.status === 'COMPLETED';
            if (activeTab === 'pending') return order.status === 'INITIATED' || order.status === 'PENDING_APPROVAL' || order.status === 'AWAITING_PAYMENT';
            if (activeTab === 'overdue') return isOverdue(order.due_date);

            return true;
        });
    }, [orders, searchTerm, activeTab]);

    // Stats
    const stats = {
        inProgress: orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'IN_PROGRESS_STITCHING' || o.status === 'IN_PROGRESS_FINISHING').length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        pending: orders.filter(o => o.status === 'INITIATED' || o.status === 'PENDING_APPROVAL' || o.status === 'AWAITING_PAYMENT').length,
        overdue: orders.filter(o => isOverdue(o.due_date) && o.status !== 'COMPLETED').length,
        total: orders.length
    };

    const tabs = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
        { id: 'completed', label: 'Done', count: stats.completed },
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            {/* Header Card */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-xl md:text-3xl font-bold flex items-center gap-3">
                                <HiOutlineScissors className="w-8 h-8" />
                                Garment Workshop
                            </h1>
                            <p className="text-red-100 text-sm mt-1">Manage your production orders</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`p-2 rounded-lg transition-colors ${autoRefresh ? 'bg-white/20' : 'bg-white/10'}`}
                            >
                                <HiOutlineArrowPath className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20"
                            >
                                <HiOutlineBell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 text-xs rounded-full flex items-center justify-center font-bold">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-3 mt-6 overflow-x-auto">
                        <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 min-w-[80px]">
                            <div className="text-2xl font-bold">{stats.inProgress}</div>
                            <div className="text-xs text-red-100">In Progress</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 min-w-[80px]">
                            <div className="text-2xl font-bold">{stats.completed}</div>
                            <div className="text-xs text-red-100">Completed</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 min-w-[80px]">
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <div className="text-xs text-red-100">Pending</div>
                        </div>
                        {stats.overdue > 0 && (
                            <div className="bg-red-500 rounded-xl px-4 py-3 min-w-[80px]">
                                <div className="text-2xl font-bold">{stats.overdue}</div>
                                <div className="text-xs text-red-100">Overdue</div>
                            </div>
                        )}
                        <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 min-w-[80px]">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-xs text-red-100">Total</div>
                        </div>
                    </div>

                    <div className="text-xs text-red-200 mt-4">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Tabs and Search */}
            <div className="max-w-7xl mx-auto mb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex gap-2 overflow-x-auto w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-red-600 text-white'
                                    : tab.isAlert
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="max-w-7xl mx-auto mb-4">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                        <button onClick={loadOrders} className="underline mt-2">Retry</button>
                    </div>
                </div>
            )}

            {/* Orders Grid */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
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
                                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden ${timeStatus.isOverdue ? 'ring-2 ring-red-500' : ''
                                        }`}
                                >
                                    {/* Status Bar */}
                                    <div className={`h-1 ${timeStatus.isOverdue ? 'bg-red-500' : 'bg-red-600'}`} />

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
                                                            ? stage.isCurrent ? 'bg-red-500' : 'bg-green-500'
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
                            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedOrder.order_code}</h2>
                                        <p className="text-red-200">{selectedOrder.customer_name || 'Unknown Customer'}</p>
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
                                                    ? stage.isCurrent ? 'bg-red-500' : 'bg-green-500'
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
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                                        <p className="text-sm font-bold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
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
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl overflow-x-auto">
                                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                            📏 Measurements
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

                                {/* Pricing */}
                                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                                    <p className="text-sm font-bold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
                                        💰 Pricing
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
                                    {selectedOrder.status === 'PENDING_APPROVAL' && (
                                        <button
                                            onClick={() => handleStartOrder(selectedOrder.order_code)}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                        >
                                            <HiOutlinePlay className="w-5 h-5" />
                                            Start Order
                                        </button>
                                    )}
                                    {selectedOrder.status === 'IN_PROGRESS' && (
                                        <>
                                            <button
                                                onClick={() => handleMoveToStitching(selectedOrder.order_code)}
                                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                            >
                                                <HiOutlineScissors className="w-5 h-5" />
                                                Move to Stitching
                                            </button>
                                            <button
                                                onClick={() => handlePauseOrder(selectedOrder.order_code)}
                                                className="w-full py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                            >
                                                <HiOutlinePause className="w-5 h-5" />
                                                Pause
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status === 'IN_PROGRESS_STITCHING' && (
                                        <>
                                            <button
                                                onClick={() => handleMoveToFinishing(selectedOrder.order_code)}
                                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                            >
                                                <HiOutlineStar className="w-5 h-5" />
                                                Move to Finishing
                                            </button>
                                            <button
                                                onClick={() => handlePauseOrder(selectedOrder.order_code)}
                                                className="w-full py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                            >
                                                <HiOutlinePause className="w-5 h-5" />
                                                Pause
                                            </button>
                                        </>
                                    )}
                                    {(selectedOrder.status === 'IN_PROGRESS' || selectedOrder.status === 'IN_PROGRESS_STITCHING' || selectedOrder.status === 'IN_PROGRESS_FINISHING') && (
                                        <button
                                            onClick={() => handleCompleteOrder(selectedOrder.order_code)}
                                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Mark as Completed
                                        </button>
                                    )}
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
                            className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-white dark:bg-gray-800 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h2 className="text-lg font-bold dark:text-white">Notifications</h2>
                                <button onClick={() => setShowNotifications(false)}>
                                    <HiOutlineXMark className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
                                {notifications.length === 0 ? (
                                    <p className="text-gray-500 text-center">No notifications</p>
                                ) : (
                                    notifications.map((notif, index) => (
                                        <div key={index} className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="font-medium dark:text-white text-sm">{notif.title || 'Notification'}</p>
                                            <p className="text-gray-500 text-xs mt-1">{notif.message}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GarmentDashboard;
