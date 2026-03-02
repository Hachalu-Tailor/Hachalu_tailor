import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    HiOutlineBell
} from 'react-icons/hi2';
import api from '../api/api';

const GarmentDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('in_progress');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        loadOrders();
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/accounts/user/notifications/', { params: { limit: 10 } });
            setNotifications(response.data?.results || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders/list/', { params: { active_only: true } });
            setOrders(response.data || []);
        } catch (error) {
            console.error('Error loading orders:', error);
            // Try without params if that fails
            try {
                const response = await api.get('/orders/list/');
                setOrders(response.data || []);
            } catch (retryError) {
                console.error('Retry failed:', retryError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteOrder = async (orderId) => {
        try {
            const response = await api.patch(`/orders/${orderId}/`, { status: 'COMPLETED' });
            if (response.status === 200) {
                loadOrders();
                setSelectedOrder(null);
                alert('Order marked as completed successfully!');
            }
        } catch (error) {
            console.error('Error completing order:', error);
            alert('Failed to complete order. The order may already be completed or there was a server error.');
            setSelectedOrder(null);
        }
    };

    const handleStartOrder = async (orderId) => {
        try {
            const response = await api.patch(`/orders/${orderId}/`, { status: 'IN_PROGRESS' });
            if (response.status === 200) {
                loadOrders();
                setSelectedOrder(null);
                alert('Order started successfully!');
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
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Tailor Management System
                            </p>
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
                                className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-white/5 p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold dark:text-white">{order.order_code}</h3>
                                        <p className="text-sm text-gray-500">{order.customer_name || 'Unknown Customer'}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'IN_PROGRESS'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                            : order.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                        {order.status?.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Suit:</span>
                                        <span className="dark:text-white font-medium">{order.suit_type_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Material:</span>
                                        <div className="flex items-center gap-1">
                                            {order.material_color && (
                                                <span
                                                    className="w-3 h-3 rounded-full border border-gray-400"
                                                    style={{ backgroundColor: order.material_color }}
                                                />
                                            )}
                                            <span className="dark:text-white font-medium">{order.material_name || 'N/A'}</span>
                                        </div>
                                    </div>
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
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Material</p>
                                        <p className="font-bold dark:text-white">{selectedOrder.material_name || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Material Color</p>
                                        <div className="flex items-center gap-2">
                                            {selectedOrder.material_color && (
                                                <span
                                                    className="w-4 h-4 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: selectedOrder.material_color }}
                                                />
                                            )}
                                            <span className="font-bold dark:text-white">{selectedOrder.material_color || 'N/A'}</span>
                                        </div>
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
