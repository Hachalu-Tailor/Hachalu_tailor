import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineShoppingBag, HiOutlineCube, HiOutlineUserGroup,
  HiOutlineClock, HiOutlinePlus, HiOutlineArrowTrendingUp
} from 'react-icons/hi2';
import api from '../api/api';

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, materialsRes] = await Promise.all([
        api.get('/orders/list/', { params: { active_only: true } }),
        api.get('/invetory/materials/')
      ]);
      setOrders(ordersRes.data || []);
      setMaterials(materialsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const pendingOrders = orders.filter(o =>
    ['INITIATED', 'AWAITING_PAYMENT', 'PENDING_APPROVAL'].includes(o.status)
  ).length;

  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const lowStockMaterials = materials.filter(m =>
    m.inventory && parseFloat(m.inventory.quantity_meters) < 5
  ).length;

  const stats = [
    { label: 'Pending Orders', value: pendingOrders, icon: <HiOutlineClock />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'In Progress', value: inProgressOrders, icon: <HiOutlineShoppingBag />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Completed', value: completedOrders, icon: <HiOutlineCube />, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Low Stock Items', value: lowStockMaterials, icon: <HiOutlineArrowTrendingUp />, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
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
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Order Management & Inventory Overview</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/reception/orders')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlinePlus size={16} /> New Order
          </button>
          <button
            onClick={() => navigate('/reception/inventory')}
            className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlineCube size={16} /> Inventory
          </button>
        </div>
      </div>

      {/* Stats Grid */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
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

          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate('/reception/orders')}
              >
                <div className="h-10 w-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                  <HiOutlineShoppingBag className="text-red-600" size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-white">{order.order_code}</p>
                  <p className="text-[10px] text-gray-500">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold dark:text-white">${order.total_price}</p>
                  <p className="text-[9px] text-gray-400 uppercase">{order.status}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8">
                <HiOutlineShoppingBag className="mx-auto text-gray-600 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No orders yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Inventory Alerts</h3>
            <button
              onClick={() => navigate('/reception/inventory')}
              className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="space-y-4">
            {materials.slice(0, 5).map((material) => {
              const quantity = material.inventory?.quantity_meters || 0;
              const isLow = parseFloat(quantity) < 5;
              return (
                <div
                  key={material.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-colors cursor-pointer ${isLow ? 'bg-red-500/10 border border-red-500/20' : 'bg-gray-50 dark:bg-white/5'
                    }`}
                  onClick={() => navigate('/reception/inventory')}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isLow ? 'bg-red-500/20' : 'bg-gray-200 dark:bg-white/10'}`}>
                    <HiOutlineCube className={isLow ? 'text-red-500' : 'text-gray-500'} size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold dark:text-white">{material.name}</p>
                    <p className="text-[10px] text-gray-500">{material.color} • {material.texture}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${isLow ? 'text-red-500' : 'dark:text-white'}`}>
                      {quantity}m
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase">
                      {isLow ? 'Low Stock' : 'In Stock'}
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
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <button
          onClick={() => navigate('/reception/orders')}
          className="p-6 bg-red-600 text-white rounded-3xl text-center hover:bg-red-700 transition-all"
        >
          <HiOutlineShoppingBag className="mx-auto mb-2" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest">New Order</p>
        </button>
        <button
          onClick={() => navigate('/reception/inventory')}
          className="p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
        >
          <HiOutlineCube className="mx-auto mb-2 text-red-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Inventory</p>
        </button>
        <button
          onClick={() => navigate('/reception/clients')}
          className="p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
        >
          <HiOutlineUserGroup className="mx-auto mb-2 text-red-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Clients</p>
        </button>
        <button
          onClick={() => navigate('/reception/announcement')}
          className="p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl text-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
        >
          <HiOutlineClock className="mx-auto mb-2 text-red-600" size={24} />
          <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">Bulletins</p>
        </button>
      </motion.div>
    </div>
  );
};

export default ReceptionDashboard;
