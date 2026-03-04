import React, { useState, useEffect } from 'react';
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
    HiOutlineChatBubbleLeftRight
} from 'react-icons/hi2';
import api, { getGarmentOrdersInProgress, getGarmentShippedOrders, processGarmentOrder, getNotifications, getMaterialDetail } from '../api/api';
import { getHexColor } from '../utils/colors';

const GarmentDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // Changed default to 'all' to show orders
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false); // Track if using demo data

    // Demo data for garment workshop - shows what real data should look like
    const DEMO_ORDERS = [
        {
            id: '1',
            order_code: 'HTL-2026-001',
            customer_name: 'Abebe Kebede',
            customer_phone: '+251912345678',
            suit_type_name: 'Business Suit',
            material_name: 'Italian Wool Navy',
            selected_color: 'Navy Blue',
            selected_color_name: 'Navy Blue',
            quantity: 2,
            status: 'IN_PROGRESS', // Paid and verified - garment working on it
            due_date: '2026-03-15',
            created_at: '2026-03-01',
            total_price: 15000,
            payment_status: 'verified',
            material: 1,
            material_image: null
        },
        {
            id: '2',
            order_code: 'HTL-2026-002',
            customer_name: 'Tadesse Hailu',
            customer_phone: '+251913456789',
            suit_type_name: 'Traditional Suit',
            material_name: 'Ethiopian Cotton Cream',
            selected_color: 'Cream',
            selected_color_name: 'Cream',
            quantity: 1,
            status: 'IN_PROGRESS', // Paid and verified
            due_date: '2026-03-20',
            created_at: '2026-03-02',
            total_price: 8000,
            payment_status: 'verified',
            material: 2,
            material_image: null
        },
        {
            id: '3',
            order_code: 'HTL-2026-003',
            customer_name: 'Meron Demissie',
            customer_phone: '+251914567890',
            suit_type_name: 'Wedding Suit',
            material_name: 'Premium Silk Black',
            selected_color: 'Black',
            selected_color_name: 'Black',
            quantity: 1,
            status: 'PENDING_APPROVAL', // Payment submitted, waiting for verification
            due_date: '2026-04-01',
            created_at: '2026-03-03',
            total_price: 25000,
            payment_status: 'pending',
            material: 3,
            material_image: null
        },
        {
            id: '4',
            order_code: 'HTL-2026-004',
            customer_name: 'Desta Wolde',
            customer_phone: '+251915678901',
            suit_type_name: 'Business Suit',
            material_name: 'British Wool Grey',
            selected_color: 'Grey',
            selected_color_name: 'Grey',
            quantity: 1,
            status: 'COMPLETED',
            due_date: '2026-02-28',
            created_at: '2026-02-15',
            total_price: 12000,
            payment_status: 'verified',
            material: 4,
            material_image: null
        },
        {
            id: '5',
            order_code: 'HTL-2026-005',
            customer_name: 'Sisay Gebre',
            customer_phone: '+251916789012',
            suit_type_name: 'Casual Suit',
            material_name: 'Linen Beige',
            selected_color: 'Beige',
            selected_color_name: 'Beige',
            quantity: 2,
            status: 'COMPLETED',
            due_date: '2026-02-25',
            created_at: '2026-02-10',
            total_price: 10000,
            payment_status: 'verified',
            material: 5,
            material_image: null
        },
        {
            id: '6',
            order_code: 'HTL-2026-006',
            customer_name: 'Hailu Lemma',
            customer_phone: '+251917890123',
            suit_type_name: 'Executive Suit',
            material_name: 'Italian Wool Black',
            selected_color: 'Black',
            selected_color_name: 'Black',
            quantity: 1,
            status: 'AWAITING_PAYMENT', // Price set, waiting for customer to pay
            due_date: '2026-03-25',
            created_at: '2026-03-04',
            total_price: 18000,
            payment_status: 'awaiting',
            material: 6,
            material_image: null
        },
        {
            id: '7',
            order_code: 'HP-40951845',
            customer_name: 'Demo Customer 1',
            customer_phone: '+251910000001',
            suit_type_name: 'Business Suit',
            material_name: 'Premium Wool Navy',
            selected_color: 'Navy',
            selected_color_name: 'Navy',
            quantity: 1,
            status: 'IN_PROGRESS',
            due_date: '2026-03-20',
            created_at: '2026-03-01',
            total_price: 50,
            payment_status: 'verified',
            material: 7,
            material_image: null
        },
        {
            id: '8',
            order_code: 'HP-44385832',
            customer_name: 'Demo Customer 2',
            customer_phone: '+251910000002',
            suit_type_name: 'Traditional Suit',
            material_name: 'Ethiopian Cotton',
            selected_color: 'White',
            selected_color_name: 'White',
            quantity: 1,
            status: 'IN_PROGRESS',
            due_date: '2026-03-18',
            created_at: '2026-02-28',
            total_price: 2500,
            payment_status: 'verified',
            material: 8,
            material_image: null
        }
    ];

    useEffect(() => {
        loadOrders();
        loadNotifications();
    }, [activeTab]);

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
        setOrders([]); // Clear previous orders
        console.log('Loading orders for tab:', activeTab);

        try {
            let response;
            let errorMessage = '';

            if (activeTab === 'in_progress' || activeTab === 'pending') {
                try {
                    console.log('Fetching garment orders in progress...');
                    response = await getGarmentOrdersInProgress();
                    console.log('In-progress response:', response);
                } catch (err) {
                    console.log('Garment in-progress endpoint failed, trying general orders...', err.message);
                    // Fallback: try to get orders from general orders endpoint
                    try {
                        console.log('Trying general orders list with IN_PROGRESS filter...');
                        const allOrdersResponse = await getOrders({ status: 'IN_PROGRESS' });
                        console.log('General orders response:', allOrdersResponse);
                        let data = allOrdersResponse.data;
                        if (data && typeof data === 'object' && !Array.isArray(data)) {
                            data = data.results || data.data || data.items || [];
                        }
                        console.log('Parsed in-progress orders:', data);
                        setOrders(data || []);
                        setLoading(false);
                        return;
                    } catch (fallbackErr) {
                        console.error('Fallback also failed:', fallbackErr);
                        setOrders([]);
                        setLoading(false);
                        return;
                    }
                }
            } else if (activeTab === 'completed' || activeTab === 'shipped') {
                try {
                    console.log('Fetching garment shipped orders...');
                    response = await getGarmentShippedOrders();
                    console.log('Shipped response:', response);
                } catch (err) {
                    console.log('Garment shipped endpoint failed, trying general orders...', err.message);
                    // Fallback: try to get completed orders
                    try {
                        console.log('Trying general orders list with COMPLETED filter...');
                        const allOrdersResponse = await getOrders({ status: 'COMPLETED' });
                        let data = allOrdersResponse.data;
                        if (data && typeof data === 'object' && !Array.isArray(data)) {
                            data = data.results || data.data || data.items || [];
                        }
                        setOrders(data || []);
                        setLoading(false);
                        return;
                    } catch (fallbackErr) {
                        console.error('Fallback also failed:', fallbackErr);
                        setOrders([]);
                        setLoading(false);
                        return;
                    }
                }
            } else {
                // For 'all' tab, get both in-progress and shipped
                try {
                    console.log('Fetching all orders (in-progress + shipped)...');
                    const [inProgressResponse, shippedResponse] = await Promise.all([
                        getGarmentOrdersInProgress().catch(err => ({ data: [] })),
                        getGarmentShippedOrders().catch(err => ({ data: [] }))
                    ]);
                    // Handle both array and paginated responses
                    let inProgressData = inProgressResponse.data;
                    let shippedData = shippedResponse.data;
                    if (inProgressData && typeof inProgressData === 'object' && !Array.isArray(inProgressData)) {
                        inProgressData = inProgressData.results || inProgressData.data || inProgressData.items || [];
                    }
                    if (shippedData && typeof shippedData === 'object' && !Array.isArray(shippedData)) {
                        shippedData = shippedData.results || shippedData.data || shippedData.items || [];
                    }
                    setOrders([...(inProgressData || []), ...(shippedData || [])]);
                    setLoading(false);
                    return;
                } catch (err) {
                    console.error('Error loading all orders:', err);
                    setOrders([]);
                    setLoading(false);
                    return;
                }
            }

            // Handle both array and paginated responses
            let ordersData = response?.data;
            if (ordersData && typeof ordersData === 'object' && !Array.isArray(ordersData)) {
                ordersData = ordersData.results || ordersData.data || ordersData.items || [];
            }
            console.log('Final parsed orders:', ordersData);

            // If no real data, use demo data
            if (!ordersData || ordersData.length === 0) {
                console.log('No orders from API, using demo data');
                setOrders(DEMO_ORDERS);
                setIsDemoMode(true);
            } else {
                setOrders(ordersData);
                setIsDemoMode(false);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            // Try one more fallback - get all orders
            try {
                console.log('Final fallback - getting all orders...');
                const allResponse = await getOrders();
                let data = allResponse.data;
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    data = data.results || data.data || data.items || [];
                }
                // Filter for garment-relevant statuses
                const filteredOrders = (data || []).filter(order =>
                    ['IN_PROGRESS', 'COMPLETED', 'SHIPPED', 'INITIATED', 'PENDING_APPROVAL', 'AWAITING_PAYMENT'].includes(order.status)
                );
                console.log('Filtered orders for garment:', filteredOrders);

                // If still no data, use demo data
                if (!filteredOrders || filteredOrders.length === 0) {
                    console.log('No orders from fallback, using demo data');
                    setOrders(DEMO_ORDERS);
                    setIsDemoMode(true);
                } else {
                    setOrders(filteredOrders);
                    setIsDemoMode(false);
                }
            } catch (finalErr) {
                console.error('Final fallback also failed, using demo data:', finalErr);
                setOrders(DEMO_ORDERS);
                setIsDemoMode(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteOrder = async (orderCode) => {
        try {
            // Try garment-specific endpoint first
            let response;
            try {
                response = await processGarmentOrder(orderCode, { status: 'COMPLETED' });
            } catch (err) {
                console.log('Garment process endpoint failed, trying general order update...');
                // Fallback: use general orders endpoint
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
            // For garment, starting an order means marking it as IN_PROGRESS
            let response;
            try {
                response = await processGarmentOrder(orderCode, { status: 'IN_PROGRESS' });
            } catch (err) {
                console.log('Garment process endpoint failed, trying general order update...');
                // Fallback: use general orders endpoint
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

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'all') return true;
        if (activeTab === 'in_progress') return order.status === 'IN_PROGRESS';
        if (activeTab === 'completed') return order.status === 'COMPLETED';
        if (activeTab === 'pending') return order.status === 'INITIATED' || order.status === 'PENDING_APPROVAL' || order.status === 'AWAITING_PAYMENT';

        return true;
    });

    const stats = {
        inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        pending: orders.filter(o => o.status === 'INITIATED' || o.status === 'PENDING_APPROVAL' || o.status === 'AWAITING_PAYMENT').length,
        paid: orders.filter(o => o.payment_status === 'verified' || o.status === 'IN_PROGRESS' || o.status === 'COMPLETED').length,
        awaitingPayment: orders.filter(o => o.status === 'AWAITING_PAYMENT').length,
        total: orders.length
    };

    const tabs = [
        { id: 'all', label: 'All Orders', count: stats.total },
        { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
        { id: 'completed', label: 'Completed', count: stats.completed },
        { id: 'pending', label: 'Pending', count: stats.pending },
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
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Tailor Management System
                                </p>
                                {isDemoMode && (
                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 text-[8px] font-bold uppercase rounded-full">
                                        Demo Data
                                    </span>
                                )}
                            </div>
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

                            {/* Notification Dropdown */}
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

                        {/* Stats */}
                        <div className="flex gap-3">
                            <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
                                <div className="text-[9px] uppercase text-gray-500">In Progress</div>
                            </div>
                            <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
                                <div className="text-[9px] uppercase text-gray-500">Completed</div>
                            </div>
                            <div className="text-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl">
                                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                                <div className="text-[9px] uppercase text-gray-500">Pending</div>
                            </div>
                            <button
                                onClick={() => navigate('/garment/messages')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center gap-2 transition-all"
                            >
                                <HiOutlineChatBubbleLeftRight size={18} />
                                <div className="text-[9px] font-bold uppercase">Messages</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-red-600 text-white'
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
            </div>

            {/* Search */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="relative">
                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by order code or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Orders Grid */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-100 dark:border-white/5">
                        <HiOutlineCube className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">No Orders Found</h3>
                        <p className="text-gray-400">There are no orders in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOrders.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-white/5 p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                                onClick={async () => {
                                    setSelectedOrder(order);
                                    // Fetch material details for display
                                    if (order.material) {
                                        try {
                                            const matRes = await getMaterialDetail(order.material);
                                            const mat = matRes.data;
                                            setSelectedOrder(prev => ({
                                                ...prev,
                                                material_image: mat.image_url,
                                                material_colors: mat.colors || []
                                            }));
                                        } catch (err) {
                                            console.error('Failed to fetch material details:', err);
                                        }
                                    }
                                }}
                            >
                                {/* Material Image */}
                                {(order.material_image || order.material?.image_url) && (
                                    <div className="mb-3 -mx-5 -mt-5 relative h-32 overflow-hidden">
                                        <img
                                            src={order.material_image || order.material?.image_url}
                                            alt={order.material_name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold dark:text-white">{order.order_code}</h3>
                                        <p className="text-sm text-gray-500">{order.customer_name || 'Unknown Customer'}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {/* Payment Status Badge */}
                                        {order.payment_status && (
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                                                order.payment_status === 'verified' 
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
                                                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {order.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Suit:</span>
                                        <span className="dark:text-white font-medium">{order.suit_type_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Material:</span>
                                        <div className="flex items-center gap-1">
                                            {(order.selected_color_name || order.selected_color || order.material_color) && (
                                                <span
                                                    className="w-3 h-3 rounded-full border border-gray-400"
                                                    style={{
                                                        backgroundColor: order.selected_color_name ?
                                                            order.selected_color_name.toLowerCase() :
                                                            (order.selected_color || order.material_color || '#888')
                                                    }}
                                                />
                                            )}
                                            <span className="dark:text-white font-medium">{order.material_name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    {/* Show selected color name if available */}
                                    {(order.selected_color_name || order.selected_color) && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Color:</span>
                                            <span className="dark:text-white font-medium">{order.selected_color_name || order.selected_color}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Qty:</span>
                                        <span className="dark:text-white font-medium">{order.quantity}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Due: {order.due_date || 'Not set'}</span>
                                        <HiOutlineEye className="text-gray-400" size={16} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
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
                            <div className="bg-gradient-to-r from-red-600 to-red-800 p-0 text-white relative">
                                {/* Material Image Banner - Full Size */}
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
                                            <HiOutlineCube className="w-16 h-16 text-red-300" />
                                        </div>
                                    )}

                                    {/* Gradient overlay for text */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    {/* Order info over image */}
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
                                {/* Status */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${selectedOrder.status === 'IN_PROGRESS'
                                        ? 'bg-blue-100 text-blue-600'
                                        : selectedOrder.status === 'COMPLETED'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-yellow-100 text-yellow-600'
                                        }`}>
                                        {selectedOrder.status?.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Order Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Suit Type</p>
                                        <p className="font-bold dark:text-white">{selectedOrder.suit_type_name || 'N/A'}</p>
                                    </div>
                                    {/* Material Image - Prominent Display */}
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
                                            <div className="w-full h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                                                <p className="font-bold text-gray-500 dark:text-gray-400">
                                                    {selectedOrder.material_name || 'No Image'}
                                                </p>
                                            </div>
                                        )}
                                        {/* Color swatches */}
                                        {selectedOrder.material_colors?.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-[10px] text-gray-400 mb-1">Available Colors:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedOrder.material_colors.map((color, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                                        >
                                                            <div
                                                                className="w-4 h-4 rounded-full border border-gray-300"
                                                                style={{ backgroundColor: getHexColor(color.name) }}
                                                            />
                                                            <span className="text-[9px] text-gray-600 dark:text-gray-300">{color.name}</span>
                                                        </div>
                                                    ))}
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
                                        <p className="font-bold dark:text-white">{selectedOrder.due_date || 'Not set'}</p>
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

                            {/* Actions - Read only for now */}
                            <div className="p-6 border-t border-gray-100 dark:border-white/5">
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl text-center">
                                    <HiOutlineExclamationCircle className="mx-auto text-yellow-600 mb-2" size={24} />
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                        Order updates are managed by the reception team.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-full mt-4 px-6 py-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white font-bold rounded-2xl transition-colors"
                                >
                                    Close
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
