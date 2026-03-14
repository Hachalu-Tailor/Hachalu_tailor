import React, { useState, useEffect } from 'react';
import {
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,     // corrected
  HiOutlineArrowTrendingDown,   // corrected
  HiOutlineCalendar,
  HiOutlineChartBar,
} from 'react-icons/hi2';
import api, { getOrders } from '../../api/api';

const Analytics = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders();
      // Handle both array and paginated responses
      let ordersData = response.data;
      if (ordersData && typeof ordersData === 'object' && !Array.isArray(ordersData)) {
        ordersData = ordersData.results || ordersData.data || ordersData.items || [];
      }
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics
  const totalRevenue = orders
    .filter((o) => ['COMPLETED', 'IN_PROGRESS', 'PENDING_APPROVAL'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  const completedRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  const pendingPayments = orders
    .filter((o) => o.status === 'AWAITING_PAYMENT')
    .reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  const statusCounts = {
    INITIATED: orders.filter((o) => o.status === 'INITIATED').length,
    AWAITING_PAYMENT: orders.filter((o) => o.status === 'AWAITING_PAYMENT').length,
    PENDING_APPROVAL: orders.filter((o) => o.status === 'PENDING_APPROVAL').length,
    IN_PROGRESS: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  // Get unique customers
  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone)).size;

  // Recent orders (last 7 days)
  const recentOrders = orders.filter((o) => {
    const orderDate = new Date(o.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  });

  // Orders by day (last 7 days)
  const ordersByDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    const count = orders.filter((o) => o.created_at?.split('T')[0] === dayStr).length;
    ordersByDay.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
    });
  }

  const maxOrdersPerDay = Math.max(...ordersByDay.map((d) => d.count), 1);

  const StatCard = ({ title, value, subtitle, icon, trend, color }) => (
    <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[10px] font-black ${trend >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
          >
            {trend >= 0 ? (
              <HiOutlineArrowTrendingUp size={14} />
            ) : (
              <HiOutlineArrowTrendingDown size={14} />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-black dark:text-white mb-1">{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const StatusBadge = ({ status, count, total }) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const colors = {
      INITIATED: 'bg-gray-500',
      AWAITING_PAYMENT: 'bg-yellow-500',
      PENDING_APPROVAL: 'bg-orange-500',
      IN_PROGRESS: 'bg-blue-500',
      COMPLETED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
    };

    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-gray-400 uppercase">
              {status.replace('_', ' ')}
            </span>
            <span className="text-xs font-bold dark:text-white">{count}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors[status] || 'bg-gray-500'} rounded-full transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
            Analytics Dashboard
          </h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            Business overview and insights
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-2">
          <HiOutlineCalendar className="text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-sm font-bold outline-none dark:text-white"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle={`${statusCounts.COMPLETED} completed orders`}
          icon={<HiOutlineCurrencyDollar className="text-green-500" size={24} />}
          color="bg-green-500/10"
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          subtitle={`${recentOrders.length} this week`}
          icon={<HiOutlineShoppingBag className="text-blue-500" size={24} />}
          color="bg-blue-500/10"
        />
        <StatCard
          title="Customers"
          value={uniqueCustomers}
          subtitle="Unique customers"
          icon={<HiOutlineUsers className="text-purple-500" size={24} />}
          color="bg-purple-500/10"
        />
        <StatCard
          title="Pending Payments"
          value={`$${pendingPayments.toLocaleString()}`}
          subtitle={`${statusCounts.AWAITING_PAYMENT} awaiting`}
          icon={<HiOutlineClock className="text-orange-500" size={24} />}
          color="bg-orange-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Day Chart */}
        <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineChartBar className="text-red-500" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Orders This Week
            </h3>
          </div>
          <div className="flex items-end justify-between h-40 gap-2">
            {ordersByDay.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-red-600 rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(day.count / maxOrdersPerDay) * 100}%`,
                    minHeight: day.count > 0 ? '8px' : '0',
                  }}
                />
                <span className="text-[9px] font-black text-gray-400">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineShoppingBag className="text-red-500" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Order Status Distribution
            </h3>
          </div>
          <div className="space-y-4">
            <StatusBadge status="INITIATED" count={statusCounts.INITIATED} total={orders.length} />
            <StatusBadge
              status="AWAITING_PAYMENT"
              count={statusCounts.AWAITING_PAYMENT}
              total={orders.length}
            />
            <StatusBadge
              status="PENDING_APPROVAL"
              count={statusCounts.PENDING_APPROVAL}
              total={orders.length}
            />
            <StatusBadge status="IN_PROGRESS" count={statusCounts.IN_PROGRESS} total={orders.length} />
            <StatusBadge status="COMPLETED" count={statusCounts.COMPLETED} total={orders.length} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Recent Orders
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                  <HiOutlineShoppingBag className="text-red-600" size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold dark:text-white">{order.order_code}</p>
                  <p className="text-[10px] text-gray-400">{order.customer_name || '—'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black dark:text-white">
                  ${Number(order.total_price || 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-gray-400 uppercase">{order.status}</p>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-12 text-center">
              <HiOutlineShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No orders yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;