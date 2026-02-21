import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCheck, HiOutlineEye, HiOutlineNoSymbol, HiOutlinePlus,
  HiOutlineShoppingBag, HiOutlineClock, HiOutlineXMark, HiOutlineClipboardDocumentCheck
} from 'react-icons/hi2';
import api from '../../api/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suitTypes, setSuitTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    suit_type: '',
    material: '',
    quantity: 1,
    measurements: { height: '', chest: '', shoulder: '', waist: '', hips: '', arm_length: '' }
  });
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchSuitTypes();
    fetchMaterials();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/list/', { params: { active_only: true } });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuitTypes = async () => {
    try {
      const response = await api.get('/suit-types/');
      setSuitTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching suit types:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/invetory/materials/');
      setMaterials(response.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/orders/', {
        ...newOrder,
        suit_type: parseInt(newOrder.suit_type),
        material: parseInt(newOrder.material),
        measurements: {
          height: parseFloat(newOrder.measurements.height) || 0,
          chest: parseFloat(newOrder.measurements.chest) || 0,
          shoulder: parseFloat(newOrder.measurements.shoulder) || 0,
          waist: parseFloat(newOrder.measurements.waist) || 0,
          hips: parseFloat(newOrder.measurements.hips) || 0,
          arm_length: parseFloat(newOrder.measurements.arm_length) || 0,
        }
      });
      setCreatedOrder(response.data);
      setNewOrder({
        customer_name: '', customer_phone: '', suit_type: '', material: '', quantity: 1,
        measurements: { height: '', chest: '', shoulder: '', waist: '', hips: '', arm_length: '' }
      });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Failed to create order');
    }
  };

  const handleProcessOrder = async (action, data = {}) => {
    if (!selectedOrder) return;
    try {
      await api.post(`/orders/${selectedOrder.id}/process`, { action, ...data });
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error processing order:', error);
      alert(error.response?.data?.error || 'Failed to process order');
    }
  };

  const pendingCount = orders.filter(o => ['INITIATED', 'AWAITING_PAYMENT', 'PENDING_APPROVAL'].includes(o.status)).length;
  const inProgressCount = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

  const getStatusColor = (status) => {
    const colors = {
      'INITIATED': 'bg-gray-500/10 text-gray-400',
      'AWAITING_PAYMENT': 'bg-yellow-500/10 text-yellow-500',
      'PENDING_APPROVAL': 'bg-orange-500/10 text-orange-500',
      'IN_PROGRESS': 'bg-blue-500/10 text-blue-500',
      'COMPLETED': 'bg-green-500/10 text-green-500',
      'REJECTED': 'bg-red-500/10 text-red-500',
      'CANCELLED': 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400';
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <StatBox label="Pending" count={pendingCount} color="text-orange-500" icon={<HiOutlineClock />} />
        <StatBox label="In Progress" count={inProgressCount} color="text-blue-500" icon={<HiOutlineShoppingBag />} />
        <StatBox label="Completed" count={completedCount} color="text-green-500" icon={<HiOutlineCheck />} />
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white p-8 rounded-3xl flex items-center justify-center gap-3 hover:bg-red-700 transition-all"
        >
          <HiOutlinePlus size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">New Order</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest dark:text-white">Active Orders</h4>
          <span className="text-[10px] font-bold text-gray-400">{orders.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-red-600/10 rounded-xl flex items-center justify-center">
                    <HiOutlineShoppingBag className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h5 className="text-sm font-black dark:text-white uppercase">{order.order_code}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {order.customer_name} • {order.suit_type_name}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">{order.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-black dark:text-white">${order.total_price}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <HiOutlineShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No orders yet</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-8 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                <HiOutlineXMark size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedOrder.order_code}</h2>
                <p className="text-[10px] text-zinc-400 uppercase font-bold mt-1">{selectedOrder.customer_name} • {selectedOrder.customer_phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Suit Type</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.suit_type_name}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Material</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.material_name}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Total Price</p>
                  <p className="text-sm font-bold dark:text-white">${selectedOrder.total_price}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Due Date</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.due_date || 'Not set'}</p>
                </div>
              </div>

              {selectedOrder.measurements && (
                <div className="mb-6">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Measurements (cm)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedOrder.measurements).map(([key, value]) => (
                      <div key={key} className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-3 text-center">
                        <p className="text-[8px] font-black text-zinc-400 uppercase">{key.replace('_', ' ')}</p>
                        <p className="text-sm font-bold dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {selectedOrder.status === 'INITIATED' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcessOrder('reject', { reason: 'Order cancelled by staff' })}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleProcessOrder('receive', { total_price: 100, due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] })}
                      className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                    >
                      Receive Order
                    </button>
                  </div>
                )}
                {selectedOrder.status === 'AWAITING_PAYMENT' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcessOrder('reject', { reason: 'Payment not received' })}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleProcessOrder('record_payment', { payment_reference: 'CASH', payment_amount: selectedOrder.total_price })}
                      className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                    >
                      Record Payment
                    </button>
                  </div>
                )}
                {selectedOrder.status === 'PENDING_APPROVAL' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcessOrder('reject', { reason: 'Payment verification failed' })}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                    >
                      Reject Order
                    </button>
                    <button
                      onClick={() => handleProcessOrder('approve')}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      Approve Order
                    </button>
                  </div>
                )}
                {selectedOrder.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleProcessOrder('complete')}
                    className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Order Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowCreateModal(false); setCreatedOrder(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-8 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => { setShowCreateModal(false); setCreatedOrder(null); }} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                <HiOutlineXMark size={20} />
              </button>

              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6">Create New Order</h2>

              {createdOrder ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiOutlineClipboardDocumentCheck className="text-green-500" size={40} />
                  </div>
                  <h3 className="text-lg font-black dark:text-white mb-2">Order Created!</h3>
                  <p className="text-[10px] text-zinc-400 uppercase mb-4">Order Code</p>
                  <p className="text-3xl font-black text-red-600 mb-6">{createdOrder.order_code}</p>
                  <p className="text-[10px] text-zinc-400">Please provide this code to the customer.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Customer Name *</label>
                    <input
                      type="text"
                      value={newOrder.customer_name}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Customer Phone *</label>
                    <input
                      type="text"
                      value={newOrder.customer_phone}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                      placeholder="+251911234567"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Suit Type *</label>
                    <select
                      value={newOrder.suit_type}
                      onChange={(e) => setNewOrder({ ...newOrder, suit_type: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                      required
                    >
                      <option value="">Select Suit Type</option>
                      {suitTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Material *</label>
                    <select
                      value={newOrder.material}
                      onChange={(e) => setNewOrder({ ...newOrder, material: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                      required
                    >
                      <option value="">Select Material</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.color})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Measurements (cm)</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['height', 'chest', 'shoulder', 'waist', 'hips', 'arm_length'].map(m => (
                        <input
                          key={m}
                          type="number"
                          placeholder={m.replace('_', ' ')}
                          value={newOrder.measurements[m]}
                          onChange={(e) => setNewOrder({ ...newOrder, measurements: { ...newOrder.measurements, [m]: e.target.value } })}
                          className="bg-zinc-100 dark:bg-zinc-900 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 ring-red-600/20"
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-700 transition-all mt-4"
                  >
                    Create Order
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatBox = ({ label, count, color, icon }) => (
  <div className="bg-white dark:bg-[#0c0c0c] p-8 border border-gray-100 dark:border-white/5 rounded-3xl">
    <div className="flex items-center gap-3 mb-2">
      {icon && <span className={color}>{icon}</span>}
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className={`text-4xl font-black ${color}`}>{count}</p>
  </div>
);

export default Orders;
