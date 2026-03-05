import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCheck, HiOutlineEye, HiOutlineNoSymbol, HiOutlinePlus,
  HiOutlineShoppingBag, HiOutlineClock, HiOutlineXMark, 
  HiOutlineClipboardDocumentCheck, HiOutlineBanknotes
} from 'react-icons/hi2';
import { getOrders, getSuitTypes, createOrder, processOrder, getMaterials, getMaterialDetail, getColorsFromMaterials, getPaymentByOrderId } from '../../api/api';
import { getHexColor } from '../../utils/colors';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [fullImage, setFullImage] = useState(null);
  const [receiveData, setReceiveData] = useState({ total_price: '', expected_price: '', due_date: '' });
  const [suitTypes, setSuitTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterialColors, setSelectedMaterialColors] = useState([]);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    suit_type: '',
    material: '',
    selected_color: '',
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
      const response = await getOrders({ active_only: true });
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

  const fetchSuitTypes = async () => {
    try {
      const response = await getSuitTypes();
      setSuitTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching suit types:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await getMaterials();
      // Handle both array and paginated responses
      let materialsData = response.data;
      if (materialsData && typeof materialsData === 'object' && !Array.isArray(materialsData)) {
        materialsData = materialsData.results || materialsData.data || materialsData.items || [];
      }
      setMaterials(materialsData || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  // Update colors when material is selected
  const handleMaterialChange = (materialId) => {
    const material = materials.find(m => m.id === parseInt(materialId));
    // Handle both old format (color string) and new format (colors array)
    let colors = [];
    if (material?.colors && Array.isArray(material.colors)) {
      colors = material.colors.map(c => typeof c === 'object' ? c.name : c);
    } else if (material?.color) {
      colors = [material.color];
    }
    setSelectedMaterialColors(colors);
    setNewOrder({
      ...newOrder,
      material: materialId,
      selected_color: colors.length > 0 ? colors[0] : ''
    });
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    // Build order data - color is optional in frontend
    const orderData = {
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      suit_type: parseInt(newOrder.suit_type),
      material: parseInt(newOrder.material),
      quantity: newOrder.quantity || 1,
      measurements: {
        height: parseFloat(newOrder.measurements.height) || 0,
        chest: parseFloat(newOrder.measurements.chest) || 0,
        shoulder: parseFloat(newOrder.measurements.shoulder) || 0,
        waist: parseFloat(newOrder.measurements.waist) || 0,
        hips: parseFloat(newOrder.measurements.hips) || 0,
        arm_length: parseFloat(newOrder.measurements.arm_length) || 0,
      }
    };

    // Add selected_color only if it has a value
    if (newOrder.selected_color && newOrder.selected_color.trim()) {
      orderData.selected_color = newOrder.selected_color;
    }

    try {
      const response = await createOrder(orderData);
      setCreatedOrder(response.data);
      setNewOrder({
        customer_name: '', customer_phone: '', suit_type: '', material: '', selected_color: '', quantity: 1,
        measurements: { height: '', chest: '', shoulder: '', waist: '', hips: '', arm_length: '' }
      });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      // Show detailed error message
      const errorData = error.response?.data;
      let errorMsg = 'Something went wrong. Please try again.';

      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
        }
      }
      alert(errorMsg);
    }
  };

  const handleProcessOrder = async (action, data = {}) => {
    if (!selectedOrder) return;
    try {
      await processOrder(selectedOrder.id, { action, ...data });
      setSelectedOrder(null);
      setShowReceiveModal(false);
      setReceiveData({ total_price: '', expected_price: '', due_date: '' });
      fetchOrders();
    } catch (error) {
      console.error('Error processing order:', error);
      alert(error.response?.data?.error || 'Failed to process order');
    }
  };

  const handleReceiveClick = () => {
    setReceiveData({
      total_price: selectedOrder?.total_price || '',
      expected_price: selectedOrder?.expected_price || '',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowReceiveModal(true);
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

  // Fetch payments when selectedOrder changes
  useEffect(() => {
    const fetchPayments = async () => {
      if (selectedOrder) {
        setPaymentLoading(true);
        try {
          const res = await getPaymentByOrderId(selectedOrder.order_code);
          let data = res.data;
          if (!Array.isArray(data)) data = [data];
          setPayments(data);
        } catch (err) {
          setPayments([]);
        } finally {
          setPaymentLoading(false);
        }
      } else {
        setPayments([]);
      }
    };
    fetchPayments();
  }, [selectedOrder]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
                        material_colors: mat.colors || [],
                        material_hex: mat.colors?.[0] ? getHexColor(mat.colors[0].name) : null
                      }));
                    } catch (err) {
                      console.error('Failed to fetch material details:', err);
                    }
                  }
                }}
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
                    {/* Show color if available */}
                    {(order.selected_color_name || order.selected_color) && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Color: <span className="font-bold">{order.selected_color_name || order.selected_color}</span>
                      </p>
                    )}
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
              <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all dark:text-white">
                <HiOutlineXMark size={20} />
              </button>


              <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">{selectedOrder.order_code}</h2>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold mt-1">{selectedOrder.customer_name} • {selectedOrder.customer_phone}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPaymentModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-all border border-zinc-200 dark:border-white/5"
                >
                  <HiOutlineBanknotes className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-tighter dark:text-white">View Payments</span>
                </button>
              </div>

              {/* Payment List Inline - always up to date for selected order */}
              <div className="mb-8">
                <h4 className="text-[11px] font-black uppercase tracking-widest mb-3 dark:text-white flex items-center gap-2">
                  <HiOutlineBanknotes className="text-emerald-500 animate-bounce" /> Payment Details
                </h4>
                <div className="space-y-3">
                  {paymentLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : payments.length > 0 ? (
                    payments.map((payment, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-emerald-50 to-zinc-50 dark:from-emerald-900/40 dark:to-zinc-900/60 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 items-center mb-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Paid</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${payment.is_verified ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300'}`}>{payment.is_verified ? 'Verified' : 'Not Verified'}</span>
                            <span className="text-[9px] text-zinc-500">{new Date(payment.created_at).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-4 items-center">
                            <div>
                              <div className="text-[10px] text-zinc-400 uppercase font-bold">Amount</div>
                              <div className="text-base font-black text-emerald-600 dark:text-emerald-300">{payment.payment_amount} ETB</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-400 uppercase font-bold">Bank Ref</div>
                              <div className="text-xs font-bold dark:text-white break-all">{payment.bank_ref_number || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                        {payment.receipt_screenshot && (
                          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setFullImage(payment.receipt_screenshot)}>
                            <img
                              src={payment.receipt_screenshot}
                              alt="Receipt"
                              className="w-24 h-20 object-cover rounded-lg border border-emerald-200 dark:border-emerald-900 hover:scale-105 transition-transform duration-300 shadow-md"
                            />
                            <span className="text-[9px] text-zinc-400">View</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                      <HiOutlineNoSymbol className="text-yellow-500 animate-pulse" size={20} />
                      <span className="text-[11px] font-black text-yellow-700 dark:text-yellow-200 uppercase">Payment not received yet</span>
                    </div>
                  )}
                </div>
              </div>
      {/* Full Image Modal */}
      <AnimatePresence>
        {fullImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90" onClick={() => setFullImage(null)}>
            <img src={fullImage} alt="Full Receipt" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl border-4 border-white" />
          </div>
        )}
      </AnimatePresence>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Suit Type Name</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.suit_type_name}</p>
                  <p className="text-[9px] font-bold text-zinc-400 mt-2">Suite Type: {selectedOrder.suit_type}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Material</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.material_name}</p>
                </div>
                {/* Selected Color - always show if color info exists */}
                {(selectedOrder.selected_color_name || selectedOrder.selected_color) && (
                  <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Selected Color</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300 shadow"
                        style={{ backgroundColor: getHexColor(selectedOrder.selected_color_name || selectedOrder.selected_color) }}
                        title={selectedOrder.selected_color_name || selectedOrder.selected_color}
                      />
                      <span className="text-base font-bold dark:text-white tracking-tight">
                        {selectedOrder.selected_color_name || selectedOrder.selected_color}
                      </span>
                    </div>
                  </div>
                )}
                {/* Material Image - if available, highlight chosen, allow full view */}
                {(selectedOrder.material_image || selectedOrder.material_colors?.length > 0) && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-2">Material & Color</p>
                    {selectedOrder.material_image ? (
                      <div className="relative group cursor-pointer" onClick={() => setFullImage(selectedOrder.material_image)}>
                        <img
                          src={selectedOrder.material_image}
                          alt={selectedOrder.material_name}
                          className="w-full h-32 object-cover rounded-xl border-4 border-emerald-400/70 group-hover:scale-105 transition-transform duration-200 shadow-lg"
                          style={{ boxShadow: '0 0 0 2px #10b98180' }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-lg flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-xs font-bold text-white">{selectedOrder.material_name} <span className="ml-1 text-emerald-300 font-black">(Chosen)</span></p>
                        </div>
                        <div className="absolute top-2 right-2 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded text-[10px] font-bold text-emerald-600 dark:text-emerald-300 shadow">Full View</div>
                      </div>
                    ) : (
                      <div className="w-full h-20 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 rounded-xl flex items-center justify-center">
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                          {selectedOrder.material_name}
                        </p>
                      </div>
                    )}
                    {selectedOrder.material_colors?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-gray-400 mb-1">Available Colors:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.material_colors.map((color, idx) => {
                            const isChosen = (color.name === selectedOrder.selected_color_name || color.name === selectedOrder.selected_color);
                            return (
                              <div key={idx} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] ${isChosen ? 'bg-emerald-100 dark:bg-emerald-900 border-emerald-400 text-emerald-700 dark:text-emerald-200 font-black shadow' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300'}`}>
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: getHexColor(color.name) }}
                                />
                                <span>{color.name}</span>
                                {isChosen && <span className="ml-1">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Total Price (ETB)</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.total_price}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Expected Price (ETB)</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.expected_price || '0'}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Due Date</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.due_date}</p>
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
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleProcessOrder('reject', { reason: 'Order cancelled by staff' })}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleReceiveClick}
                      className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                    >
                      Receive Order
                    </button>
                  </div>
                )}
                {selectedOrder.status === 'AWAITING_PAYMENT' && (
                  <div className="flex gap-3 w-full">
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
                  <div className="flex gap-3 w-full">
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

      {/* Payment List Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0c0c0c] rounded-[2.5rem] shadow-3xl border border-zinc-200 dark:border-white/10 p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase italic dark:text-white">Payment Records</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all dark:text-white">
                    <HiOutlineXMark size={20} />
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {paymentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : payments.length > 0 ? (
                  payments.map((payment, idx) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Order ID</p>
                          <p className="text-xs font-bold dark:text-white break-all">{payment.order_id || payment.order_code}</p>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2">Bank Ref</p>
                          <p className="text-xs font-bold dark:text-white break-all">{payment.bank_ref_number || 'N/A'}</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                          {payment.payment_amount} ETB
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${payment.is_verified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {payment.is_verified ? 'Verified' : 'Not Verified'}
                        </span>
                        <span className="text-[9px] text-zinc-500">{new Date(payment.created_at).toLocaleString()}</span>
                      </div>
                      {payment.receipt_screenshot && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 cursor-pointer group" onClick={() => setFullImage(payment.receipt_screenshot)}>
                          <img
                            src={payment.receipt_screenshot}
                            alt="Receipt"
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="text-center text-[10px] text-zinc-400 mt-1">Click to view full image</div>
                        </div>
                      )}
                      {payment.receipt_pdf_url && (
                        <a href={payment.receipt_pdf_url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-blue-600 underline text-xs">View PDF Receipt</a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineNoSymbol className="text-zinc-400" size={30} />
                    </div>
                    <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Payment is not received yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Image Modal (for material or receipt) */}
      <AnimatePresence>
        {fullImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90" onClick={() => setFullImage(null)}>
            <img src={fullImage} alt="Full View" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl border-4 border-white" />
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
              <button onClick={() => { setShowCreateModal(false); setCreatedOrder(null); }} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all dark:text-white">
                <HiOutlineXMark size={20} />
              </button>

              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6 dark:text-white">Create New Order</h2>

              {createdOrder ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiOutlineClipboardDocumentCheck className="text-green-500" size={40} />
                  </div>
                  <h3 className="text-lg font-black dark:text-white mb-2">Order Created!</h3>
                  <p className="text-[10px] text-zinc-400 uppercase mb-4">Order Code</p>
                  <p className="text-3xl font-black text-red-600 mb-6">{createdOrder.order_code}</p>
                  <p className="text-[10px] text-zinc-400 uppercase">Please provide this code to the customer.</p>
                </div>
              ) : (
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Customer Name *</label>
                    <input
                      type="text"
                      value={newOrder.customer_name}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Customer Phone *</label>
                    <input
                      type="text"
                      value={newOrder.customer_phone}
                      onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
                      placeholder="+251911234567"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Suit Type *</label>
                    <select
                      value={newOrder.suit_type}
                      onChange={(e) => setNewOrder({ ...newOrder, suit_type: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
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
                      onChange={(e) => {
                        const material = materials.find(m => m.id === parseInt(e.target.value));
                        const colors = material?.colors || [];
                        setSelectedMaterialColors(colors);
                        setNewOrder({
                          ...newOrder,
                          material: e.target.value,
                          selected_color: colors.length > 0 ? colors[0].name : ''
                        });
                      }}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white cursor-pointer"
                      required
                    >
                      <option value="">Select Material</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  {selectedMaterialColors.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Color *</label>
                      <select
                        value={newOrder.selected_color}
                        onChange={(e) => setNewOrder({ ...newOrder, selected_color: e.target.value })}
                        className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white cursor-pointer"
                        required
                      >
                        <option value="">Select Color</option>
                        {selectedMaterialColors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
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
                          className="bg-zinc-100 dark:bg-zinc-900 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 dark:text-white"
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

      {/* Receive Order Modal */}
      <AnimatePresence>
        {showReceiveModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReceiveModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-8"
            >
              <button onClick={() => setShowReceiveModal(false)} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all dark:text-white">
                <HiOutlineXMark size={20} />
              </button>

              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6 dark:text-white">Receive Order</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Total Price (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receiveData.total_price}
                    onChange={(e) => setReceiveData({ ...receiveData, total_price: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
                    placeholder="Enter price"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Expected Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receiveData.expected_price}
                    onChange={(e) => setReceiveData({ ...receiveData, expected_price: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
                    placeholder="Enter expected price"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Due Date *</label>
                  <input
                    type="date"
                    value={receiveData.due_date}
                    onChange={(e) => setReceiveData({ ...receiveData, due_date: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
                    required
                  />
                </div>
                <button
                  onClick={() => handleProcessOrder('receive', {
                    total_price: parseFloat(receiveData.total_price) || 0,
                    expected_price: parseFloat(receiveData.expected_price) || 0,
                    due_date: receiveData.due_date
                  })}
                  disabled={!receiveData.total_price || !receiveData.due_date}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-green-700 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Receive
                </button>
              </div>
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