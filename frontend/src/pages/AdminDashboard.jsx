import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineShoppingBag,
  HiOutlineArrowTrendingUp,
  HiOutlinePlus,
  HiOutlineMegaphone,
  HiOutlineClock,
  HiOutlineCheckCircle
} from 'react-icons/hi2';
import api from '../api/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, staffRes] = await Promise.all([
        api.get('/orders/list/'),
        api.post('/accounts/admin/staff/')  // Use POST for listing staff
      ]);
      setOrders(ordersRes.data || []);
      setStaff(staffRes.data || []);
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

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: <HiOutlineBanknotes />, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Active Orders', value: activeOrders, icon: <HiOutlineShoppingBag />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Staff', value: staff.length, icon: <HiOutlineUserGroup />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Completed', value: completedOrders, icon: <HiOutlineCheckCircle />, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  // Get recent orders as activities
  const recentActivities = orders.slice(0, 5).map(order => ({
    id: order.id,
    user: order.customer_name,
    action: `Order ${order.order_code} - ${order.status.replace('_', ' ')}`,
    time: new Date(order.created_at).toLocaleDateString()
  }));

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
            Admin<span className="text-red-600"> Command</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">System Overview & Analytics</p>
        </div>

        <div className="flex gap-2">
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
            <HiOutlineMegaphone size={16} /> View Analytics
          </button>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 text-2xl`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-2xl font-black dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. RECENT ACTIVITY FEED */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-8"
        >
          <h3 className="text-sm font-black dark:text-white uppercase tracking-widest mb-6">Recent Orders</h3>
          <div className="space-y-6">
            {recentActivities.length > 0 ? recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-4 border-l-2 border-red-600 pl-4">
                <div className="flex-1">
                  <p className="text-[11px] font-black dark:text-gray-200 uppercase tracking-tight">{act.user}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{act.action}</p>
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase">{act.time}</span>
              </div>
            )) : (
              <div className="text-center py-8">
                <HiOutlineClock className="mx-auto text-gray-600 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No recent orders</p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="w-full mt-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-red-600 transition-colors"
          >
            View All Analytics
          </button>
        </motion.div>

        {/* 4. PERFORMANCE MINI-WIDGET */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-600 rounded-3xl p-8 text-white flex flex-col justify-between overflow-hidden relative shadow-2xl shadow-red-600/20"
        >
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">System Status</h3>
            <p className="text-4xl font-black mt-2">{orders.length}</p>
            <p className="text-sm opacity-80">Total Orders</p>
          </div>

          <div className="mt-8 relative z-10">
            <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">
              {pendingPayments > 0
                ? `${pendingPayments} order(s) awaiting payment verification.`
                : 'All payments are up to date!'}
            </p>
          </div>

          {/* Abstract background shape */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </motion.div>
      </div>

    </div>
  );
};

export default AdminDashboard;
