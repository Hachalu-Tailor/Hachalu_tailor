import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineScissors,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineCube,
    HiOutlineUserGroup,
    HiOutlineMagnifyingGlass,
    HiOutlineFunnel,
    HiOutlineEye,
    HiOutlineClipboardDocumentCheck,
    HiOutlineExclamationCircle,
    HiOutlineBell,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCalendar,
    HiOutlineArrowDownTray,
    HiOutlineArrowPath,
    HiOutlineDocumentText,
    HiOutlineTruck,
    HiOutlinePause,
    HiOutlinePlay,
    HiOutlineStop,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineShieldCheck,
    HiOutlineExclamationTriangle,
    HiOutlineStar
} from 'react-icons/hi2';
import api, { getGarmentOrdersInProgress, getGarmentShippedOrders, processGarmentOrder, getNotifications, getMaterialDetail } from '../api/api';
import { getHexColor, isLightColor } from '../utils/colors';

const GarmentDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [qualityCheckItems, setQualityCheckItems] = useState({});
    const [showQualityModal, setShowQualityModal] = useState(false);
    const [selectedForQuality, setSelectedForQuality] = useState(null);
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
            return { 
                text: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`, 
                isOverdue: true, 
                daysLeft: diffDays 
            };
        } else if (diffDays === 0) {
            return { text: 'Due today', isOverdue: false, daysLeft: 0 };
        } else if (diffDays <= 2) {
            return { 
                text: `${diffDays} day${diffDays > 1 ? 's' : ''} left`, 
                isOverdue: false, 
                daysLeft: diffDays 
            };
        }
        return { text: `${diffDays} days left`, isOverdue: false, daysLeft: diffDays };
    };

    // Helper: Get progress stages for garment
    const getProgressStages = (status) => {
        const stages = [
            { id: 'INITIATED', label: 'Initiated', icon: HiOutlineDocumentText },
            { id: 'PENDING_APPROVAL', label: 'Approved', icon: HiOutlineCheckCircle },
            { id: 'IN_PROGRESS', label: 'Cutting', icon: HiOutlineScissors },
            { id: 'IN_PROGRESS_STITCHING', label: 'Stitching', icon: HiOutlineScissors },
            { id: 'IN_PROGRESS_FINISHING', label: 'Finishing', icon: HiOutlineStar },
            { id: 'COMPLETED', label: 'Completed', icon: HiOutlineCheckCircle },
            { id: 'SHIPPED', label: 'Shipped', icon: HiOutlineTruck }
        ];
        
        const statusOrder = {
            'INITIATED': 0,
            'PENDING_APPROVAL': 1,
            'IN_PROGRESS': 2,
            'IN_PROGRESS_STITCHING': 3,
            'IN_PROGRESS_FINISHING': 4,
            'COMPLETED': 5,
            'SHIPPED': 6
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
            // Try garment-specific endpoints first
            let garmentOrders = [];
            
            // Try in-progress endpoint
            try {
                const inProgressResponse = await getGarmentOrdersInProgress();
                const inProgressOrders = inProgressResponse.data?.results || inProgressResponse.data || [];
                garmentOrders = [...garmentOrders, ...inProgressOrders];
            } catch (err) {
                console.log('Could not fetch in-progress orders:', err.message);
            }
            
            // Try shipped endpoint
            try {
                const shippedResponse = await getGarmentShippedOrders();
                const shippedOrders = shippedResponse.data?.results || shippedResponse.data || [];
                garmentOrders = [...garmentOrders, ...shippedOrders];
            } catch (err) {
                console.log('Could not fetch shipped orders:', err.message);
            }
            
            // If no garment-specific data, try general orders with better error handling
            if (garmentOrders.length === 0) {
                try {
                    const allResponse = await api.get('/orders/list/');
                    let allOrders = allResponse.data;
                    
                    if (allOrders && typeof allOrders === 'object' && !Array.isArray(allOrders)) {
                        allOrders = allOrders.results || allOrders.data || allOrders.items || [];
                    }

                    // Filter orders for garment dashboard
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
                    // Handle permission errors
                    if (ordersErr.response?.status === 403) {
                        setError('Permission denied. Please ensure your account has garment access.');
                    } else {
                        console.log('Could not fetch general orders:', ordersErr.message);
                    }
                }
            }

            // Remove duplicates by order code
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

    const handleCompleteOrder = async (orderCode) => {
        try {
            let response;
            try {
                response = await processGarmentOrder(orderCode, { status: 'COMPLETED' });
            } catch (err) {
                response = await api.patch(`/orders/${orderCode}/`, { status: 'COMPLETED' });
            }

            if (response.status === 200) {
                loadOrders();
                setSelectedOrder(null);
                alert('Order marked as completed successfully! Reception has been notified.');
            }
        } catch (error) {
            console.error('Error completing order:', error);
            alert('Failed to complete order. The order may already be completed or there was a server error.');
            setSelectedOrder(null);
        }
    };

    const handleStartOrder = async (orderCode) => {
        try {
            let response;
            try {
                response = await processGarmentOrder(orderCode, { status: 'IN_PROGRESS' });
            } catch (err) {
                response = await api.patch(`/orders/${orderCode}/`, { status: 'IN_PROGRESS' });
            }

            if (response.status === 200) {
                loadOrders();
                setSelectedOrder(null);
                alert('Order started successfully! The customer will be notified.');
            }
        } catch (error) {
            console.error('Error starting order:', error);
            alert('Failed to start order. Please try again.');
            setSelectedOrder(null);
        }
    };

    const handleMoveToStitching = async (orderCode) => {
        try {
            const response = await processGarmentOrder(orderCode, { status: 'IN_PROGRESS_STITCHING' });
            if (response.status === 200) {
                loadOrders();
                setSelectedOrder(null);
                alert('Order moved to stitching stage!');
            }
        } catch (error) {
            console.error('Error moving to stitching:', error);
            alert('Failed to move order to stitching. Please try again.');
        }
    };

    const handleMoveToFinishing = async (orderCode) => {
        try {
            const response = await processGarmentOrder(orderCode, { status: 'IN_PROGRESS_FINISHING' });
            if (response.status === 200) {
                loadOrders();
                setSelectedOrder(null);
                alert('Order moved to finishing stage!');
            }
        } catch (error) {
            console.error('Error moving to finishing:', error);
            alert('Failed to move order to finishing. Please try again.');
        }
    };

    const handlePauseOrder = async (orderCode) => {
        try {
            const response = await processGarmentOrder(orderCode, { status: 'PENDING_APPROVAL' });
            if (response.status === 200) {
                loadOrders();
                setSelectedOrder(null);
                alert('Order paused successfully!');
            }
        } catch (error) {
            console.error('Error pausing order:', error);
            alert('Failed to pause order. Please try again.');
        }
    };

    // Export functionality
    const exportToCSV = () => {
        const headers = ['Order Code', 'Customer', 'Suit Type', 'Material', 'Color', 'Quantity', 'Status', 'Due Date', 'Total Price'];
        const rows = filteredOrders.map(order => [
            order.order_code,
            order.customer_name,
            order.suit_type_name,
            order.material_name,
            order.selected_color_name || order.selected_color,
            order.quantity,
            order.status,
            order.due_date,
            order.total_price
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `garment_orders_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        setShowExportMenu(false);
    };

    const exportToJSON = () => {
        const data = filteredOrders.map(order => ({
            order_code: order.order_code,
            customer: order.customer_name,
            suit_type: order.suit_type_name,
            material: order.material_name,
            color: order.selected_color_name || order.selected_color,
            quantity: order.quantity,
            status: order.status,
            due_date: order.due_date,
            total_price: order.total_price
        }));

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `garment_orders_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        setShowExportMenu(false);
    };

    // Quality check functions
    const qualityChecklist = [
        { id: 'measurements', label: 'Measurements verified', description: 'All measurements are correct and match the order' },
        { id: 'cutting', label: 'Cutting completed', description: 'Fabric has been cut according to measurements' },
        { id: 'stitching', label: 'Stitching quality', description: 'All seams are properly stitched and secure' },
        { id: 'fitting', label: 'Fitting check', description: 'Garment fits as expected' },
        { id: 'finishing', label: 'Finishing touches', description: 'Buttons, zippers, and details are properly attached' },
        { id: 'pressing', label: 'Pressing/Ironing', description: 'Garment is properly pressed and wrinkle-free' },
        { id: 'final', label: 'Final inspection', description: 'No defects or issues found' }
    ];

    const handleQualityCheck = (order) => {
        setSelectedForQuality(order);
        setQualityCheckItems(order.id ? (qualityCheckItems[order.id] || {}) : {});
        setShowQualityModal(true);
    };

    const toggleQualityItem = (itemId) => {
        if (!selectedForQuality) return;
        const orderId = selectedForQuality.id;
        setQualityCheckItems(prev => ({
            ...prev,
            [orderId]: {
                ...(prev[orderId] || {}),
                [itemId]: !prev[orderId]?.[itemId]
            }
        }));
    };

    const saveQualityCheck = () => {
        if (!selectedForQuality) return;
        const orderId = selectedForQuality.id;
        const completedCount = Object.values(qualityCheckItems[orderId] || {}).filter(Boolean).length;
        const totalCount = qualityChecklist.length;
        
        alert(`Quality check saved! ${completedCount}/${totalCount} items checked.`);
        setShowQualityModal(false);
    };

    // Filter orders based on search and date range
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            // Date range filter
            if (dateRange.start && order.due_date) {
                const orderDate = new Date(order.due_date);
                const startDate = new Date(dateRange.start);
                if (orderDate < startDate) return false;
            }
            if (dateRange.end && order.due_date) {
                const orderDate = new Date(order.due_date);
                const endDate = new Date(dateRange.end);
                if (orderDate > endDate) return false;
            }

            if (activeTab === 'all') return true;
            if (activeTab === 'in_progress') return order.status === 'IN_PROGRESS' || order.status === 'IN_PROGRESS_STITCHING' || order.status === 'IN_PROGRESS_FINISHING';
            if (activeTab === 'completed') return order.status === 'COMPLETED';
            if (activeTab === 'pending') return order.status === 'INITIATED' || order.status === 'PENDING_APPROVAL' || order.status === 'AWAITING_PAYMENT';
            if (activeTab === 'overdue') return isOverdue(order.due_date);

            return true;
        });
    }, [orders, searchTerm, dateRange, activeTab]);

    // Calculate stats
    const stats = {
        inProgress: orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'IN_PROGRESS_STITCHING' || o.status === 'IN_PROGRESS_FINISHING').length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        pending: orders.filter(o => o.status === 'INITIATED' || o.status === 'PENDING_APPROVAL' || o.status === 'AWAITING_PAYMENT').length,
        overdue: orders.filter(o => isOverdue(o.due_date) && o.status !== 'COMPLETED').length,
        total: orders.length
    };

    const tabs = [
        { id: 'all', label: 'All Orders', count: stats.total },
        { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
        { id: 'completed', label: 'Completed', count: stats.completed },
        { id: 'pending', label: 'Pending', count: stats.pending },
        { id: 'overdue', label: '⚠ Overdue', count: stats.overdue, isAlert: true },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-4 md:p-8 lg:p-12 transition-colors duration-500">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-white dark:bg-[#0a0a0a] p-6 md:p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-black/5">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex-1">
                            <h1 className="text-3xl font-black dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                                <HiOutlineScissors className="text-red-600" />
                                Garment <span className="text-red-600">Workshop</span>
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> 
                                    Tailor Management System
                                </p>
                                {autoRefresh && (
                                    <span className="text-[10px] text-gray-500">
                                        Auto-refresh: ON
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Auto-refresh toggle */}
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`p-3 rounded-2xl transition-colors ${autoRefresh ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}
                                title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}
                            >
                                <HiOutlineArrowPath size={20} />
                            </button>

                            {/* Export Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <HiOutlineArrowDownTray className="w-6 h-6 dark:text-white" />
                                </button>
                                <AnimatePresence>
                                    {showExportMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50"
                                        >
                                            <button
                                                onClick={exportToCSV}
                                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white flex items-center gap-2"
                                            >
                                                <HiOutlineDocumentText size={16} />
                                                Export to CSV
                                            </button>
                                            <button
                                                onClick={exportToJSON}
                                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white flex items-center gap-2"
                                            >
                                                <HiOutlineDocumentText size={16} />
                                                Export to JSON
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <HiOutlineBell className="w-6 h-6 dark:text-white" />
                                    {notifications.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden z-50"
                                        >
                                            <div className="p-4 border-b border-gray-100 dark:border-white/5">
                                                <h3 className="font-bold dark:text-white">Notifications</h3>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-4 text-center text-gray-500">No notifications</div>
                                                ) : (
                                                    notifications.map((notif, index) => (
                                                        <div key={index} className="p-4 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                                                            <p className="text-sm dark:text-white font-medium">{notif.title || 'Notification'}</p>
                                                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-2">{notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-3 mt-6 overflow-x-auto pb-2">
                        <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl min-w-[80px]">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
                            <div className="text-[9px] uppercase text-gray-500">In Progress</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-2xl min-w-[80px]">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
                            <div className="text-[9px] uppercase text-gray-500">Completed</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl min-w-[80px]">
                            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                            <div className="text-[9px] uppercase text-gray-500">Pending</div>
                        </div>
                        {stats.overdue > 0 && (
                            <div className="text-center px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-2xl min-w-[80px]">
                                <div className="text-xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</div>
                                <div className="text-[9px] uppercase text-gray-500">Overdue</div>
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/garment/messages')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center gap-2 transition-all min-w-[100px]"
                        >
                            <HiOutlineChatBubbleLeftRight size={18} />
                            <div className="text-[9px] font-bold uppercase">Messages</div>
                        </button>
                        <div className="text-center px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-2xl min-w-[80px]">
                            <div className="text-xl font-bold dark:text-white">{stats.total}</div>
                            <div className="text-[9px] uppercase text-gray-500">Total</div>
                        </div>
                    </div>

                    {/* Last refresh time */}
                    <div className="text-[10px] text-gray-400 mt-3 text-right">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Tabs and Filters */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-red-600 text-white'
                                    : tab.isAlert 
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                                        : 'bg-white dark:bg-[#0a0a0a] text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 rounded-2xl transition-colors ${showFilters ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-white dark:bg-[#0a0a0a] text-gray-500'}`}
                        >
                            <HiOutlineFunnel size={20} />
                        </button>
                        <div className="relative">
                            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all w-48 md:w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 mb-4 border border-gray-100 dark:border-white/5"
                        >
                            <h3 className="font-bold dark:text-white mb-3">Filter by Date Range</h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 dark:text-white"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={() => setDateRange({ start: '', end: '' })}
                                        className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Orders Grid */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-red-200 dark:border-red-800">
                        <HiOutlineExclamationCircle className="mx-auto text-6xl text-red-400 mb-4" />
                        <h3 className="text-xl font-bold text-red-500 dark:text-red-400">Access Denied</h3>
                        <p className="text-gray-400 mt-2">{error}</p>
                        <button
                            onClick={() => loadOrders()}
                            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-100 dark:border-white/5">
                        <HiOutlineCube className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">No Orders Found</h3>
                        <p className="text-gray-400">There are no orders in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOrders.map((order) => {
                            const timeStatus = getTimeStatus(order.due_date);
                            const progressStages = getProgressStages(order.status);
                            
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white dark:bg-[#0a0a0a] rounded-3xl border p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden ${
                                        timeStatus.isOverdue 
                                            ? 'border-red-300 dark:border-red-700/50' 
                                            : timeStatus.daysLeft !== null && timeStatus.daysLeft <= 2
                                                ? 'border-yellow-300 dark:border-yellow-700/50'
                                                : 'border-gray-100 dark:border-white/5'
                                    }`}
                                    onClick={async () => {
                                        setSelectedOrder(order);
                                        // Try to fetch material details if we have material ID
                                        if (order.material && typeof order.material === 'number') {
                                            try {
                                                const matRes = await getMaterialDetail(order.material);
                                                const mat = matRes.data;
                                                setSelectedOrder(prev => ({
                                                    ...prev,
                                                    material_image: mat.image_url,
                                                    material_colors: mat.colors || []
                                                }));
                                            } catch (err) {
                                                // Silently fail - use order's existing material data
                                                console.log('Could not fetch material details');
                                            }
                                        }
                                        // Ensure color info is preserved
                                        if (!order.material_image && (order.selected_color || order.selected_color_name || order.material_color)) {
                                            setSelectedOrder(prev => ({
                                                ...prev,
                                                hasColorInfo: true
                                            }));
                                        }
                                    }}
                                >
                                    {/* Overdue/Warning Banner */}
                                    {timeStatus.isOverdue && (
                                        <div className="bg-red-600 text-white px-3 py-1 -mx-5 -mt-5 mb-3 flex items-center gap-2">
                                            <HiOutlineExclamationTriangle size={14} />
                                            <span className="text-xs font-bold">{timeStatus.text}</span>
                                        </div>
                                    )}
                                    {!timeStatus.isOverdue && timeStatus.daysLeft !== null && timeStatus.daysLeft <= 2 && order.status !== 'COMPLETED' && (
                                        <div className="bg-yellow-500 text-white px-3 py-1 -mx-5 -mt-5 mb-3 flex items-center gap-2">
                                            <HiOutlineClock size={14} />
                                            <span className="text-xs font-bold">{timeStatus.text}</span>
                                        </div>
                                    )}

                                    {/* Material Image */}
                                    {(order.material_image || order.material?.image_url) && (
                                        <div className="mb-3 -mx-5 relative h-32 overflow-hidden">
                                            <img
                                                src={order.material_image || order.material?.image_url}
                                                alt={order.material_name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        </div>
                                    )}
                                    {/* Color indicator when no image */}
                                    {!order.material_image && !order.material?.image_url && (order.selected_color_name || order.selected_color || order.material_color) && (
                                        <div className="mb-3 -mx-5 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-3xl">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-md flex-shrink-0" 
                                                    style={{ 
                                                        backgroundColor: getHexColor(order.selected_color_name || order.selected_color || order.material_color)
                                                    }}
                                                />
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Selected Color</p>
                                                    <p className="font-bold dark:text-white text-sm">{order.selected_color_name || order.selected_color || order.material_color}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold dark:text-white">{order.order_code}</h3>
                                            <p className="text-sm text-gray-500">{order.customer_name || 'Unknown Customer'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {order.payment_status && (
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${order.payment_status === 'verified'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                    : order.payment_status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400'
                                                    }`}>
                                                    {order.payment_status === 'verified' ? '✓ Paid' :
                                                        order.payment_status === 'pending' ? '⏳ Pending' :
                                                            order.payment_status === 'awaiting' ? '💰 Awaiting' : ''}
                                                </span>
                                            )}
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'IN_PROGRESS'
                                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                : order.status === 'COMPLETED'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                    : order.status === 'IN_PROGRESS_STITCHING'
                                                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                                        : order.status === 'IN_PROGRESS_FINISHING'
                                                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                                            : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {order.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Stages Mini Bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between gap-1">
                                            {progressStages.slice(1, 5).map((stage, idx) => (
                                                <div
                                                    key={stage.id}
                                                    className={`flex-1 h-1.5 rounded-full ${
                                                        stage.isActive 
                                                            ? stage.isCurrent 
                                                                ? 'bg-red-500' 
                                                                : 'bg-green-500' 
                                                            : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                                    title={stage.label}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[8px] text-gray-400">Cutting</span>
                                            <span className="text-[8px] text-gray-400">Stitch</span>
                                            <span className="text-[8px] text-gray-400">Finish</span>
                                            <span className="text-[8px] text-gray-400">Done</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Suit:</span>
                                            <span className="dark:text-white font-medium">{order.suit_type_name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Material:</span>
                                            <div className="flex items-center gap-2">
                                                {(order.selected_color_name || order.selected_color || order.material_color) && (
                                                    <div className="flex items-center gap-1">
                                                        <span
                                                            className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
                                                            style={{
                                                                backgroundColor: getHexColor(order.selected_color_name || order.selected_color || order.material_color || '#888')
                                                            }}
                                                            title={order.selected_color_name || order.selected_color || order.material_color}
                                                        />
                                                        <span className="dark:text-white font-medium text-sm">
                                                            {order.selected_color_name || order.selected_color || order.material_color}
                                                        </span>
                                                    </div>
                                                )}
                                                {!order.selected_color_name && !order.selected_color && !order.material_color && (
                                                    <span className="dark:text-white font-medium">{order.material_name || 'N/A'}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Qty:</span>
                                            <span className="dark:text-white font-medium">{order.quantity}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className={`${timeStatus.isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                                Due: {order.due_date || 'Not set'}
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleQualityCheck(order);
                                                    }}
                                                    className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40"
                                                    title="Quality Check"
                                                >
                                                    <HiOutlineShieldCheck size={14} />
                                                </button>
                                                <HiOutlineEye className="text-gray-400" size={16} />
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
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4 pt-12 md:pt-16">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedOrder(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 40 }}
                            className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header with Image */}
                            <div 
                                className="bg-gradient-to-r p-0 text-white relative"
                                style={{
                                    background: selectedOrder.material_image_url 
                                        ? 'linear-gradient(to right, #dc2626, #991b1b)'
                                        : (selectedOrder.selected_color || selectedOrder.selected_color_name)
                                            ? `linear-gradient(135deg, ${getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name)}, #666666)`
                                            : 'linear-gradient(to right, #dc2626, #991b1b)'
                                }}
                            >
                                <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-900">
                                    {selectedOrder.material_image_url ? (
                                        <>
                                            <img
                                                src={selectedOrder.material_image_url}
                                                alt="Material Design"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div className="hidden absolute inset-0 bg-gradient-to-t from-red-900/90 via-red-900/50 to-transparent flex items-center justify-center">
                                                <div className="text-center">
                                                    <HiOutlineCube className="w-16 h-16 mx-auto mb-2 text-red-300" />
                                                    <p className="text-red-200 text-sm">No Image Available</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center">
                                            <div className="text-center">
                                                {(selectedOrder.selected_color || selectedOrder.selected_color_name) && (
                                                    <div 
                                                        className="w-24 h-24 rounded-full border-4 border-white/30 shadow-2xl mx-auto mb-4" 
                                                        style={{ 
                                                            backgroundColor: getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name),
                                                            borderColor: isLightColor(getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name)) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.3)'
                                                        }}
                                                    />
                                                )}
                                                <HiOutlineCube className="w-16 h-16 mx-auto text-red-300" />
                                                <p className="text-red-200 text-sm mt-2">
                                                    {selectedOrder.material_name || 'No Image Available'}
                                                </p>
                                                {(selectedOrder.selected_color || selectedOrder.selected_color_name) && (
                                                    <p className="text-white/80 text-xs mt-1">
                                                        Color: {selectedOrder.selected_color_name || selectedOrder.selected_color}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h2 className="text-3xl font-black uppercase italic">{selectedOrder.order_code}</h2>
                                        <p className="text-red-200 text-sm">{selectedOrder.customer_name || 'Unknown Customer'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                {/* Progress Timeline */}
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                    <p className="text-xs text-gray-500 uppercase mb-3">Production Progress</p>
                                    <div className="flex items-center justify-between">
                                        {getProgressStages(selectedOrder.status).map((stage, idx) => (
                                            <React.Fragment key={stage.id}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                        stage.isActive 
                                                            ? stage.isCurrent 
                                                                ? 'bg-red-500 text-white animate-pulse' 
                                                                : 'bg-green-500 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                                    }`}>
                                                        <stage.icon size={16} />
                                                    </div>
                                                    <span className="text-[8px] mt-1 text-gray-500">{stage.label}</span>
                                                </div>
                                                {idx < getProgressStages(selectedOrder.status).length - 1 && (
                                                    <div className={`flex-1 h-0.5 ${
                                                        stage.isActive ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                {/* Status with Time Warning */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500">Status</span>
                                        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${
                                            selectedOrder.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                                            selectedOrder.status === 'IN_PROGRESS_STITCHING' ? 'bg-purple-100 text-purple-600' :
                                            selectedOrder.status === 'IN_PROGRESS_FINISHING' ? 'bg-orange-100 text-orange-600' :
                                            selectedOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                            'bg-yellow-100 text-yellow-600'
                                        }`}>
                                            {selectedOrder.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    {getTimeStatus(selectedOrder.due_date).isOverdue && (
                                        <div className="flex items-center gap-2 text-red-500">
                                            <HiOutlineExclamationTriangle size={16} />
                                            <span className="text-xs font-bold">Overdue!</span>
                                        </div>
                                    )}
                                </div>

                                {/* Order Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Suit Type</p>
                                        <p className="font-bold dark:text-white">{selectedOrder.suit_type_name || 'N/A'}</p>
                                    </div>
                                    {(selectedOrder.selected_color || selectedOrder.selected_color_name) && (
                                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                            <p className="text-xs text-gray-500 uppercase mb-1">Selected Color</p>
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-full border-2 shadow-lg" 
                                                    style={{ 
                                                        backgroundColor: getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name),
                                                        borderColor: isLightColor(getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name)) ? '#ccc' : getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name)
                                                    }}
                                                />
                                                <p className="font-bold dark:text-white">{selectedOrder.selected_color_name || selectedOrder.selected_color}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Material</p>
                                        {selectedOrder.material_image ? (
                                            <div className="relative">
                                                <img
                                                    src={selectedOrder.material_image}
                                                    alt={selectedOrder.material_name || 'Material'}
                                                    className="w-full h-32 object-cover rounded-xl"
                                                />
                                                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-lg">
                                                    <p className="text-xs font-bold text-white">{selectedOrder.material_name}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full p-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    {(selectedOrder.selected_color || selectedOrder.selected_color_name) && (
                                                        <div 
                                                            className="w-12 h-12 rounded-full border-4 shadow-lg flex-shrink-0" 
                                                            style={{ 
                                                                backgroundColor: getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name),
                                                                borderColor: isLightColor(getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name)) ? '#e5e7eb' : getHexColor(selectedOrder.selected_color || selectedOrder.selected_color_name)
                                                            }}
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-bold dark:text-white">{selectedOrder.material_name || 'No Image'}</p>
                                                        {(selectedOrder.selected_color || selectedOrder.selected_color_name) && (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                Color: {selectedOrder.selected_color_name || selectedOrder.selected_color}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Quantity</p>
                                        <p className="font-bold dark:text-white">{selectedOrder.quantity}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Due Date</p>
                                        <p className={`font-bold ${getTimeStatus(selectedOrder.due_date).isOverdue ? 'text-red-500' : 'dark:text-white'}`}>
                                            {selectedOrder.due_date || 'Not set'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Total Price</p>
                                        <p className="font-bold dark:text-white">ETB {selectedOrder.total_price || '0'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Expected Price</p>
                                        <p className="font-bold dark:text-white">ETB {selectedOrder.expected_price || '0'}</p>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                    <p className="text-xs text-gray-500 uppercase mb-2">Customer Details</p>
                                    <div className="space-y-1">
                                        <p className="dark:text-white"><strong>Name:</strong> {selectedOrder.customer_name || 'N/A'}</p>
                                        <p className="dark:text-white"><strong>Phone:</strong> {selectedOrder.customer_phone || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Measurements */}
                                {selectedOrder.measurements && (
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Measurements</p>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div><span className="text-gray-500">Chest:</span> <span className="dark:text-white font-medium">{selectedOrder.measurements.chest || '-'}</span></div>
                                            <div><span className="text-gray-500">Shoulder:</span> <span className="dark:text-white font-medium">{selectedOrder.measurements.shoulder || '-'}</span></div>
                                            <div><span className="text-gray-500">Waist:</span> <span className="dark:text-white font-medium">{selectedOrder.measurements.waist || '-'}</span></div>
                                            <div><span className="text-gray-500">Hips:</span> <span className="dark:text-white font-medium">{selectedOrder.measurements.hips || '-'}</span></div>
                                            <div><span className="text-gray-500">Arm:</span> <span className="dark:text-white font-medium">{selectedOrder.measurements.arm_length || '-'}</span></div>
                                            <div><span className="text-gray-500">Height:</span> <span className="dark:text-white font-medium">{selectedOrder.measurements.height || '-'}</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-gray-100 dark:border-white/5 space-y-3">
                                {/* Quick Actions based on status */}
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedOrder.status === 'PENDING_APPROVAL' && (
                                        <button
                                            onClick={() => handleStartOrder(selectedOrder.order_code)}
                                            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <HiOutlinePlay size={18} />
                                            Start Order
                                        </button>
                                    )}
                                    {selectedOrder.status === 'IN_PROGRESS' && (
                                        <>
                                            <button
                                                onClick={() => handleMoveToStitching(selectedOrder.order_code)}
                                                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <HiOutlineScissors size={18} />
                                                Move to Stitching
                                            </button>
                                            <button
                                                onClick={() => handlePauseOrder(selectedOrder.order_code)}
                                                className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <HiOutlinePause size={18} />
                                                Pause
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status === 'IN_PROGRESS_STITCHING' && (
                                        <>
                                            <button
                                                onClick={() => handleMoveToFinishing(selectedOrder.order_code)}
                                                className="px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <HiOutlineStar size={18} />
                                                Move to Finishing
                                            </button>
                                            <button
                                                onClick={() => handlePauseOrder(selectedOrder.order_code)}
                                                className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <HiOutlinePause size={18} />
                                                Pause
                                            </button>
                                        </>
                                    )}
                                    {(selectedOrder.status === 'IN_PROGRESS' || selectedOrder.status === 'IN_PROGRESS_STITCHING' || selectedOrder.status === 'IN_PROGRESS_FINISHING') && (
                                        <button
                                            onClick={() => handleCompleteOrder(selectedOrder.order_code)}
                                            className="col-span-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                                        >
                                            <HiOutlineCheckCircle size={24} />
                                            Mark as Completed
                                        </button>
                                    )}
                                </div>
                                
                                {/* Quality Check Button */}
                                <button
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        handleQualityCheck(selectedOrder);
                                    }}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <HiOutlineShieldCheck size={20} />
                                    Quality Check
                                </button>

                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-full px-6 py-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white font-bold rounded-2xl transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quality Check Modal */}
            <AnimatePresence>
                {showQualityModal && selectedForQuality && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setShowQualityModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 40 }}
                            className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-white/5">
                                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                    <HiOutlineShieldCheck className="text-green-500" />
                                    Quality Check
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Order: {selectedForQuality.order_code}</p>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 space-y-3">
                                {qualityChecklist.map((item) => {
                                    const orderId = selectedForQuality.id;
                                    const isChecked = qualityCheckItems[orderId]?.[item.id] || false;
                                    
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleQualityItem(item.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                isChecked 
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                        isChecked 
                                                            ? 'border-green-500 bg-green-500 text-white' 
                                                            : 'border-gray-300 dark:border-gray-600'
                                                    }`}>
                                                        {isChecked && <HiOutlineCheckCircle size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold dark:text-white">{item.label}</p>
                                                        <p className="text-xs text-gray-500">{item.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-white/5">
                                <div className="flex gap-3">
                                    <button
                                        onClick={saveQualityCheck}
                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold rounded-2xl transition-all"
                                    >
                                        Save Quality Check
                                    </button>
                                    <button
                                        onClick={() => setShowQualityModal(false)}
                                        className="px-6 py-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white font-bold rounded-2xl transition-colors"
                                    >
                                        Cancel
                                    </button>
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
