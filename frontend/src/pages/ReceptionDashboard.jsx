import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineClipboardDocumentList, HiOutlineCube, HiOutlineUsers,
  HiOutlineBanknotes, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown,
  HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamationTriangle,
  HiOutlineArrowPath, HiOutlineEye, HiOutlineAdjustmentsHorizontal,
  HiOutlineChevronRight, HiOutlineArrowUturnDown
} from 'react-icons/hi2';
import { getOrders, getMaterials, getNotifications } from '../api/api';

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, materialsRes, notificationsRes] = await Promise.all([
        getOrders({ active_only: true }).catch(() => ({ data: [] })),
        getMaterials().catch(() => ({ data: [] })),
        getNotifications().catch(() => ({ data: [] }))
      ]);

      // Handle paginated response for orders
      setOrders(ordersRes.data.results || ordersRes.data || []);
      setMaterials(materialsRes.data || []);
      setNotifications(notificationsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    pendingApproval: orders.filter(o => o.status === 'PENDING_APPROVAL').length,
    inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    lowStock: materials.filter(m => parseFloat(m.quantity_meters) < 10 && parseFloat(m.quantity_meters) > 0).length,
    outOfStock: materials.filter(m => parseFloat(m.quantity_meters) === 0).length,
    totalRevenue: orders
      .filter(o => o.status === 'COMPLETED' || o.status === 'CLOSED')
      .reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0),
    unreadNotifications: notifications.filter(n => !n.is_read).length
  };

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Low stock items
  const lowStockItems = materials.filter(m => parseFloat(m.quantity_meters) < 10);

  // Status badge colors
  const getStatusColor = (status) => {
    const colors = {
      'INITIATED': 'bg-yellow-500/10 text-yellow-500',
      'AWAITING_PAYMENT': 'bg-blue-500/10 text-blue-500',
      'PENDING_APPROVAL': 'bg-orange-500/10 text-orange-500',
      'IN_PROGRESS': 'bg-purple-500/10 text-purple-500',
      'COMPLETED': 'bg-green-500/10 text-green-500',
      'CLOSED': 'bg-gray-500/10 text-gray-500',
      'REJECTED': 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black dark:text-white uppercase tracking-tighter">
            Reception <span className="text-red-600">Command</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
            Real-time Operations Overview
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-2 bg-white dark:bg-white/5 dark:text-white rounded-xl border dark:border-white/10 hover:bg-red-600 hover:text-white transition-all"
          >
            <HiOutlineArrowUturnDown size={20} />
          </button>
          <button className="p-2 bg-white dark:bg-white/5 dark:text-white rounded-xl border dark:border-white/10">
            <HiOutlineAdjustmentsHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-red-500 text-sm font-bold">{error}</p>
        </div>
      )}

      {/* STATS GRID */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Orders"
            value={stats.totalOrders}
            icon={<HiOutlineClipboardDocumentList />}
            trend="up"
            color="blue"
            onClick={() => navigate('/reception/orders')}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingApproval}
            icon={<HiOutlineClock />}
            trend="neutral"
            color="orange"
            onClick={() => navigate('/reception/orders')}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<HiOutlineArrowPath />}
            trend="up"
            color="purple"
            onClick={() => navigate('/reception/orders')}
          />
          <StatCard
            title="Low Stock Items"
            value={stats.lowStock + stats.outOfStock}
            icon={<HiOutlineExclamationTriangle />}
            trend="down"
            color="red"
            onClick={() => navigate('/reception/inventory')}
          />
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* RECENT ORDERS */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                Recent Orders
              </h3>
              <button
                onClick={() => navigate('/reception/orders')}
                className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                View All <HiOutlineChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm">No orders found</p>
                </div>
              ) : (
                recentOrders.map(order => (
                  <motion.div
                    key={order.id}
                    whileHover={{ backgroundColor: 'rgba(220, 38, 38, 0.05)' }}
                    onClick={() => setSelectedOrder(order)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                        <HiOutlineClipboardDocumentList className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white">
                          Order #{order.id?.toString().slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                          {order.customer?.full_name || 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        ${parseFloat(order.total_price || 0).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* LOW STOCK ALERTS */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Stock Alerts
              </h3>
              <button
                onClick={() => navigate('/reception/inventory')}
                className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-[300px] overflow-y-auto">
              {lowStockItems.length === 0 ? (
                <div className="p-8 text-center">
                  <HiOutlineCheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                  <p className="text-gray-400 text-sm">All stock levels OK</p>
                </div>
              ) : (
                lowStockItems.slice(0, 5).map(material => (
                  <div key={material.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <HiOutlineCube className="text-orange-500" size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold dark:text-white">
                          {material.name || material.material?.name}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase">
                          {material.sku || `MT-${material.id}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full ${parseFloat(material.quantity_meters) === 0
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-orange-500/10 text-orange-500'
                      }`}>
                      {material.quantity_meters}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVENUE CARD */}
      {!loading && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">
                Total Revenue (Completed Orders)
              </p>
              <p className="text-3xl md:text-4xl font-black text-white mt-2">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-white/60 text-[9px] uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-black text-white">{stats.completed}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-[9px] uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-black text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAIL SIDEBAR */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-[#0a0a0a] border-l dark:border-white/5 z-50 shadow-2xl p-8 overflow-y-auto"
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="mb-8 p-2 bg-gray-100 dark:bg-white/5 dark:text-white rounded-full"
            >
              <HiOutlineChevronRight size={20} />
            </button>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">
                  Order #{selectedOrder.id?.toString().slice(0, 8).toUpperCase()}
                </h2>
                <span className={`inline-block mt-2 text-[9px] font-black uppercase px-3 py-1 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Customer Info */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Customer</h4>
                <p className="text-sm font-bold dark:text-white">
                  {selectedOrder.customer?.full_name || 'N/A'}
                </p>
                <p className="text-xs text-gray-400">{selectedOrder.customer?.phone_number || 'No phone'}</p>
              </div>

              {/* Order Details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Details</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Price</span>
                  <span className="font-bold dark:text-white">${parseFloat(selectedOrder.total_price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Due Date</span>
                  <span className="font-bold dark:text-white">
                    {selectedOrder.due_date ? new Date(selectedOrder.due_date).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Created</span>
                  <span className="font-bold dark:text-white">
                    {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => {
                    navigate('/reception/orders');
                    setSelectedOrder(null);
                  }}
                  className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-red-700 transition-all"
                >
                  View Full Order
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, trend, color, onClick }) => {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    red: 'text-red-500 bg-red-500/10',
    green: 'text-green-500 bg-green-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="p-6 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-100 dark:border-white/5 cursor-pointer hover:border-red-600/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend === 'up' && <HiOutlineArrowTrendingUp className="text-green-500" size={16} />}
        {trend === 'down' && <HiOutlineArrowTrendingDown className="text-red-500" size={16} />}
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
      <p className="text-2xl font-black dark:text-white mt-1">{value}</p>
    </motion.div>
  );
};

export default ReceptionDashboard;
