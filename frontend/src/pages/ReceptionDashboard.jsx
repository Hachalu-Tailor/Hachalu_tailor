import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineShoppingBag, HiOutlineCube, HiOutlineUserGroup,
  HiOutlineClock, HiOutlinePlus, HiOutlineArrowTrendingUp,
  HiOutlineCurrencyDollar, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineExclamationTriangle, HiOutlineCalendar,
  HiOutlineClipboardDocumentList, HiOutlineBell,
  HiOutlineArrowPath, HiOutlineTruck
} from 'react-icons/hi2';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/helpers';
import { 
  ORDER_STATUS_LABELS, 
  PAYMENT_STATUS_LABELS,
  CURRENCY 
} from '../utils/constants';

const ReceptionDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today'); // today, week, month

  useEffect(() => {
    fetchData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, materialsRes, paymentsRes] = await Promise.all([
        api.get('/orders/list/', { params: { active_only: true } }),
        api.get('/inventory/materials/'),
        api.get('/payments/list/').catch(() => ({ data: [] }))
      ]);
      setOrders(ordersRes.data || []);
      setMaterials(materialsRes.data || []);
      setPayments(paymentsRes.data?.results || paymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate order statistics
  const getOrderStats = () => {
    const pending = orders.filter(o => 
      ['INITIATED', 'AWAITING_PAYMENT', 'PENDING_APPROVAL', 'pending'].includes(o.status)
    );
    const inProgress = orders.filter(o => 
      ['IN_PROGRESS', 'processing'].includes(o.status)
    );
    const readyForPickup = orders.filter(o => 
      ['READY_FOR_PICKUP', 'ready_for_pickup'].includes(o.status)
    );
    const completed = orders.filter(o => 
      ['COMPLETED', 'completed'].includes(o.status)
    );
    const expired = orders.filter(o => 
      ['EXPIRED', 'expired'].includes(o.status)
    );

    return {
      pending: pending.length,
      inProgress: inProgress.length,
      readyForPickup: readyForPickup.length,
      completed: completed.length,
      expired: expired.length,
      total: orders.length
    };
  };

  // Calculate revenue statistics
  const getRevenueStats = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    const todayOrders = orders.filter(o => new Date(o.created_at) >= startOfDay);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return {
      todayRevenue,
      totalRevenue,
      pendingPayments: pendingPayments.length,
      pendingAmount
    };
  };

  // Calculate inventory statistics
  const getInventoryStats = () => {
    const lowStock = materials.filter(m => {
      const qty = parseFloat(m.inventory?.quantity_meters || 0);
      return qty > 0 && qty < 5;
    });
    const outOfStock = materials.filter(m => {
      const qty = parseFloat(m.inventory?.quantity_meters || 0);
      return qty === 0;
    });
    const totalItems = materials.length;
    const inStock = materials.filter(m => {
      const qty = parseFloat(m.inventory?.quantity_meters || 0);
      return qty >= 5;
    });

    return {
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      totalItems,
      inStock: inStock.length
    };
  };

  // Get unique clients count
  const getClientStats = () => {
    const uniqueClients = new Set(orders.map(o => o.customer_phone));
    const newClientsToday = orders.filter(o => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      return new Date(o.created_at) >= startOfDay;
    });
    
    return {
      total: uniqueClients.size,
      newToday: new Set(newClientsToday.map(o => o.customer_phone)).size
    };
  };

  const orderStats = getOrderStats();
  const revenueStats = getRevenueStats();
  const inventoryStats = getInventoryStats();
  const clientStats = getClientStats();

  // Main stats cards
  const mainStats = [
    { 
      label: 'Pending Orders', 
      value: orderStats.pending, 
      icon: HiOutlineClock, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10',
      trend: orderStats.pending > 5 ? 'up' : 'down',
      description: 'Awaiting action'
    },
    { 
      label: 'In Progress', 
      value: orderStats.inProgress, 
      icon: HiOutlineArrowPath, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      trend: 'neutral',
      description: 'Being processed'
    },
    { 
      label: 'Ready for Pickup', 
      value: orderStats.readyForPickup, 
      icon: HiOutlineCheckCircle, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10',
      trend: 'neutral',
      description: 'Completed orders'
    },
    { 
      label: 'Low Stock Items', 
      value: inventoryStats.lowStock + inventoryStats.outOfStock, 
      icon: HiOutlineExclamationTriangle, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10',
      trend: inventoryStats.outOfStock > 0 ? 'up' : 'down',
      description: 'Needs attention'
    },
  ];

  // Revenue stats
  const revenueCards = [
    {
      label: "Today's Revenue",
      value: formatCurrency(revenueStats.todayRevenue, CURRENCY.CODE),
      icon: HiOutlineCurrencyDollar,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(revenueStats.totalRevenue, CURRENCY.CODE),
      icon: HiOutlineShoppingBag,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Pending Payments',
      value: revenueStats.pendingPayments,
      icon: HiOutlineClock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      subValue: formatCurrency(revenueStats.pendingAmount, CURRENCY.CODE)
    },
    {
      label: 'Total Clients',
      value: clientStats.total,
      icon: HiOutlineUserGroup,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      subValue: `${clientStats.newToday} new today`
    }
  ];

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'INITIATED': 'bg-yellow-500/20 text-yellow-500',
      'AWAITING_PAYMENT': 'bg-orange-500/20 text-orange-500',
      'PENDING_APPROVAL': 'bg-yellow-500/20 text-yellow-500',
      'IN_PROGRESS': 'bg-blue-500/20 text-blue-500',
      'READY_FOR_PICKUP': 'bg-green-500/20 text-green-500',
      'COMPLETED': 'bg-emerald-500/20 text-emerald-500',
      'EXPIRED': 'bg-gray-500/20 text-gray-500',
      'pending': 'bg-yellow-500/20 text-yellow-500',
      'processing': 'bg-blue-500/20 text-blue-500',
      'ready_for_pickup': 'bg-green-500/20 text-green-500',
      'completed': 'bg-emerald-500/20 text-emerald-500',
    };
    return statusColors[status] || 'bg-gray-500/20 text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm uppercase tracking-wider">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic">
            Reception<span className="text-red-600"> Hub</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
            Welcome back, {user?.name || 'Staff'}! Here's your overview.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Time Range Filter */}
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
            {['today', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => navigate('/reception/orders')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlinePlus size={16} /> New Order
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlineArrowPath size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl hover:shadow-lg transition-all cursor-pointer"
            onClick={() => {
              if (stat.label.includes('Stock')) navigate('/reception/inventory');
              else navigate('/reception/orders');
            }}
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-2xl`}>
                <stat.icon size={24} />
              </div>
              {stat.trend === 'up' && (
                <span className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase">
                  <HiOutlineExclamationTriangle size={12} />
                </span>
              )}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-4">{stat.label}</p>
            <h3 className="text-3xl font-black dark:text-white mt-1">{stat.value}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((card, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            key={idx}
            className="p-4 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-lg font-black dark:text-white">{card.value}</p>
                {card.subValue && (
                  <p className="text-[10px] text-gray-500">{card.subValue}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Recent Orders</h3>
            <button
              onClick={() => navigate('/reception/orders')}
              className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 6).map((order) => (
              <motion.div
                key={order.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate('/reception/orders')}
              >
                <div className="h-12 w-12 bg-red-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HiOutlineShoppingBag className="text-red-600" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold dark:text-white truncate">{order.order_code || order.id?.slice(0, 8)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(order.status)}`}>
                      {ORDER_STATUS_LABELS[order.status?.toLowerCase()] || order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{order.customer_name} · {order.customer_phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold dark:text-white">{formatCurrency(order.total_price, CURRENCY.CODE)}</p>
                  <p className="text-[9px] text-gray-400">{formatRelativeTime(order.created_at)}</p>
                </div>
              </motion.div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-12">
                <HiOutlineShoppingBag className="mx-auto text-gray-600 mb-3" size={40} />
                <p className="text-gray-400 text-sm">No orders yet</p>
                <button
                  onClick={() => navigate('/reception/orders')}
                  className="mt-4 text-red-600 text-xs font-bold uppercase tracking-wider hover:underline"
                >
                  Create your first order
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Inventory Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Inventory Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Inventory Alerts</h3>
              <button
                onClick={() => navigate('/reception/inventory')}
                className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {materials.slice(0, 4).map((material) => {
                const quantity = material.inventory?.quantity_meters || 0;
                const isLow = parseFloat(quantity) < 5 && parseFloat(quantity) > 0;
                const isOut = parseFloat(quantity) === 0;
                
                return (
                  <div
                    key={material.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                      isOut ? 'bg-red-500/10 border border-red-500/20' :
                      isLow ? 'bg-yellow-500/10 border border-yellow-500/20' :
                      'bg-gray-50 dark:bg-white/5'
                    }`}
                    onClick={() => navigate('/reception/inventory')}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                      isOut ? 'bg-red-500/20' : isLow ? 'bg-yellow-500/20' : 'bg-gray-200 dark:bg-white/10'
                    }`}>
                      <HiOutlineCube className={isOut ? 'text-red-500' : isLow ? 'text-yellow-500' : 'text-gray-500'} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold dark:text-white truncate">{material.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{material.color} · {material.texture}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${isOut ? 'text-red-500' : isLow ? 'text-yellow-500' : 'dark:text-white'}`}>
                        {quantity}m
                      </p>
                      <p className="text-[9px] text-gray-400 uppercase">
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {materials.length === 0 && (
                <div className="text-center py-8">
                  <HiOutlineCube className="mx-auto text-gray-600 mb-2" size={32} />
                  <p className="text-gray-400 text-sm">No materials in inventory</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <button
              onClick={() => navigate('/reception/orders')}
              className="p-4 bg-red-600 text-white rounded-2xl text-center hover:bg-red-700 transition-all"
            >
              <HiOutlineShoppingBag className="mx-auto mb-2" size={22} />
              <p className="text-[10px] font-black uppercase tracking-widest">New Order</p>
            </button>
            <button
              onClick={() => navigate('/reception/inventory')}
              className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <HiOutlineCube className="mx-auto mb-2 text-red-600" size={22} />
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Inventory</p>
            </button>
            <button
              onClick={() => navigate('/reception/clients')}
              className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <HiOutlineUserGroup className="mx-auto mb-2 text-red-600" size={22} />
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Clients</p>
            </button>
            <button
              onClick={() => navigate('/reception/payments')}
              className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <HiOutlineCurrencyDollar className="mx-auto mb-2 text-red-600" size={22} />
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Payments</p>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Order Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
      >
        <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-6">Order Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-yellow-500/10 rounded-2xl">
            <p className="text-2xl font-black text-yellow-500">{orderStats.pending}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Pending</p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-2xl">
            <p className="text-2xl font-black text-blue-500">{orderStats.inProgress}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">In Progress</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-2xl">
            <p className="text-2xl font-black text-green-500">{orderStats.readyForPickup}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Ready</p>
          </div>
          <div className="text-center p-4 bg-emerald-500/10 rounded-2xl">
            <p className="text-2xl font-black text-emerald-500">{orderStats.completed}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-500/10 rounded-2xl">
            <p className="text-2xl font-black text-gray-500">{orderStats.expired}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Expired</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReceptionDashboard;
