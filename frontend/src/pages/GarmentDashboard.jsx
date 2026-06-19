import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
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
    HiOutlineExclamationTriangle,
    HiOutlineClock,
} from 'react-icons/hi2';
import {
    getGarmentOrdersInProgress,
    getGarmentShippedOrders,
    getOrders,
    processGarmentOrder,
    getPayments,
    getMaterials
} from '../api/api';
import { getHexColor } from '../utils/colors';
import { API_BASE_URL } from '../utils/constants';
import { UrgencyIndicator, CompactUrgency } from '../components/UrgencyIndicator';
import { useToast } from '../components/Toast';

// Backend status configuration - ONLY use backend statuses (IN_PROGRESS, COMPLETED, SHIPPED)
const BACKEND_STATUSES = {
    IN_PROGRESS: 
    {
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
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [showQuickLatest, setShowQuickLatest] = useState(false);
    const [fullImage, setFullImage] = useState(null);
    const [receiptByOrderCode, setReceiptByOrderCode] = useState({});
    const [materialById, setMaterialById] = useState({});
    const [urgentOrders, setUrgentOrders] = useState([]);
    const [alertedOrders, setAlertedOrders] = useState(new Set());
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

    const backendOrigin = useMemo(() => {
        if (typeof API_BASE_URL === 'string' && API_BASE_URL.startsWith('http') && typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
            try {
                return new URL(API_BASE_URL).origin;
            } catch {
                return 'http://127.0.0.1:8000';
            }
        }

        if (typeof window !== 'undefined' && window.location?.origin) {
            // In development, use frontend origin and Vite /media proxy for LAN compatibility.
            return window.location.origin;
        }

        return 'http://127.0.0.1:5173';
    }, []);

    const getAbsoluteUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('data:')) return url;

        if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
                const parsed = new URL(url);
                if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
                    return `${backendOrigin}${parsed.pathname}${parsed.search || ''}`;
                }
                return url;
            } catch {
                return url;
            }
        }

        const normalizedPath = url.startsWith('/') ? url : `/${url}`;
        return `${backendOrigin}${normalizedPath}`;
    };

    const getOrderImages = (order) => {
        const materialData = materialById[Number(order?.material)] || {};
        const materialImage = getAbsoluteUrl(
            order?.material_image || order?.image_url || materialData?.material_image || materialData?.image_url || ''
        );
        const suitSampleImage = getAbsoluteUrl(
            order?.suit_sample_image || materialData?.suit_sample_image || ''
        );
        return { materialImage, suitSampleImage };
    };

    const normalizeStatus = (status) => String(status || '').toUpperCase().trim();

    const fetchAllPages = async (fetchPage, baseParams = {}) => {
        const collected = [];
        const seen = new Set();
        const MAX_PAGES = 50;

        for (let page = 1; page <= MAX_PAGES; page += 1) {
            const response = await fetchPage({ ...baseParams, page }).catch(() => ({ data: [] }));
            const pageItems = handlePaginatedResponse(response);

            pageItems.forEach((order) => {
                const key = order.order_code || order.id;
                if (!key || seen.has(key)) return;
                seen.add(key);
                collected.push(order);
            });

            const hasNextPage = Boolean(
                response?.data &&
                typeof response.data === 'object' &&
                !Array.isArray(response.data) &&
                response.data.next
            );

            if (!hasNextPage) break;
        }

        return collected;
    };

    useEffect(() => {
        loadOrders();
        // Initial dashboard load only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Get urgent orders (orders with due_date within 5 days) - ONLY for IN_PROGRESS
    const getUrgentOrders = (orderList) => {
        const now = new Date();
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
        
        return (orderList || []).filter(o => {
            // Only include IN_PROGRESS orders - exclude COMPLETED and SHIPPED
            if (o.status !== 'IN_PROGRESS') return false;
            if (!o.due_date) return false;
            const dueDate = new Date(o.due_date);
            return dueDate >= now && dueDate <= fiveDaysFromNow;
        });
    };

    const loadOrders = async () => {
        setLoading(true);
        setError(null);

        try {
            const [inProgressResponse, shippedResponse, processedOrders, paymentsResponse, materialsResponse] = await Promise.all([
                getGarmentOrdersInProgress().catch(() => ({ data: [] })),
                getGarmentShippedOrders().catch(() => ({ data: [] })),
                fetchAllPages(getOrders, { processed_only: true }),
                getPayments().catch(() => ({ data: [] })),
                getMaterials().catch(() => ({ data: [] }))
            ]);

            const inProgressOrders = handlePaginatedResponse(inProgressResponse);
            const shippedOrders = handlePaginatedResponse(shippedResponse);
            const completedOrders = (Array.isArray(processedOrders) ? processedOrders : [])
                .filter((order) => normalizeStatus(order.status) === 'COMPLETED');

            // Prefer processed/completed and shipped sources first, then fill with in-progress.
            const combinedOrders = [...completedOrders, ...shippedOrders, ...inProgressOrders];
            const uniqueOrders = [];
            const seen = new Set();

            combinedOrders.forEach(order => {
                const key = order.order_code || order.id;
                if (key && !seen.has(key)) {
                    seen.add(key);
                    uniqueOrders.push(order);
                }
            });

            const paymentsData = handlePaginatedResponse(paymentsResponse);
            const materialsData = handlePaginatedResponse(materialsResponse);
            const latestReceiptMap = {};
            paymentsData.forEach(payment => {
                const orderCode = payment?.order_code;
                const receiptScreenshot = payment?.receipt_screenshot;
                if (!orderCode || !receiptScreenshot) return;

                const createdAtMs = new Date(payment.created_at || 0).getTime();
                const previous = latestReceiptMap[orderCode];
                if (!previous || createdAtMs > previous.createdAtMs) {
                    latestReceiptMap[orderCode] = {
                        createdAtMs,
                        url: getAbsoluteUrl(receiptScreenshot),
                    };
                }
            });

            const resolvedReceipts = {};
            Object.keys(latestReceiptMap).forEach(orderCode => {
                resolvedReceipts[orderCode] = latestReceiptMap[orderCode].url;
            });

            const normalizedOrders = uniqueOrders.map((order) => ({
                ...order,
                status: normalizeStatus(order.status),
            }));

            const materialLookup = {};
            (materialsData || []).forEach((m) => {
                if (!m?.id) return;
                materialLookup[Number(m.id)] = m;
            });

            setOrders(normalizedOrders);
            setMaterialById(materialLookup);
            setReceiptByOrderCode(resolvedReceipts);
            
            // Check for urgent orders (due within 5 days)
            const urgent = getUrgentOrders(normalizedOrders);
            setUrgentOrders(urgent);
            
            // Check for critical orders (< 3 hours) and trigger alerts
            checkCriticalOrders(normalizedOrders);
            
            return normalizedOrders;
        } catch (error) {
            console.error('Error loading orders:', error);
            if (error.response?.status === 403) {
                setError('Permission denied. Please contact administrator.');
            } else if (!error.response) {
                setError('Network error. Please check your connection.');
            }
            setOrders([]);
            setReceiptByOrderCode({});
            setMaterialById({});
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Check for orders with less than 3 hours remaining and trigger toast alerts - ONLY for IN_PROGRESS
    const checkCriticalOrders = useCallback((orderList) => {
        if (!orderList || orderList.length === 0) return;
        
        const now = new Date();
        const threeHoursMs = 3 * 60 * 60 * 1000;
        
        orderList.forEach(order => {
            // Only check IN_PROGRESS orders - skip COMPLETED and SHIPPED
            if (order.status !== 'IN_PROGRESS') return;
            if (!order.due_date) return;
            if (alertedOrders.has(order.order_code)) return;
            
            const dueDate = new Date(order.due_date);
            const timeRemaining = dueDate - now;
            
            // If less than 3 hours remaining
            if (timeRemaining > 0 && timeRemaining <= threeHoursMs) {
                toast.warning(`⚠️ Order ${order.order_code} has less than 3 hours remaining!`, {
                    duration: 8000,
                });
                setAlertedOrders(prev => new Set([...prev, order.order_code]));
            }
        });
    }, [alertedOrders, toast]);

    // Set up interval to check for critical orders every minute
    useEffect(() => {
        const interval = setInterval(() => {
            checkCriticalOrders(orders);
        }, 60000); // Check every minute
        
        return () => clearInterval(interval);
    }, [orders, checkCriticalOrders]);

    const handleCompleteOrder = async (orderCode) => {
        try {
            const response = await processGarmentOrder(orderCode, { status: 'COMPLETED' });
            const updatedOrder = {
                ...(response?.data || {}),
                status: 'COMPLETED',
            };

            setOrders((prev) => {
                const index = prev.findIndex((order) => order.order_code === orderCode);
                if (index === -1) return [updatedOrder, ...prev];
                return prev.map((order, i) => (i === index ? { ...order, ...updatedOrder } : order));
            });

            await loadOrders();
            setSelectedOrder(null);
            setActiveTab('completed');
            toast.success(`Order ${orderCode} completed successfully.`, { duration: 3500 });
        } catch {
            toast.error('Failed to complete order. Please try again.');
        }
    };

    const handleShipOrder = async (orderCode) => {
        try {
            const response = await processGarmentOrder(orderCode, { status: 'SHIPPED' });
            const updatedOrder = {
                ...(response?.data || {}),
                status: 'SHIPPED',
            };

            setOrders((prev) => {
                const index = prev.findIndex((order) => order.order_code === orderCode);
                if (index === -1) return [updatedOrder, ...prev];
                return prev.map((order, i) => (i === index ? { ...order, ...updatedOrder } : order));
            });

            await loadOrders();
            setSelectedOrder(null);
            setActiveTab('shipped');
            toast.success(`Order ${orderCode} shipped successfully.`, { duration: 3500 });
        } catch {
            toast.error('Failed to ship order. Please try again.');
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
            if (activeTab === 'urgent') {
                if (order.status !== 'IN_PROGRESS' || !order.due_date) return false;
                const ts = getTimeStatus(order.due_date);
                return !ts.isOverdue && ts.daysLeft !== null && ts.daysLeft <= 5;
            }
            if (activeTab === 'overdue') return isOverdue(order.due_date) && order.status === 'IN_PROGRESS';

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
        if (filters.sortBy === 'urgent') {
            list.sort((a, b) => {
                const getUrgencyRank = (order) => {
                    if (order.status !== 'IN_PROGRESS') return 4;
                    if (!order.due_date) return 3;
                    const ts = getTimeStatus(order.due_date);
                    if (ts.isOverdue) return 0;
                    if (ts.daysLeft !== null && ts.daysLeft <= 5) return 1;
                    return 2;
                };

                const rankDiff = getUrgencyRank(a) - getUrgencyRank(b);
                if (rankDiff !== 0) return rankDiff;

                if (a.due_date && b.due_date) {
                    return new Date(a.due_date) - new Date(b.due_date);
                }

                if (!a.due_date && b.due_date) return 1;
                if (a.due_date && !b.due_date) return -1;

                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            });
        } else if (filters.sortBy === 'due_date') {
            list.sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            });
        } else if (filters.sortBy === 'created_date') {
            list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
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

    // Stats - Only count IN_PROGRESS orders for overdue (not COMPLETED or SHIPPED)
    const stats = useMemo(() => {
        return {
            inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
            completed: orders.filter(o => o.status === 'COMPLETED').length,
            shipped: orders.filter(o => o.status === 'SHIPPED').length,
            overdue: orders.filter(o => isOverdue(o.due_date) && o.status === 'IN_PROGRESS').length,
            total: orders.length
        };
    }, [orders]);

    // Tabs
    const tabs = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'in_progress', label: 'In Progress', count: stats.inProgress, color: 'blue' },
        { id: 'completed', label: 'Completed', count: stats.completed, color: 'green' },
        { id: 'shipped', label: 'Shipped', count: stats.shipped, color: 'purple' },
        { id: 'overdue', label: 'Overdue', count: stats.overdue, color: 'red' },
        { id: 'urgent', label: 'Urgent', count: urgentOrders.length, color: 'orange' },
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
        <div className="p-2 md:p-3 space-y-3 mx-auto w-full">
            {/* Header - matches Admin & Reception style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Manage production orders
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                    <button
                        onClick={() => setShowQuickLatest(prev => !prev)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showQuickLatest
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                    >
                        <HiOutlineDocumentText size={16} /> Quick Latest
                    </button>
                    <button
                        onClick={loadOrders}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-200 dark:hover:bg-white/10"
                    >
                        <HiOutlineArrowPath size={16} /> Refresh
                    </button>
                </div>
            </div>

            {/* Compact urgency cue: button-driven urgent list */}
            <div className={`rounded-2xl border px-4 py-3 ${urgentOrders.length > 0 ? 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/40' : 'bg-green-50/80 dark:bg-emerald-900/20 border-green-200 dark:border-emerald-700/40'}`}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {urgentOrders.length > 0 ? (
                            <HiOutlineExclamationTriangle className="text-orange-600 dark:text-orange-300 animate-pulse" size={20} />
                        ) : (
                            <HiOutlineCheckCircle className="text-emerald-600 dark:text-emerald-300" size={20} />
                        )}
                        <p className={`text-[11px] font-black uppercase tracking-wider ${urgentOrders.length > 0 ? 'text-orange-700 dark:text-orange-200' : 'text-emerald-700 dark:text-emerald-200'}`}>
                            {urgentOrders.length > 0
                                ? `${urgentOrders.length} in-progress order${urgentOrders.length > 1 ? 's' : ''} due in less than 5 days`
                                : 'No urgent in-progress orders (5-day window)'}
                        </p>
                    </div>
                    {urgentOrders.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('urgent')}
                            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                        >
                            Show Urgent List
                        </button>
                    )}
                </div>
            </div>

            {/* Filters & Search Bar - matches Admin & Reception */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl p-3 md:p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    {/* Tabs */}
                    <div className="w-full md:w-auto flex flex-wrap items-center gap-1 pb-1 md:pb-0">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[7px] md:text-[8px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === tab.id
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
                        {/* Sort - always visible */}
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 min-w-[150px]"
                            title="Sort orders"
                        >
                            <option value="urgent">Urgent</option>
                            <option value="due_date">Due Date</option>
                            <option value="created_date">Created Date</option>
                        </select>

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
                        <Motion.div
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
                                    className="py-2 rounded-xl border border-gray-100 dark:border-white/10 text-sm bg-white dark:bg-white/5 dark:text-white"
                                >
                                    <option value="urgent">Urgent</option>
                                    <option value="due_date">Due Date</option>
                                    <option value="created_date">Created Date</option>
                                </select>
                            </div>
                        </Motion.div>
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

            {/* Main content */}
            <div className="space-y-3">
                <AnimatePresence>
                    {showQuickLatest && (
                        <Motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4"
                        >
                            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-1">
                                Quick Latest Orders
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                                Click an order to open details.
                            </p>

                            {orders.length === 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    No orders to display.
                                </p>
                            )}

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
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusConfig.badgeColor || statusConfig.bgColor}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusConfig.badgeColor || statusConfig.bgColor}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {sidebarOrders.shipped.length > 0 && (
                                <div>
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
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusConfig.badgeColor || statusConfig.bgColor}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Motion.div>
                    )}
                </AnimatePresence>

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
                                const { materialImage, suitSampleImage } = getOrderImages(order);
                                const isInProgress = order.status === 'IN_PROGRESS';
                                const isOverdueOrder = timeStatus.isOverdue;
                                const isFiveDaysLeft = !timeStatus.isOverdue && timeStatus.daysLeft !== null && timeStatus.daysLeft <= 5;
                                const isTwoDaysLeft = !timeStatus.isOverdue && timeStatus.daysLeft !== null && timeStatus.daysLeft <= 2;

                                return (
                                    <Motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -2 }}
                                        onClick={() => setSelectedOrder(order)}
                                        className={`bg-white dark:bg-white/5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${!isInProgress ? 'border-gray-100 dark:border-white/5' : isOverdueOrder ? 'border-red-500 dark:border-red-500/50 shadow-red-200 dark:shadow-red-500/20' : isTwoDaysLeft ? 'border-orange-400 dark:border-orange-500/50 shadow-orange-100 dark:shadow-orange-500/10' : 'border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
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
                                                {isInProgress && isFiveDaysLeft && (
                                                    <div className={`mb-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase ${isTwoDaysLeft ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'}`}>
                                                        <HiOutlineClock size={12} />
                                                        Urgent: {timeStatus.daysLeft} day{timeStatus.daysLeft === 1 ? '' : 's'} left
                                                    </div>
                                                )}
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

                                            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-white/10">
                                                    Order Images (Material and Suit)
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 p-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (materialImage) setFullImage(materialImage);
                                                        }}
                                                        className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                                                    >
                                                        {materialImage ? (
                                                            <img
                                                                src={materialImage}
                                                                alt={`Material sample ${order.order_code}`}
                                                                className="w-full h-24 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-24 flex items-center justify-center text-[10px] text-gray-400">No Material</div>
                                                        )}
                                                        <p className="text-[9px] font-bold uppercase tracking-wider py-1 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                                            Material
                                                        </p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (suitSampleImage) setFullImage(suitSampleImage);
                                                        }}
                                                        className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                                                    >
                                                        {suitSampleImage ? (
                                                            <img
                                                                src={suitSampleImage}
                                                                alt={`Suit sample ${order.order_code}`}
                                                                className="w-full h-24 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-24 flex items-center justify-center text-[10px] text-gray-400">No Suit</div>
                                                        )}
                                                        <p className="text-[9px] font-bold uppercase tracking-wider py-1 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                                                            Suit
                                                        </p>
                                                    </button>
                                                </div>
                                            </div>

                                            {receiptByOrderCode[order.order_code] && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFullImage(receiptByOrderCode[order.order_code]);
                                                    }}
                                                    className="w-full mt-1 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5 hover:opacity-90 transition-opacity"
                                                >
                                                    <img
                                                        src={receiptByOrderCode[order.order_code]}
                                                        alt={`Receipt ${order.order_code}`}
                                                        className="w-full h-28 object-cover"
                                                    />
                                                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 text-left">
                                                        Payment Receipt (Click to View)
                                                    </p>
                                                </button>
                                            )}

                                            {/* Urgency Indicator with Live Countdown - Only for IN_PROGRESS */}
                                            {isInProgress && (
                                                <div className="pt-3 mt-1 border-t border-gray-100 dark:border-white/5">
                                                    <UrgencyIndicator 
                                                        dueDate={order.due_date}
                                                        orderCode={order.order_code}
                                                        showFullCountdown={isTwoDaysLeft || timeStatus.isOverdue}
                                                        compact={false}
                                                        size="sm"
                                                    />
                                                </div>
                                            )}
                                            {/* Show completed/shipped status with due date - visible but not urgent */}
                                            {!isInProgress && (
                                                <div className="pt-3 mt-1 border-t border-gray-100 dark:border-white/5">
                                                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold uppercase ${statusConfig.textColor}`}>
                                                                {order.status === 'COMPLETED' ? '✓ Completed' : order.status === 'SHIPPED' ? '◉ Shipped' : order.status}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Due: {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        /* List View */
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                            {/* Mobile list cards */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/10">
                                {filteredOrders.map((order) => {
                                    const statusConfig = getStatusConfig(order.status);
                                    const { materialImage, suitSampleImage } = getOrderImages(order);
                                    const isInProgress = order.status === 'IN_PROGRESS';
                                    const timeStatus = getTimeStatus(order.due_date);
                                    const isFiveDaysLeft = isInProgress && !timeStatus.isOverdue && timeStatus.daysLeft !== null && timeStatus.daysLeft <= 5;

                                    return (
                                        <button
                                            key={order.id}
                                            type="button"
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full text-left p-3 space-y-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 dark:text-white truncate">{order.order_code}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{order.customer_name || 'Unknown'}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-lg border border-gray-200 dark:border-white/10 p-2">
                                                    <p className="text-gray-400 uppercase font-bold text-[10px]">Suit</p>
                                                    <p className="text-gray-700 dark:text-gray-200 truncate">{order.suit_type_name || 'N/A'}</p>
                                                </div>
                                                <div className="rounded-lg border border-gray-200 dark:border-white/10 p-2">
                                                    <p className="text-gray-400 uppercase font-bold text-[10px]">Qty</p>
                                                    <p className="text-gray-700 dark:text-gray-200">{order.quantity}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div
                                                        className="w-5 h-5 rounded-md border border-gray-200 dark:border-white/10"
                                                        style={{ backgroundColor: getHexColor(order.selected_color) }}
                                                    />
                                                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{order.selected_color || '-'}</span>
                                                </div>
                                                <div className="text-xs">
                                                    {isInProgress ? (
                                                        <div className="flex items-center gap-2">
                                                            <CompactUrgency dueDate={order.due_date} />
                                                            {isFiveDaysLeft && (
                                                                <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-300">Urgent {'<='}5d</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 dark:text-gray-400">
                                                            {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (materialImage) setFullImage(materialImage);
                                                    }}
                                                    className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                                                >
                                                    {materialImage ? (
                                                        <img src={materialImage} alt={`Material ${order.order_code}`} className="w-full h-12 object-cover" />
                                                    ) : (
                                                        <div className="w-full h-12 flex items-center justify-center text-[10px] text-gray-400">No mat</div>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (suitSampleImage) setFullImage(suitSampleImage);
                                                    }}
                                                    className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                                                >
                                                    {suitSampleImage ? (
                                                        <img src={suitSampleImage} alt={`Suit ${order.order_code}`} className="w-full h-12 object-cover" />
                                                    ) : (
                                                        <div className="w-full h-12 flex items-center justify-center text-[10px] text-gray-400">No suit</div>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (receiptByOrderCode[order.order_code]) setFullImage(receiptByOrderCode[order.order_code]);
                                                    }}
                                                    className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                                                >
                                                    {receiptByOrderCode[order.order_code] ? (
                                                        <img src={receiptByOrderCode[order.order_code]} alt={`Receipt ${order.order_code}`} className="w-full h-12 object-cover" />
                                                    ) : (
                                                        <div className="w-full h-12 flex items-center justify-center text-[10px] text-gray-400">No receipt</div>
                                                    )}
                                                </button>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Desktop/tablet table with horizontal scroll safety */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[980px]">
                                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Order</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Suit</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Color</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Material Img</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Suit Img</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Due</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {filteredOrders.map((order) => {
                                            const statusConfig = getStatusConfig(order.status);
                                            const { materialImage, suitSampleImage } = getOrderImages(order);
                                            const isInProgress = order.status === 'IN_PROGRESS';
                                            const timeStatus = getTimeStatus(order.due_date);
                                            const isFiveDaysLeft = isInProgress && !timeStatus.isOverdue && timeStatus.daysLeft !== null && timeStatus.daysLeft <= 5;

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
                                                        {materialImage ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFullImage(materialImage);
                                                                }}
                                                                className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                                                            >
                                                                <img
                                                                    src={materialImage}
                                                                    alt={`Material ${order.order_code}`}
                                                                    className="w-16 h-10 object-cover"
                                                                />
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Not attached</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {suitSampleImage ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFullImage(suitSampleImage);
                                                                }}
                                                                className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                                                            >
                                                                <img
                                                                    src={suitSampleImage}
                                                                    alt={`Suit ${order.order_code}`}
                                                                    className="w-16 h-10 object-cover"
                                                                />
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Not attached</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {isInProgress ? (
                                                            <div className="flex flex-col gap-1">
                                                                <CompactUrgency dueDate={order.due_date} />
                                                                {isFiveDaysLeft && (
                                                                    <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-300">Urgent {'<='}5d</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.badgeColor}`}>
                                                                    {order.status === 'COMPLETED' ? '✓ Done' : order.status === 'SHIPPED' ? '◉ Shipped' : order.status}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'N/A'}
                                                                </span>
                                                            </div>
                                                        )}
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

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60"
                            onClick={() => setSelectedOrder(null)}
                        />
                        <Motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl h-[82vh] overflow-hidden border border-gray-200/80 dark:border-zinc-700/60 flex flex-col"
                        >
                            <div className="overflow-y-auto flex-1 min-h-0 bg-white dark:bg-zinc-950">
                                {/* Modal Header - compact and scrolls with content */}
                                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 dark:from-red-800 dark:via-rose-800 dark:to-red-900 p-3 md:p-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0">
                                            <h2 className="text-lg md:text-xl font-bold text-white truncate">{selectedOrder.order_code}</h2>
                                            <p className="text-red-100 text-xs md:text-sm flex items-center gap-2 mt-0.5 flex-wrap">
                                                <HiOutlineUser className="w-4 h-4" />
                                                <span className="truncate">{selectedOrder.customer_name || 'Unknown'}</span>
                                                {selectedOrder.customer_phone && (
                                                    <span className="text-red-200">• {selectedOrder.customer_phone}</span>
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
                                        >
                                            <HiOutlineXMark className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        {(() => {
                                            const statusConfig = getStatusConfig(selectedOrder.status);
                                            return (
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                                    {statusConfig.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    {/* Urgency Indicator with Live Countdown - Show for ALL orders */}
                                    {selectedOrder.due_date && (
                                        <div className="mt-2 border-t border-red-500/30 pt-2">
                                            <UrgencyIndicator 
                                                dueDate={selectedOrder.due_date}
                                                orderCode={selectedOrder.order_code}
                                                showFullCountdown={true}
                                                size="lg"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 md:p-5 space-y-4 pb-8">
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

                                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Order Images (Material and Suit)</p>
                                    {(() => {
                                        const { materialImage, suitSampleImage } = getOrderImages(selectedOrder);
                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => materialImage && setFullImage(materialImage)}
                                                    className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
                                                >
                                                    {materialImage ? (
                                                        <img
                                                            src={materialImage}
                                                            alt={`Material ${selectedOrder.order_code}`}
                                                            className="w-full h-48 object-cover bg-black/5"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-48 flex items-center justify-center text-xs text-gray-400">No material image</div>
                                                    )}
                                                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 text-left">Material Sample</p>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => suitSampleImage && setFullImage(suitSampleImage)}
                                                    className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
                                                >
                                                    {suitSampleImage ? (
                                                        <img
                                                            src={suitSampleImage}
                                                            alt={`Suit ${selectedOrder.order_code}`}
                                                            className="w-full h-48 object-cover bg-black/5"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-48 flex items-center justify-center text-xs text-gray-400">No suit image</div>
                                                    )}
                                                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 text-left">Suit Sample</p>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {receiptByOrderCode[selectedOrder.order_code] && (
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Receipt Screenshot</p>
                                        <button
                                            type="button"
                                            onClick={() => setFullImage(receiptByOrderCode[selectedOrder.order_code])}
                                            className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10"
                                        >
                                            <img
                                                src={receiptByOrderCode[selectedOrder.order_code]}
                                                alt={`Receipt ${selectedOrder.order_code}`}
                                                className="w-full max-h-72 object-contain bg-black/5"
                                            />
                                        </button>
                                    </div>
                                )}

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
                            </div>
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {fullImage && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80"
                            onClick={() => setFullImage(null)}
                        />
                        <Motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative max-w-5xl w-full"
                        >
                            <button
                                type="button"
                                onClick={() => setFullImage(null)}
                                className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-white text-black shadow"
                            >
                                <HiOutlineXMark className="w-5 h-5" />
                            </button>
                            <img
                                src={fullImage}
                                alt="Order receipt preview"
                                className="w-full max-h-[85vh] object-contain rounded-xl bg-black"
                            />
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GarmentDashboard;