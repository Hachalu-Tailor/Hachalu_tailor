import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCheck, HiOutlineEye, HiOutlineNoSymbol, HiOutlinePlus,
  HiOutlineShoppingBag, HiOutlineClock, HiOutlineXMark, HiOutlineArrowPath,
  HiOutlineClipboardDocumentCheck, HiOutlineBanknotes
} from 'react-icons/hi2';
import { getOrders, getSuitTypes, createOrder, processOrder, getMaterials, getMaterialDetail, getPaymentByOrderId } from '../../api/api';
import { getHexColor } from '../../utils/colors';
import { API_BASE_URL } from '../../utils/constants';

const Orders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
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

  const backendOrigin = useMemo(() => {
    if (typeof API_BASE_URL === 'string' && API_BASE_URL.startsWith('http')) {
      try {
        return new URL(API_BASE_URL).origin;
      } catch {
        return 'http://127.0.0.1:8000';
      }
    }
    if (import.meta.env.DEV) return 'http://127.0.0.1:8000';
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    return 'http://127.0.0.1:8000';
  }, []);

  // Helper to get absolute URL for media files returned by backend.
  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${backendOrigin}${path}`;
  };

  const materialById = useMemo(
    () => new Map((materials || []).map((m) => [Number(m.id), m])),
    [materials]
  );

  const getOrderImages = (order) => {
    const material = materialById.get(Number(order?.material));
    const materialImage =
      order?.material_image
      || order?.image_url
      || material?.material_image
      || material?.image_url
      || '';
    const suitSampleImage =
      order?.suit_sample_image
      || material?.suit_sample_image
      || '';

    return {
      materialImage: getAbsoluteUrl(materialImage),
      suitSampleImage: getAbsoluteUrl(suitSampleImage),
    };
  };

  const getPaymentReceiptUrl = (payment) => {
    if (!payment) return '';

    const rawReceipt =
      payment.receipt_screenshot
      || payment.receipt_image
      || payment.screenshot
      || payment.image_url
      || payment.receipt
      || payment.receipt_url
      || '';

    if (!rawReceipt) return '';
    if (typeof rawReceipt === 'string') return getAbsoluteUrl(rawReceipt);
    if (typeof rawReceipt === 'object') {
      return getAbsoluteUrl(rawReceipt.url || rawReceipt.path || rawReceipt.src || '');
    }
    return '';
  };

  useEffect(() => {
    fetchOrders();
    fetchSuitTypes();
    fetchMaterials();
  }, []);

  // Open order from dashboard deep link
  useEffect(() => {
    const { highlightOrderId } = location.state || {};
    if (highlightOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === highlightOrderId || o.order_code === highlightOrderId);
      if (order) setSelectedOrder(order);
      navigate('/reception/orders', { replace: true, state: {} }); // Clear state
    }
  }, [orders, location.state, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch all statuses for receptionist monitoring and filtering.
      const response = await getOrders();
      // Handle both array and paginated responses
      let ordersData = response.data;
      if (ordersData && typeof ordersData === 'object' && !Array.isArray(ordersData)) {
        ordersData = ordersData.results || ordersData.data || ordersData.items || [];
      }
      setOrders(ordersData || []);
      // console.log("selected color image", ordersData)
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

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    // Validate measurements – backend requires all > 0
    const requiredMeasurementFields = ['height', 'chest', 'shoulder', 'waist', 'hips', 'arm_length'];
    const numericMeasurements = {};

    for (const field of requiredMeasurementFields) {
      const raw = newOrder.measurements[field];
      const value = parseFloat(raw);
      if (!raw || Number.isNaN(value) || value <= 0) {
        alert(`Please enter a valid ${field.replace('_', ' ')} (must be greater than 0).`);
        return;
      }
      numericMeasurements[field] = value;
    }

    // Build order data - color is optional in frontend
    const orderData = {
      customer_name: newOrder.customer_name,
      customer_phone: newOrder.customer_phone,
      suit_type: parseInt(newOrder.suit_type),
      material: parseInt(newOrder.material),
      quantity: newOrder.quantity || 1,
      measurements: numericMeasurements
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
    const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const dd = String(defaultDue.getDate()).padStart(2, '0');
    const mm = String(defaultDue.getMonth() + 1).padStart(2, '0');
    const yyyy = defaultDue.getFullYear();

    setReceiveData({
      total_price: selectedOrder?.total_price || '',
      expected_price: selectedOrder?.expected_price || '',
      due_date: `${dd}-${mm}-${yyyy}`
    });
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = () => {
    const totalPrice = parseFloat(receiveData.total_price) || 0;
    const expectedPrice = parseFloat(receiveData.expected_price) || 0;
    const rawDate = (receiveData.due_date || '').trim();
    const match = rawDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);

    if (!totalPrice || !rawDate) {
      return;
    }

    if (!match) {
      alert('Assign date must be in DD-MM-YYYY format.');
      return;
    }

    const [, day, month, year] = match;
    const normalizedDate = `${year}-${month}-${day}`;
    const parsed = new Date(normalizedDate);
    if (Number.isNaN(parsed.getTime())) {
      alert('Please enter a valid assign date.');
      return;
    }

    if (expectedPrice > totalPrice) {
      alert('Expected price cannot be greater than total price.');
      return;
    }

    handleProcessOrder('receive', {
      total_price: totalPrice,
      expected_price: expectedPrice,
      due_date: normalizedDate
    });
  };

  const handleReceptionStatusUpdate = async (action) => {
    if (!selectedOrder?.id) return;

    const actionLabel = {
      mark_instore: 'in store',
      close: 'closed',
    };

    try {
      await processOrder(selectedOrder.id, { action });

      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating receptionist status:', error);
      alert(
        error.response?.data?.error
        || error.response?.data?.detail
        || `Failed to update order status to ${actionLabel[action] || action}`
      );
    }
  };

  const inProgressCount = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const instoreCount = orders.filter(o => o.status === 'IN_STORE').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;
  const closedCount = orders.filter(o => o.status === 'CLOSED').length;

  const getStatusLabel = (status) => {
    const labels = {
      INITIATED: 'Initiated',
      AWAITING_PAYMENT: 'Awaiting Payment',
      PENDING_APPROVAL: 'Pending Approval',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      SHIPPED: 'Shipped',
      IN_STORE: 'In Store',
      CLOSED: 'Closed',
      FULLY_PAID: 'Fully Paid',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'INITIATED': 'bg-gray-500/10 text-gray-400',
      'AWAITING_PAYMENT': 'bg-yellow-500/10 text-yellow-500',
      'PENDING_APPROVAL': 'bg-orange-500/10 text-orange-500',
      'IN_PROGRESS': 'bg-blue-500/10 text-blue-500',
      'COMPLETED': 'bg-green-500/10 text-green-500',
      'SHIPPED': 'bg-purple-500/10 text-purple-500',
      'IN_STORE': 'bg-teal-500/10 text-teal-500',
      'CLOSED': 'bg-indigo-500/10 text-indigo-500',
      'FULLY_PAID': 'bg-indigo-500/10 text-indigo-500',
      'REJECTED': 'bg-red-500/10 text-red-500',
      'CANCELLED': 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400';
  };

  const filteredOrders = useMemo(() => {
    let list = orders;

    if (statusFilter === 'initiated') list = orders.filter(o => o.status === 'INITIATED');
    if (statusFilter === 'pending_approval') list = orders.filter(o => o.status === 'PENDING_APPROVAL');
    if (statusFilter === 'in_progress') list = orders.filter(o => o.status === 'IN_PROGRESS');
    if (statusFilter === 'completed') list = orders.filter(o => o.status === 'COMPLETED');
    if (statusFilter === 'shipped') list = orders.filter(o => o.status === 'SHIPPED');
    if (statusFilter === 'in_store') list = orders.filter(o => o.status === 'IN_STORE');
    if (statusFilter === 'closed') list = orders.filter(o => o.status === 'CLOSED');

    // Show newest orders first using order creation timestamp.
    return [...list].sort((a, b) => {
      const bTime = Date.parse(b.created_at || '') || 0;
      const aTime = Date.parse(a.created_at || '') || 0;
      return bTime - aTime;
    });
  }, [orders, statusFilter]);

  const statusFilters = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'initiated', label: 'Initiated', count: orders.filter(o => o.status === 'INITIATED').length },
    { id: 'pending_approval', label: 'Pending Approval', count: orders.filter(o => o.status === 'PENDING_APPROVAL').length },
    { id: 'in_progress', label: 'In Progress', count: inProgressCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'shipped', label: 'Shipped', count: shippedCount },
    { id: 'in_store', label: 'In Store', count: instoreCount },
    { id: 'closed', label: 'Closed', count: closedCount }
  ];

  const totalPriceValue = parseFloat(receiveData.total_price) || 0;
  const expectedPriceValue = parseFloat(receiveData.expected_price) || 0;
  const isExpectedPriceInvalid = receiveData.expected_price !== '' && expectedPriceValue > totalPriceValue;

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
          // console.log("Fetched payments data", data)
              // console.log("selected color image", selectedOrder)
        } catch {
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
    <div className="-mt-2 md:-mt-3 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      {/* Orders List */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-2 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest dark:text-white">Orders</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white p-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              <HiOutlineArrowPath size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
            >
              <HiOutlinePlus size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">New Order</span>
            </button>
            <span className="text-[10px] font-bold text-gray-400">{filteredOrders.length} shown / {orders.length} total</span>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors ${statusFilter === filter.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {filteredOrders.map((order) => (
              (() => {
                const { materialImage, suitSampleImage } = getOrderImages(order);
                return (
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
                        material_image: mat.material_image || mat.image_url || prev?.material_image || prev?.image_url || '',
                        suit_sample_image: mat.suit_sample_image || prev?.suit_sample_image || '',
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
                  <div className="flex items-center gap-2">
                    <div className="h-16 w-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      {materialImage ? (
                        <img
                          src={materialImage}
                          alt="Order Material"
                          className="w-full h-full object-cover"
                          onClick={e => { e.stopPropagation(); setFullImage(materialImage); }}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-zinc-300 dark:text-zinc-700">
                          <rect width="48" height="48" rx="12" fill="currentColor" />
                          <path d="M16 32L22 24L28 32H16Z" fill="#fff"/>
                          <circle cx="20" cy="20" r="2" fill="#fff"/>
                        </svg>
                      )}
                    </div>
                    <div className="h-16 w-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      {suitSampleImage ? (
                        <img
                          src={suitSampleImage}
                          alt="Suit Sample"
                          className="w-full h-full object-cover"
                          onClick={e => { e.stopPropagation(); setFullImage(suitSampleImage); }}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <span className="text-[8px] font-bold uppercase text-zinc-400">No Suit</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-black dark:text-white uppercase">{order.order_code}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {order.customer_name} • {order.suit_type_name}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">{order.customer_phone}</p>
                    {order.created_at && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Ordered: {new Date(order.created_at).toLocaleString()}
                      </p>
                    )}
                    {/* Show color if available */}
                    {(order.selected_color_name || order.selected_color) && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Color: <span className="font-bold">{order.selected_color_name || order.selected_color}</span>
                      </p>
                    )}
                    <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">Left: Material • Right: Suit Sample</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <span className="text-sm font-black dark:text-white">${order.total_price}</span>
                </div>
              </div>
                );
              })()
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
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <Motion.div
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
                      (() => {
                        const receiptUrl = getPaymentReceiptUrl(payment);
                        return (
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
                        {receiptUrl && (
                          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setFullImage(receiptUrl)}>
                            <img
                              src={receiptUrl}
                              alt="Receipt"
                              className="w-24 h-20 object-cover rounded-lg border border-emerald-200 dark:border-emerald-900 hover:scale-105 transition-transform duration-300 shadow-md"
                            />
                            <span className="text-[9px] text-zinc-400">View</span>
                          </div>
                        )}
                      </div>
                        );
                      })()
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
                {(() => {
                  const { materialImage, suitSampleImage } = getOrderImages(selectedOrder);
                  return (
                    <>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Suit Type Name</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.suit_type_name}</p>
                  <p className="text-[9px] font-bold text-zinc-400 mt-2">Suite Type: {selectedOrder.suit_type}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase">Material</p>
                  <p className="text-sm font-bold dark:text-white">{selectedOrder.material_name}</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 col-span-2">
                  <p className="text-[9px] font-black text-zinc-400 uppercase mb-2">Chosen Images</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Material Sample</p>
                      <div
                        className="h-28 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200/60 dark:bg-zinc-800/60 cursor-pointer"
                        onClick={() => {
                          if (materialImage) setFullImage(materialImage);
                        }}
                      >
                        {materialImage ? (
                          <img
                            src={materialImage}
                            alt="Material sample"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">No image</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Suit Sample</p>
                      <div
                        className="h-28 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200/60 dark:bg-zinc-800/60 cursor-pointer"
                        onClick={() => {
                          if (suitSampleImage) setFullImage(suitSampleImage);
                        }}
                      >
                        {suitSampleImage ? (
                          <img
                            src={suitSampleImage}
                            alt="Suit sample"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">No image</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </>
                  );
                })()}
                {/* Selected Color - always show if color info exists */}
                {(selectedOrder.selected_color_name || selectedOrder.selected_color) && (
                  <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Selected Color</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-16 h-8 border-2 border-gray-300 shadow"
                        style={{ backgroundColor: getHexColor(selectedOrder.selected_color_name || selectedOrder.selected_color) }}
                        title={selectedOrder.selected_color_name || selectedOrder.selected_color}
                      />
                      <span className="text-base font-bold dark:text-white tracking-tight">
                        {selectedOrder.selected_color_name || selectedOrder.selected_color}
                      </span>
                    </div>
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
                {/* {selectedOrder.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleProcessOrder('complete')}
                    className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                  >
                    Mark Complete
                  </button>
                )} */}

                {/* After completion, receptionist can mark shipped, in-store, or close */}
                {selectedOrder.status === 'COMPLETED' && (
                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                    >
                      Waiting For Shipment
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'SHIPPED' && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleReceptionStatusUpdate('mark_instore')}
                      className="flex-1 py-4 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all"
                    >
                      Mark In Store
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'IN_STORE' && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleReceptionStatusUpdate('close')}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                    >
                      Mark Collected (Close)
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'CLOSED' && (
                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-4 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                    >
                      Order Closed
                    </button>
                  </div>
                )}

                {selectedOrder.status === 'IN_PROGRESS' && (
                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-4 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
                    >
                      In Progress
                    </button>
                  </div>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment List Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <Motion.div
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
                    (() => {
                      const receiptUrl = getPaymentReceiptUrl(payment);
                      return (
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
                      {receiptUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 cursor-pointer group" onClick={() => setFullImage(receiptUrl)}>
                          <img
                            src={receiptUrl}
                            alt="Receipt"
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="text-center text-[10px] text-zinc-400 mt-1">Click to view full image</div>
                        </div>
                      )}
                      {payment.receipt_pdf_url && (
                        <a href={getAbsoluteUrl(payment.receipt_pdf_url)} target="_blank" rel="noopener noreferrer" className="block mt-2 text-blue-600 underline text-xs">View PDF Receipt</a>
                      )}
                    </div>
                      );
                    })()
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
            </Motion.div>
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
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowCreateModal(false); setCreatedOrder(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <Motion.div
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
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receive Order Modal */}
      <AnimatePresence>
        {showReceiveModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReceiveModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <Motion.div
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
                    className={`w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 mt-2 dark:text-white ${isExpectedPriceInvalid ? 'ring-red-500/60 border border-red-500/60' : 'ring-red-600/20'}`}
                    placeholder="Enter expected price"
                  />
                  {isExpectedPriceInvalid && (
                    <p className="mt-1 text-[10px] font-bold text-red-500">
                      Expected price must be less than or equal to total price.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Assign Date *</label>
                  <input
                    type="text"
                    value={receiveData.due_date}
                    onChange={(e) => setReceiveData({ ...receiveData, due_date: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 dark:text-white"
                    placeholder="DD-MM-YYYY"
                    title="Use date format DD-MM-YYYY"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                  <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                    Format: DD-MM-YYYY
                  </p>
                </div>
                <button
                  onClick={handleConfirmReceive}
                  disabled={!receiveData.total_price || !receiveData.due_date || isExpectedPriceInvalid}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-green-700 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Receive
                </button>
              </div>
            </Motion.div>
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