import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineShoppingBag, HiOutlineCube, HiOutlineUserGroup,
  HiOutlineClock, HiOutlinePlus,
  HiOutlineCurrencyDollar, HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath, HiOutlineChatBubbleLeftRight,
  HiOutlineSwatch, HiOutlineMagnifyingGlass, HiOutlineMegaphone,
  HiOutlineTruck
} from 'react-icons/hi2';
import { getOrders, getMaterials, getPayments } from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatRelativeTime } from '../utils/helpers';
import {
  ORDER_STATUS_LABELS,
  CURRENCY
} from '../utils/constants';
import { getHexColor, extractColorsFromMaterials, isLightColor } from '../utils/colors';

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('2days'); // today, 2days, week, month
  const [searchQuery, setSearchQuery] = useState('');

  // Filter orders by time range (today, 2days, week, month)
  const filterOrdersByTimeRange = useCallback((orderList) => {
    if (!orderList || !orderList.length) return orderList || [];
    const now = new Date();
    let startDate;
    if (timeRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === '2days') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 2);
    } else if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }
    return orderList.filter(o => new Date(o.created_at) >= startDate);
  }, [timeRange]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const bTime = Date.parse(b.created_at || '') || 0;
      const aTime = Date.parse(a.created_at || '') || 0;
      return bTime - aTime;
    });
  }, [orders]);

  const filteredOrdersByTime = useMemo(() => filterOrdersByTimeRange(orders), [orders, filterOrdersByTimeRange]);

  // Filter recent orders by search
  const filteredRecentOrders = useMemo(() => {
    if (!searchQuery.trim()) return sortedOrders.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return sortedOrders.filter(o =>
      (o.order_code || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').includes(q)
    ).slice(0, 8);
  }, [sortedOrders, searchQuery]);

  // Helper function to handle pagination
  const handlePaginatedResponse = (response) => {
    let data = response.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      data = data.results || data.data || data.items || [];
    }
    return data || [];
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, materialsRes, paymentsRes] = await Promise.all([
        getOrders({ active_only: true }),
        getMaterials(),
        getPayments().catch(() => ({ data: [] }))
      ]);
      const ordersData = handlePaginatedResponse(ordersRes);
      setOrders(ordersData);
      setMaterials(handlePaginatedResponse(materialsRes));
      setPayments(handlePaginatedResponse(paymentsRes));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculate order statistics (uses time-filtered orders)
  const getOrderStats = (orderList = filteredOrdersByTime) => {
    const pending = orderList.filter(o =>
      ['INITIATED', 'AWAITING_PAYMENT', 'PENDING_APPROVAL', 'pending'].includes(o.status)
    );
    const inProgress = orderList.filter(o =>
      ['IN_PROGRESS', 'processing'].includes(o.status)
    );
    const readyForPickup = orderList.filter(o =>
      ['READY_FOR_PICKUP', 'ready_for_pickup'].includes(o.status)
    );
    const completed = orderList.filter(o =>
      ['COMPLETED', 'completed'].includes(o.status)
    );
    const expired = orderList.filter(o =>
      ['EXPIRED', 'expired'].includes(o.status)
    );
    const overdue = orderList.filter(o => {
      if (!o.due_date || ['COMPLETED', 'SHIPPED', 'expired'].includes(o.status)) return false;
      return new Date(o.due_date) < new Date();
    });

    return {
      pending: pending.length,
      inProgress: inProgress.length,
      readyForPickup: readyForPickup.length,
      completed: completed.length,
      expired: expired.length,
      overdue: overdue.length,
      total: orderList.length
    };
  };

  // Calculate revenue statistics (period revenue from time-filtered, total from all)
  const getRevenueStats = () => {
    const periodRevenue = filteredOrdersByTime.reduce((sum, o) =>
      sum + parseFloat(o.total_price || 0), 0);
    const totalRevenue = orders.reduce((sum, o) =>
      sum + parseFloat(o.total_price || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const pendingAmount = pendingPayments.reduce((sum, p) =>
      sum + parseFloat(p.amount || 0), 0);

    const periodLabel = timeRange === 'today' ? "Today's" : timeRange === 'week' ? "This Week's" : "This Month's";

    return {
      periodRevenue,
      totalRevenue,
      periodLabel,
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

  // Get unique clients count (new in period uses time filter)
  const getClientStats = () => {
    const uniqueClients = new Set(orders.map(o => o.customer_phone));
    const newInPeriod = new Set(filteredOrdersByTime.map(o => o.customer_phone)).size;
    return { total: uniqueClients.size, newInPeriod };
  };

  // Calculate color statistics from materials
  const getColorStats = () => {
    const availableColors = extractColorsFromMaterials(materials);
    const colorCounts = {};

    materials.forEach(material => {
      const colorName = material.color || (material.colors && material.colors[0]?.name);
      if (colorName) {
        const normalized = colorName.toLowerCase();
        colorCounts[normalized] = (colorCounts[normalized] || 0) + 1;
      }
    });

    // Get top colors
    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({
        name,
        hex: getHexColor(name),
        count
      }));

    return {
      totalColors: availableColors.length,
      topColors
    };
  };

  const orderStats = getOrderStats();
  const revenueStats = getRevenueStats();
  const inventoryStats = getInventoryStats();
  const clientStats = getClientStats();
  const colorStats = getColorStats();

  const todayFocus = useMemo(() => {
    const dueSoon = orders.filter((o) => {
      if (!o.due_date) return false;
      const status = o.status;
      if (['CLOSED', 'COMPLETED', 'SHIPPED', 'EXPIRED', 'CANCELLED', 'REJECTED'].includes(status)) return false;
      const due = new Date(o.due_date);
      const now = new Date();
      const in2Days = new Date();
      in2Days.setDate(now.getDate() + 2);
      return due >= now && due <= in2Days;
    }).length;

    const unverifiedPayments = payments.filter((p) => p?.is_verified === false).length;
    const lowStock = materials.filter((m) => {
      const qty = parseFloat(m.inventory?.quantity_meters || 0);
      return qty < 5;
    }).length;

    return { dueSoon, unverifiedPayments, lowStock };
  }, [orders, payments, materials]);

  // Main stats cards (includes overdue)
  const mainStats = [
    {
      label: 'Pending Orders',
      value: orderStats.pending,
      icon: HiOutlineClock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      trend: orderStats.pending > 5 ? 'up' : 'down',
      description: 'Awaiting action',
      onClick: () => navigate('/reception/orders')
    },
    {
      label: 'In Progress',
      value: orderStats.inProgress,
      icon: HiOutlineArrowPath,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      trend: 'neutral',
      description: 'Being processed',
      onClick: () => navigate('/reception/orders')
    },
    {
      label: 'Ready for Pickup',
      value: orderStats.readyForPickup,
      icon: HiOutlineCheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      trend: 'neutral',
      description: 'Ready to collect',
      onClick: () => navigate('/reception/orders')
    },
    {
      label: orderStats.overdue > 0 ? 'Overdue' : 'Low Stock',
      value: orderStats.overdue > 0 ? orderStats.overdue : inventoryStats.lowStock + inventoryStats.outOfStock,
      icon: orderStats.overdue > 0 ? HiOutlineExclamationTriangle : HiOutlineExclamationTriangle,
      color: orderStats.overdue > 0 ? 'text-red-500' : 'text-amber-500',
      bg: orderStats.overdue > 0 ? 'bg-red-500/10' : 'bg-amber-500/10',
      trend: orderStats.overdue > 0 || inventoryStats.outOfStock > 0 ? 'up' : 'down',
      description: orderStats.overdue > 0 ? 'Past due date' : 'Needs attention',
      onClick: () => navigate(orderStats.overdue > 0 ? '/reception/orders' : '/reception/inventory')
    },
  ];

  // Revenue stats
  const revenueCards = [
    {
      label: revenueStats.periodLabel + ' Revenue',
      value: formatCurrency(revenueStats.periodRevenue, CURRENCY.CODE),
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
      subValue: formatCurrency(revenueStats.pendingAmount, CURRENCY.CODE),
      onClick: () => navigate('/reception/payments')
    },
    {
      label: 'Total Clients',
      value: clientStats.total,
      icon: HiOutlineUserGroup,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      subValue: `${clientStats.newInPeriod} new in period`,
      onClick: () => navigate('/reception/clients')
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
    <div className="p-2 md:p-3 space-y-3 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
            Reception<span className="text-red-600"> Hub</span>
          </h1>
          <p className="text-[10px] text-gray-600 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">
            Welcome back, {user?.name || 'Staff'}! Here's your overview.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Search Orders */}
          <div className="relative flex-1 min-w-[180px] max-w-[240px]">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none"
            />
          </div>
          {/* Time Range Filter */}
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-200 dark:border-white/10">
            {['today', '2days', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${timeRange === range
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
              >
                {range === '2days' ? '2 Days' : range}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlineArrowPath size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <Motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <button
          onClick={() => navigate('/reception/orders')}
          className="text-left p-4 rounded-2xl border border-amber-200 dark:border-amber-700/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/10"
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">Due In 48h</p>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">{todayFocus.dueSoon}</p>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80">Orders needing near-term attention</p>
        </button>
        <button
          onClick={() => navigate('/reception/payments')}
          className="text-left p-4 rounded-2xl border border-blue-200 dark:border-blue-700/40 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/25 dark:to-sky-900/10"
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">Unverified Payments</p>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">{todayFocus.unverifiedPayments}</p>
          <p className="text-[10px] text-blue-700/80 dark:text-blue-300/80">Review bank receipts quickly</p>
        </button>
        <button
          onClick={() => navigate('/reception/inventory')}
          className="text-left p-4 rounded-2xl border border-rose-200 dark:border-rose-700/40 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/25 dark:to-red-900/10"
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Low / Out Stock</p>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">{todayFocus.lowStock}</p>
          <p className="text-[10px] text-rose-700/80 dark:text-rose-300/80">Materials that need replenishment</p>
        </button>
      </Motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {mainStats.map((stat, idx) => (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:shadow-lg hover:border-red-600/20 transition-all cursor-pointer"
            onClick={stat.onClick}
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
            <p className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] mt-4">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</h3>
            <p className="text-[10px] text-gray-600 dark:text-gray-500 mt-1">{stat.description}</p>
          </Motion.div>
        ))}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((card, idx) => (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            key={idx}
            onClick={card.onClick || undefined}
            className={`p-4 bg-white dark:bg-gradient-to-br dark:from-white/5 dark:to-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none ${card.onClick ? 'cursor-pointer hover:border-red-600/30 transition-colors' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-lg font-black text-gray-900 dark:text-white">{card.value}</p>
                {card.subValue && (
                  <p className="text-[10px] text-gray-600 dark:text-gray-500">{card.subValue}</p>
                )}
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Color Palette Overview */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
              <HiOutlineSwatch className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Material Colors</h3>
              <p className="text-[10px] text-gray-500">{colorStats.totalColors} colors available</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/reception/inventory')}
            className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
          >
            View All
          </button>
        </div>

        {/* Color Swatches */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {colorStats.topColors.length > 0 ? (
            colorStats.topColors.map((color, idx) => (
              <Motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
                className="group cursor-pointer"
                onClick={() => navigate('/reception/inventory')}
              >
                <div
                  className="h-12 rounded-xl shadow-md border-2 border-white dark:border-gray-800 group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color.hex,
                    borderColor: isLightColor(color.hex) ? '#e5e7eb' : '#374151'
                  }}
                  title={`${color.name} (${color.count} materials)`}
                />
                <p className="text-[9px] font-bold text-gray-500 text-center mt-2 truncate">
                  {color.name}
                </p>
                <p className="text-[8px] text-gray-400 text-center">
                  {color.count}
                </p>
              </Motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <HiOutlineSwatch className="mx-auto text-gray-600 mb-3" size={32} />
              <p className="text-gray-400 text-sm">No colors available</p>
              <button
                onClick={() => navigate('/reception/inventory')}
                className="mt-2 text-red-600 text-xs font-bold uppercase tracking-wider hover:underline"
              >
                Add materials with colors
              </button>
            </div>
          )}
        </div>

      </Motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recent Orders */}
        <Motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Recent Orders</h3>
            <button
              onClick={() => navigate('/reception/orders')}
              className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {filteredRecentOrders.map((order) => (
              <Motion.div
                key={order.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate('/reception/orders', { state: { highlightOrderId: order.id } })}
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
              </Motion.div>
            ))}
            {filteredRecentOrders.length === 0 && (
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
        </Motion.div>

        {/* Inventory Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Inventory Alerts */}
          <Motion.div
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
                const materialColor = material.color || (material.colors && material.colors[0]?.name) || 'Gray';
                const colorHex = getHexColor(materialColor);

                return (
                  <div
                    key={material.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${isOut ? 'bg-red-500/10 border border-red-500/20' :
                      isLow ? 'bg-yellow-500/10 border border-yellow-500/20' :
                        'bg-gray-50 dark:bg-white/5'
                      }`}
                    onClick={() => navigate('/reception/inventory')}
                  >
                    {/* Color Swatch */}
                    <div
                      className="h-9 w-9 rounded-lg flex-shrink-0 border-2 border-white dark:border-gray-700 shadow-sm"
                      style={{ backgroundColor: colorHex }}
                      title={materialColor}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold dark:text-white truncate">{material.name}</p>
                      <p className="text-[10px] text-gray-500 truncate capitalize">{materialColor} · {material.texture}</p>
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
          </Motion.div>

          {/* Quick Actions */}
          <Motion.div
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
            <button
              onClick={() => navigate('/reception/announcement')}
              className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <HiOutlineMegaphone className="mx-auto mb-2 text-red-600" size={22} />
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Bulletins</p>
            </button>
            <button
              onClick={() => navigate('/reception/messages')}
              className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <HiOutlineChatBubbleLeftRight className="mx-auto mb-2 text-red-600" size={22} />
              <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Messages</p>
            </button>
          </Motion.div>
        </div>
      </div>

      {/* Urgent popup intentionally disabled here (Garment only). */}
    </div>
  );
};

export default ReceptionDashboard;
