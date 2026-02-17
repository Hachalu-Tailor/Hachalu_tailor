import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBanknotes,
  HiOutlineShoppingBag,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationTriangle,
  HiOutlineCube,
  HiOutlineArrowPath,
  HiOutlineBell,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineMegaphone,
  HiOutlineXCircle,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown
} from 'react-icons/hi2';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import api from '../api/api';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../utils/helpers';
import { CURRENCY, ORDER_STATUS_LABELS } from '../utils/constants';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = [];

      // Search orders
      orders.forEach(order => {
        const searchText = `${order.order_code} ${order.customer_name}`.toLowerCase();
        if (searchText.includes(searchQuery.toLowerCase())) {
          results.push({ type: 'order', data: order, label: `Order: ${order.order_code}` });
        }
      });

      // Search staff
      staff.forEach(s => {
        const searchText = `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase();
        if (searchText.includes(searchQuery.toLowerCase())) {
          results.push({ type: 'staff', data: s, label: `Staff: ${s.first_name} ${s.last_name}` });
        }
      });

      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, orders, staff]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, staffRes, paymentsRes, notificationsRes, inventoryRes] = await Promise.all([
        api.get('/orders/list/'),
        api.get('/accounts/admin/staff/'),
        api.get('/payments/list/').catch(() => ({ data: [] })),
        api.get('/accounts/user/notifications/').catch(() => ({ data: { results: [] } })),
        api.get('/inventory/materials/').catch(() => ({ data: { results: [] } }))
      ]);

      setOrders(ordersRes.data?.results || ordersRes.data || []);
      setStaff(staffRes.data || []);
      setPayments(paymentsRes.data?.results || paymentsRes.data || []);

      // Handle notifications
      const notifs = notificationsRes.data?.results || notificationsRes.data || [];
      setNotifications(notifs.slice(0, 5));

      // Handle inventory
      const inv = inventoryRes.data?.results || inventoryRes.data || [];
      setInventory(inv);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate real stats
  const totalRevenue = orders
    .filter(o => ['COMPLETED', 'IN_PROGRESS', 'PENDING_APPROVAL'].includes(o.status))
    .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

  const activeOrders = orders.filter(o =>
    ['IN_PROGRESS', 'PENDING_APPROVAL'].includes(o.status)
  ).length;

  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const pendingPayments = orders.filter(o => o.status === 'AWAITING_PAYMENT').length;

  // Payment stats
  const verifiedPayments = payments.filter(p => p.is_verified).length;
  const pendingVerifications = payments.filter(p => !p.is_verified).length;
  const totalPaymentAmount = payments
    .filter(p => p.is_verified)
    .reduce((sum, p) => sum + parseFloat(p.payment_amount || 0), 0);

  // Staff stats
  const adminCount = staff.filter(s => s.role === 'ADMIN').length;
  const receptionistCount = staff.filter(s => s.role === 'RECEPTIONIST').length;
  const activeStaff = staff.filter(s => s.is_active).length;

  // Low inventory items
  const lowInventoryItems = inventory.filter(item =>
    item.quantity <= (item.minimum_quantity || 10)
  ).slice(0, 5);

  // Order status breakdown
  const orderStatusBreakdown = [
    { status: 'INITIATED', label: 'Initiated', count: orders.filter(o => o.status === 'INITIATED').length, color: 'bg-gray-500' },
    { status: 'AWAITING_PAYMENT', label: 'Awaiting Payment', count: orders.filter(o => o.status === 'AWAITING_PAYMENT').length, color: 'bg-orange-500' },
    { status: 'PENDING_APPROVAL', label: 'Pending Approval', count: orders.filter(o => o.status === 'PENDING_APPROVAL').length, color: 'bg-yellow-500' },
    { status: 'IN_PROGRESS', label: 'In Progress', count: orders.filter(o => o.status === 'IN_PROGRESS').length, color: 'bg-blue-500' },
    { status: 'COMPLETED', label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length, color: 'bg-green-500' },
  ];

  // Top customers by order value
  const topCustomers = orders
    .reduce((acc, order) => {
      const key = order.customer_name || 'Unknown';
      if (!acc[key]) {
        acc[key] = { name: key, total: 0, orders: 0 };
      }
      acc[key].total += parseFloat(order.total_price || 0);
      acc[key].orders += 1;
      return acc;
    }, {});

  const topCustomersList = Object.values(topCustomers)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Calculate revenue trend (comparing this month vs last month)
  const thisMonthRevenue = orders
    .filter(o => {
      const orderDate = new Date(o.created_at);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

  const lastMonthRevenue = orders
    .filter(o => {
      const orderDate = new Date(o.created_at);
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
    })
    .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : 0;

  const stats = [
    {
      label: 'Total Revenue',
      value: `${CURRENCY.SYMBOL}${totalRevenue.toLocaleString()}`,
      icon: <HiOutlineBanknotes />,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      subtext: 'All time earnings'
    },
    {
      label: 'Active Orders',
      value: activeOrders,
      icon: <HiOutlineShoppingBag />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      subtext: 'In progress'
    },
    {
      label: 'Total Staff',
      value: staff.length,
      icon: <HiOutlineUserGroup />,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      subtext: `${activeStaff} active`
    },
    {
      label: 'Completed',
      value: completedOrders,
      icon: <HiOutlineCheckCircle />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      subtext: 'Finished orders'
    },
  ];

  // Quick stats for the red card
  const quickStats = [
    { label: 'Pending Payments', value: pendingPayments, color: 'text-orange-500' },
    { label: 'Awaiting Verification', value: pendingVerifications, color: 'text-yellow-500' },
    { label: 'Verified Today', value: verifiedPayments, color: 'text-green-500' },
  ];

  // Get recent orders as activities
  const recentActivities = (orders.slice(0, 5) || []).map(order => ({
    id: order.id,
    user: order.customer_name || 'Unknown',
    action: `Order ${order.order_code || order.id?.slice(0, 8)} - ${ORDER_STATUS_LABELS[order.status] || order.status}`,
    time: formatRelativeTime(order.created_at)
  }));

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'INITIATED': 'bg-yellow-500/20 text-yellow-500',
      'AWAITING_PAYMENT': 'bg-orange-500/20 text-orange-500',
      'PENDING_APPROVAL': 'bg-yellow-500/20 text-yellow-500',
      'IN_PROGRESS': 'bg-blue-500/20 text-blue-500',
      'COMPLETED': 'bg-green-500/20 text-green-500',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* 1. HEADER & WELCOME */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic">
            Admin<span className="text-red-600">Command</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">System Overview & Analytics</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/admin/staff')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlinePlus size={16} /> Add Staff
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlineMegaphone size={16} /> Analytics
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlineArrowPath size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* 1.5 QUICK SEARCH BAR */}
      <div className="relative">
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders, customers, staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:text-white"
          />
        </div>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (result.type === 'order') navigate('/reception/orders');
                  if (result.type === 'staff') navigate('/admin/staff');
                  setSearchQuery('');
                }}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-gray-100 dark:border-white/5 last:border-0"
              >
                {result.type === 'order' ? (
                  <HiOutlineShoppingBag className="text-blue-500" size={18} />
                ) : (
                  <HiOutlineUser className="text-purple-500" size={18} />
                )}
                <span className="text-sm dark:text-white">{result.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate('/admin/analytics')}
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 text-2xl`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-2xl font-black dark:text-white mt-1">{stat.value}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. RECENT ORDERS */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-8"
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
            {recentActivities.length > 0 ? recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate('/reception/orders')}
              >
                <div className="h-10 w-10 bg-red-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiOutlineShoppingBag className="text-red-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold dark:text-white truncate">{act.user}</p>
                  <p className="text-[10px] text-gray-500 truncate">{act.action}</p>
                </div>
                <span className="text-[9px] text-gray-400 uppercase">{act.time}</span>
              </div>
            )) : (
              <div className="text-center py-8">
                <HiOutlineClock className="mx-auto text-gray-600 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No recent orders</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 4. PAYMENTS & NOTIFICATIONS PANEL */}
        <div className="space-y-6">
          {/* Payment Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Payment Overview</h3>
              <button
                onClick={() => navigate('/reception/payments')}
                className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <HiOutlineCheckCircle className="text-green-500" size={18} />
                  <span className="text-xs font-bold dark:text-white">Verified</span>
                </div>
                <span className="text-sm font-black text-green-500">{verifiedPayments}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <HiOutlineClock className="text-yellow-500" size={18} />
                  <span className="text-xs font-bold dark:text-white">Pending</span>
                </div>
                <span className="text-sm font-black text-yellow-500">{pendingVerifications}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <HiOutlineCurrencyDollar className="text-blue-500" size={18} />
                  <span className="text-xs font-bold dark:text-white">Total Verified</span>
                </div>
                <span className="text-sm font-black text-blue-500">{CURRENCY.SYMBOL}{totalPaymentAmount.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Recent Notifications</h3>
              <HiOutlineBell className="text-gray-400" size={18} />
            </div>

            <div className="space-y-2">
              {notifications.length > 0 ? notifications.map((notif, idx) => (
                <div
                  key={notif.id || idx}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl"
                >
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${notif.read ? 'bg-gray-300' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium dark:text-white truncate">{notif.message || notif.title || 'New notification'}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{formatRelativeTime(notif.created_at)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <HiOutlineBell className="mx-auto text-gray-600 mb-2" size={24} />
                  <p className="text-gray-400 text-xs">No notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 5. NEW: ORDER STATUS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Order Status Breakdown</h3>
            <HiOutlineChartBar className="text-gray-400" size={18} />
          </div>

          <div className="space-y-3">
            {orderStatusBreakdown.map((item, idx) => {
              const percentage = orders.length > 0 ? (item.count / orders.length * 100).toFixed(1) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium dark:text-white">{item.label}</span>
                    <span className="text-xs font-bold dark:text-white">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Top Customers</h3>
            <HiOutlineUser className="text-gray-400" size={18} />
          </div>

          <div className="space-y-3">
            {topCustomersList.length > 0 ? topCustomersList.map((customer, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-yellow-500 text-white' :
                    idx === 1 ? 'bg-gray-400 text-white' :
                      idx === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-200 dark:bg-white/10 dark:text-white'
                  }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold dark:text-white truncate">{customer.name}</p>
                  <p className="text-[10px] text-gray-500">{customer.orders} orders</p>
                </div>
                <span className="text-sm font-black text-green-500">{CURRENCY.SYMBOL}{customer.total.toLocaleString()}</span>
              </div>
            )) : (
              <div className="text-center py-6">
                <HiOutlineUser className="mx-auto text-gray-600 mb-2" size={24} />
                <p className="text-gray-400 text-xs">No customer data</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 6. LOW INVENTORY ALERTS */}
      {lowInventoryItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <HiOutlineExclamationTriangle className="text-orange-500" size={24} />
              <h3 className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">Low Inventory Alert</h3>
            </div>
            <button
              onClick={() => navigate('/reception/inventory')}
              className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
            >
              Manage Inventory
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowInventoryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl"
              >
                <HiOutlineCube className="text-orange-500 flex-shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold dark:text-white truncate">{item.name || item.material_name}</p>
                  <p className="text-[10px] text-orange-500">Only {item.quantity} left</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 7. SYSTEM STATUS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-red-600 rounded-3xl p-8 text-white flex flex-col justify-between overflow-hidden relative shadow-2xl shadow-red-600/20"
        >
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">System Status</h3>
            <p className="text-4xl font-black mt-2">{orders.length}</p>
            <p className="text-sm opacity-80">Total Orders</p>
          </div>

          <div className="mt-8 relative z-10 grid grid-cols-3 gap-4">
            {quickStats.map((stat, idx) => (
              <div key={idx}>
                <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] font-bold opacity-80 uppercase">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Abstract background shape */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
        >
          <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-6">Quick Actions</h3>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/staff')}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all group"
            >
              <HiOutlineUserGroup className="text-purple-500 group-hover:text-white" size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Manage Staff</span>
            </button>

            <button
              onClick={() => navigate('/reception/payments')}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all group"
            >
              <HiOutlineCurrencyDollar className="text-green-500 group-hover:text-white" size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Verify Payments</span>
            </button>

            <button
              onClick={() => navigate('/reception/inventory')}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all group"
            >
              <HiOutlineCube className="text-blue-500 group-hover:text-white" size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Inventory</span>
            </button>

            <button
              onClick={() => navigate('/admin/analytics')}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all group"
            >
              <HiOutlineMegaphone className="text-orange-500 group-hover:text-white" size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">Analytics</span>
            </button>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default AdminDashboard;
