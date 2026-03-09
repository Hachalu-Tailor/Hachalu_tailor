import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineInformationCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../../api/api';
import { formatCurrency } from '../../utils/helpers'; // assuming formatCurrency exists
import { CURRENCY } from '../../utils/constants';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: HiOutlineDocumentText },
  { value: 'mobile_money', label: 'Mobile Money', icon: HiOutlineCurrencyDollar },
  { value: 'cash_deposit', label: 'Cash Deposit', icon: HiOutlineClock },
  { value: 'other', label: 'Other', icon: HiOutlineInformationCircle },
];

const PaymentForm = () => {
  const [orderCode, setOrderCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [viewPayment, setViewPayment] = useState(null);

  const STATUS_MAP = {
    INITIATED: 'Customer submitted order; waiting for Receptionist to call and set price/date',
    AWAITING_PAYMENT: 'Price/Date set; waiting for Customer to upload Ref Number/Receipt',
    PENDING_APPROVAL: 'Customer uploaded receipt; waiting for Receptionist to verify bank data',
    IN_PROGRESS: 'Payment verified; Suit is being stitched',
    COMPLETED: 'Suit is finished and ready for pickup',
    SHIPPED: 'Order has been shipped from factory',
    IN_STORE: 'Order material has arrived and is ready for pickup',
    CLOSED: 'Customer has collected the suit',
    REJECTED: 'Payment was invalid or order cancelled',
    EXPIRED: 'Order expired due to inactivity',
    FULLY_PAID: 'Customer has fully paid but suit is not yet completed'
  };

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [expectedPrice, setExpectedPrice] = useState(null);
  const [bankRefNumber, setBankRefNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState(null);
  const [receiptError, setReceiptError] = useState(null); // Field-level error for receipt

  const fileInputRef = useRef(null);

  // Auto-focus order code input on mount
  useEffect(() => {
    document.querySelector('input[placeholder="e.g., HP-00000001"]')?.focus();
  }, []);

  // Local storage helpers for payments per order
  const localKey = (code) => `payments_${(code || '').toUpperCase()}`;
  const loadLocalPayments = (code) => {
    if (!code) return [];
    try {
      const raw = localStorage.getItem(localKey(code));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load local payments', e);
      return [];
    }
  };

  const saveLocalPayments = (code, list) => {
    try {
      localStorage.setItem(localKey(code), JSON.stringify(list || []));
    } catch (e) {
      console.error('Failed to save local payments', e);
    }
  };

  const appendLocalPayment = (code, payment) => {
    if (!code || !payment) return;
    const existing = loadLocalPayments(code);
    // simple dedupe by bank_ref_number + amount + created_at
    const exists = existing.find(p => (p.bank_ref_number === payment.bank_ref_number && (parseFloat(p.amount || p.payment_amount || 0) === parseFloat(payment.amount || payment.payment_amount || 0))));
    const next = exists ? existing : [payment, ...existing];
    saveLocalPayments(code, next);
  };

  const handleSearchOrder = async () => {
    if (!orderCode.trim()) return;

    setIsSearching(true);
    setError(null);
    setOrder(null);

    try {
      // 1. Fetch the data
      const response = await api.get(`/orders/code/${orderCode.trim()}/`);

      // 2. Direct Access: The backend returns the object directly
      const foundOrder = response.data;

      // 3. Validation: Check if the object actually has data (like an ID)
      if (!foundOrder || !foundOrder.id) {
        setError('Order not found. Please check the code.');
        return;
      }

      // 4. Status Check: do not block here — show status and allow viewing history locally
      // 5. Success: Set the order
      setOrder(foundOrder);
      // If order is newly initiated, show a friendly notice in the global message area
      if ((foundOrder.status || '').toUpperCase() === 'INITIATED') {
        setError('Your order is initiated. Our reception will check it and call you within 24 hours. Please wait a short time.');
      }
      setExpectedPrice(foundOrder.expected_price ? parseFloat(foundOrder.expected_price) : null);
      // Try to load existing payments for the order
      try {
        const payRes = await api.get('/payments/', { params: { order_code: foundOrder.order_code } });
        const payData = Array.isArray(payRes.data) ? payRes.data : (payRes.data.results || []);
        // merge server payments with local cached ones
        const local = loadLocalPayments(foundOrder.order_code);
        const merged = [...local, ...payData].reduce((acc, p) => {
          const key = `${p.bank_ref_number || ''}::${p.amount || p.payment_amount || ''}::${p.created_at || p.created || ''}`;
          if (!acc._keys.has(key)) {
            acc._keys.add(key);
            acc.list.push(p);
          }
          return acc;
        }, { _keys: new Set(), list: [] }).list;
        setPayments(merged);
        // persist merged locally
        saveLocalPayments(foundOrder.order_code, merged);
        const paidSum = merged.reduce((s, p) => s + (parseFloat(p.amount || p.payment_amount || 0) || 0), 0);
        const remaining = Math.max(0, (parseFloat(foundOrder.total_price || 0) || 0) - paidSum);
        // Default amount: prefer expected_price when available and remaining covers it
        if (foundOrder.expected_price) {
          const exp = parseFloat(foundOrder.expected_price) || 0;
          if (remaining >= exp && exp > 0) setPaymentAmount(exp.toFixed(2));
          else setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
          if (remaining > 0 && remaining < exp) {
            setError('Remaining due is less than expected price. Please contact reception to confirm payment amounts.');
          }
        } else {
          setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
        }
        if (remaining <= 0) {
          if ((foundOrder.status || '').toUpperCase() !== 'INITIATED') {
            setError('This order is already fully paid. No further payments allowed.');
          } else {
            // If order is INITIATED, don't show fully-paid message — show initiation notice elsewhere
            setError(null);
          }
        }
      } catch (e) {
        // fallback: load local payments when API fails
        const local = loadLocalPayments(foundOrder.order_code);
        setPayments(local);
        const paidSum = local.reduce((s, p) => s + (parseFloat(p.amount || p.payment_amount || 0) || 0), 0);
        const remaining = Math.max(0, (parseFloat(foundOrder.total_price || 0) || 0) - paidSum);
        setExpectedPrice(foundOrder.expected_price ? parseFloat(foundOrder.expected_price) : null);
        if (foundOrder.expected_price) {
          const exp = parseFloat(foundOrder.expected_price) || 0;
          if (remaining >= exp && exp > 0) setPaymentAmount(exp.toFixed(2));
          else setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
          if (remaining > 0 && remaining < exp) {
            setError('Remaining due is less than expected price. Please contact reception to confirm payment amounts.');
          }
        } else {
          setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
        }
        if (remaining <= 0) {
          if ((foundOrder.status || '').toUpperCase() !== 'INITIATED') {
            setError('This order is already fully paid (local record). No further payments allowed.');
          } else {
            setError(null);
          }
        }
      }

    } catch (err) {
      console.error("Search Error:", err);
      // Show detailed backend message if present
      const detail = err.response?.data;
      setError(formatErrorData(detail) || 'Could not fetch order. Try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: size & type validation
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      setError('File too large (max 5MB)');
      return;
    }

    setReceiptFile(file);
    setReceiptError(null); // Clear field error when file selected
    setError(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const removeFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(paymentAmount);

    if (!orderCode.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid payment amount');
      scrollToError();
      return;
    }

    // calculate remaining due using payments state (prefer accurate)
    const paidSum = payments.reduce((s, p) => s + (parseFloat(p.amount || p.payment_amount || 0) || 0), 0);
    const remainingDue = Math.max(0, (parseFloat(order?.total_price || 0) || 0) - paidSum);
    if (remainingDue <= 0) {
      setError('Order already fully paid. No more payments allowed.');
      scrollToError();
      return;
    }

    // Enforce expected price minimum when set
    if (expectedPrice && amountNum < expectedPrice) {
      setError(`Please pay at least the expected price: ${CURRENCY.SYMBOL} ${expectedPrice.toFixed(2)}. Contact reception if unsure.`);
      scrollToError();
      return;
    }

    if (amountNum > remainingDue) {
      setError(`Amount cannot exceed the remaining due: ${CURRENCY.SYMBOL} ${remainingDue.toFixed(2)}`);
      scrollToError();
      return;
    }

    if (!bankRefNumber.trim()) {
      setError('Transaction reference is required');
      return;
    }

    // Require either file or URL
    if (!receiptFile && !receiptUrl) {
      const receiptErrorMsg = 'Please upload a receipt image/screenshot OR paste a payment link. This is required.';
      setReceiptError(receiptErrorMsg);
      setError(receiptErrorMsg);
      scrollToError();
      return;
    }

    // Clear field-level error when validation passes
    setReceiptError(null);

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('order_code', orderCode.trim().toUpperCase());
      // Backend expects decimal string like "120.00"
      formData.append('amount', amountNum.toFixed(2));
      formData.append('bank_ref_number', bankRefNumber.trim());
      if (receiptFile) {
        formData.append('receipt_screenshot', receiptFile);
      }
      if (receiptUrl) {
        formData.append('receipt_pdf_url', receiptUrl);
      }

      const response = await api.post('/payments/', formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      setSubmittedPayment(response.data);
      setPaymentSuccess(true);
      // update payments list and clear any error
      setPayments(prev => {
        const next = [response.data, ...prev];
        // persist locally
        appendLocalPayment(orderCode.trim().toUpperCase(), response.data);
        return next;
      });
      setError(null);
      // ensure success is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Payment Error:', err.response?.data);
      const data = err.response?.data;
      const msg = formatErrorData(data) || 'Payment submission failed. Please try again.';
      setError(msg);
      scrollToError();
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // helper: format backend error payloads into readable string
  const formatErrorData = (data) => {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      // If it's an array of errors
      if (Array.isArray(data)) return data.join('; ');
      const parts = [];
      const visit = (obj, prefix = '') => {
        for (const [k, v] of Object.entries(obj)) {
          const name = prefix ? `${prefix}.${k}` : k;
          if (v == null) continue;
          if (typeof v === 'string') parts.push(`${name}: ${v}`);
          else if (Array.isArray(v)) parts.push(`${name}: ${v.join(', ')}`);
          else if (typeof v === 'object') visit(v, name);
          else parts.push(`${name}: ${String(v)}`);
        }
      };
      visit(data);
      return parts.join(' • ');
    }
    return String(data);
  };

  const scrollToError = () => {
    setTimeout(() => {
      const el = document.getElementById('payment-error');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const resetForm = () => {
    setOrderCode('');
    setOrder(null);
    setError(null);
    setReceiptError(null);
    setPaymentSuccess(false);
    setSubmittedPayment(null);
    setPaymentAmount('');
    setBankRefNumber('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptUrl(null);
    setUploadMethod('file');
    setPaymentMethod('bank_transfer');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPaidSum = () => {
    return payments.reduce((s, p) => s + (parseFloat(p.amount || p.payment_amount || 0) || 0), 0);
  };

  const getRemainingDue = () => {
    return Math.max(0, (parseFloat(order?.total_price || 0) || 0) - getPaidSum());
  };

  const canMakePayment = () => {
    if (!order) return false;
    // Only allow payments in AWAITING_PAYMENT state and when there's remaining due
    const allowed = ['AWAITING_PAYMENT'];
    return allowed.includes(order.status) && getRemainingDue() > 0;
  };

  const getStatusNote = () => {
    if (!order) return '';
    const s = order.status;
    const remaining = getRemainingDue();
    if (s === 'INITIATED') return 'Your order has been sent to reception. Our receptionist will check it and contact you within 24 hours. Please wait a short time; we will call you on the phone number you provided.';
    if (s === 'IN_PROGRESS') {
      if (remaining > 0) return 'Your order is in progress. There is still a remaining payment — please complete the expected payment or contact reception for adjustments. Otherwise, wait for our team to call you before your scheduled day.';
      return 'Your order is in progress. No remaining payment — please wait for our team to call you before your scheduled day.';
    }
    if (s === 'AWAITING_PAYMENT') return 'Price has been set. Please pay the expected amount below. If you need to pay again, contact reception for guidance.';
    if (s === 'FULLY_PAID' || s === 'CLOSED') return 'This order is fully paid. Do not make additional payments. Contact reception if there is an issue.';
    return STATUS_MAP[s] || '';
  };

  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'bank_transfer':
        return 'Transfer to: Commercial Bank of Ethiopia – Acct: 1000123456789 (Hachalu Tailor). Use order code as reference.';
      case 'mobile_money':
        return 'Send to: Telebirr / HelloCash / M-Birr – +251912345678. Include order code in message.';
      case 'cash_deposit':
        return 'Deposit cash at nearest branch and keep receipt. Submit here for verification.';
      default:
        return 'Please provide clear reference and proof of payment.';
    }
  };

  const isInitiated = () => {
    return (order && (order.status || '').toUpperCase() === 'INITIATED');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] pt-24 pb-20 px-4 sm:px-6 lg:px-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/30">
            <HiOutlineCurrencyDollar className="text-white" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black dark:text-white uppercase tracking-tight">
            Submit Payment Proof
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Securely upload proof for manual verification
          </p>
        </div>

        {/* Global Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 flex items-center gap-3 bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-800 rounded-2xl"
            >
              <HiOutlineExclamationTriangle className="text-red-600 dark:text-red-400 shrink-0" size={24} />
              <p id="payment-error" className="text-red-800 dark:text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!order ? (
          // SEARCH PHASE
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 dark:bg-zinc-900/70 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/5"
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSearchOrder(); }} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                  Order Code
                </label>
                <div className="relative">
                  <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HP-00000001"
                    className="w-full bg-white dark:bg-black border-2 border-gray-200 dark:border-white/10 focus:border-red-600 focus:ring-2 focus:ring-red-600/30 dark:text-white p-5 pl-12 rounded-2xl outline-none transition font-mono font-bold text-xl text-center uppercase"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSearching || !orderCode.trim()}
                className="w-full bg-gradient-to-r from-black to-zinc-900 dark:from-white dark:to-zinc-200 text-white dark:text-black font-black uppercase py-5 rounded-2xl tracking-widest text-sm hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
              >
                {isSearching ? (
                  <>
                    Searching <div className="animate-spin w-5 h-5 border-4 border-t-transparent border-current rounded-full" />
                  </>
                ) : (
                  'Find Order & Proceed'
                )}
              </button>
            </form>
          </motion.div>
        ) : paymentSuccess ? (
          // SUCCESS PHASE
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-b from-green-50/80 to-white dark:from-green-950/30 dark:to-zinc-900 p-10 rounded-3xl shadow-2xl border border-green-200 dark:border-green-800/40 text-center"
          >
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineCheckCircle className="text-green-600 dark:text-green-400" size={64} />
            </div>

            <h2 className="text-3xl font-black dark:text-white mb-3">Payment Received!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Thank you! Our team will verify your payment within 24 hours.
            </p>

            {submittedPayment && (
              <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm p-6 rounded-2xl mb-8 text-left border border-gray-200 dark:border-white/10">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Order</p>
                    <p className="font-bold dark:text-white">{submittedPayment.order_code}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Amount</p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {CURRENCY.SYMBOL} {formatCurrency(submittedPayment.payment_amount || submittedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ref #</p>
                    <p className="font-medium dark:text-gray-200">{submittedPayment.bank_ref_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</p>
                    <span className="inline-block px-4 py-1 mt-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                      Awaiting Verification
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-wider text-sm transition shadow-lg"
            >
              <HiOutlineArrowPath size={20} />
              Submit Another Payment
            </button>
          </motion.div>
        ) : (
          // PAYMENT FORM PHASE
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Order Summary Card */}
            {isInitiated() ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-8 rounded-3xl border border-blue-200 dark:border-blue-800 shadow-md">
                <div className="flex items-start gap-4">
                  <HiOutlineInformationCircle className="text-blue-600 shrink-0 mt-1" size={28} />
                  <div>
                    <h3 className="text-lg font-black dark:text-white uppercase tracking-wide">Order Received</h3>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{getStatusNote()}</p>
                    <p className="mt-3 text-xs text-gray-500">Please wait — our receptionist will contact you within 24 hours to confirm price and schedule.</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={resetForm} className="text-sm text-red-600 dark:text-red-400 underline hover:text-red-700">Change Order</button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-zinc-900/80 p-7 rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-black dark:text-white uppercase tracking-wide">Order Summary</h3>
                  <button onClick={resetForm} className="text-sm text-red-600 dark:text-red-400 underline hover:text-red-700">Change Order</button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Order Code</p>
                    <p className="font-bold dark:text-white">{order.order_code}</p>
                  </div>
                  <div>
                    {/* total price */}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Total Price</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{CURRENCY.SYMBOL} {formatCurrency(order.total_price)}</p>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Expected Price</p>
                    <p className="font-bold text-green-600 dark:text-green-400">{CURRENCY.SYMBOL} {formatCurrency(order.expected_price)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</p>
                    <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">{(order.status || '').replace(/_/g, ' ')}</span>
                    <p className="text-xs text-gray-500 mt-2">{STATUS_MAP[order.status] || ''}</p>
                    <p className="text-xs text-gray-500 mt-2">{getStatusNote()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Due Date</p>
                    <p className="font-medium dark:text-gray-200">{order.due_date || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payments History */}
            {payments && payments.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-white/5 mt-4">
                <h4 className="text-sm font-black dark:text-white mb-3">Payment History</h4>
                <div className="space-y-3">
                  {payments.map((p) => (
                    <button key={p.id || p.created_at || Math.random()} type="button" onClick={() => setViewPayment(p)} className="w-full text-left flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">{p.payment_method || p.method || 'Payment'}</p>
                        <p className="font-bold dark:text-white">{CURRENCY.SYMBOL} {formatCurrency(p.amount || p.payment_amount || 0)}</p>
                        <p className="text-xs text-gray-400">Ref: {p.bank_ref_number || p.reference || '—'}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{new Date(p.created_at || p.created || p.timestamp || Date.now()).toLocaleString()}</p>
                        <p className="mt-1 inline-block px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30">{p.status || 'Sent'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Form */}
            {canMakePayment() ? (
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/5">
                <h3 className="text-2xl font-black dark:text-white mb-8 flex items-center gap-3">
                  <HiOutlineDocumentText className="text-red-600" size={28} />
                  Payment Details
                </h3>

                <form onSubmit={handleSubmitPayment} className="space-y-7">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PAYMENT_METHODS.map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setPaymentMethod(m.value)}
                            className={`p-4 rounded-2xl border-2 text-center transition-all ${paymentMethod === m.value
                              ? 'border-red-600 bg-red-50 dark:bg-red-950/30'
                              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                              }`}
                          >
                            <Icon className="mx-auto mb-2 text-gray-500" size={24} />
                            <p className="text-xs font-bold dark:text-gray-200">{m.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                      Amount Paid <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                        {CURRENCY.SYMBOL}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min={expectedPrice ? expectedPrice : 0.01}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder={expectedPrice ? expectedPrice.toFixed(2) : '0.00'}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:text-white p-5 pl-12 rounded-2xl outline-none font-bold text-xl"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Remaining due: {CURRENCY.SYMBOL} {formatCurrency(getRemainingDue())}
                    </p>
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                      Transaction/Reference Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankRefNumber}
                      onChange={(e) => setBankRefNumber(e.target.value.trim())}
                      placeholder="Enter transaction ID or reference"
                      className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-red-600 dark:text-white p-5 rounded-2xl outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      The number shown on your bank/mobile receipt
                    </p>
                  </div>

                  {/* Receipt Upload */}
                  <div>
                    <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                      Upload Receipt / Proof <span className="text-red-500">*</span> <span className="text-gray-400 normal-case tracking-normal">(required)</span>
                    </label>

                    {/* Toggle Buttons */}
                    <div className="flex gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => { setUploadMethod('file'); setReceiptUrl(''); setReceiptError(null); }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${uploadMethod === 'file'
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/30 text-red-600'
                          : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300'
                          }`}
                      >
                        📎 Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUploadMethod('url'); setReceiptFile(null); setReceiptPreview(null); setReceiptError(null); }}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${uploadMethod === 'url'
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/30 text-red-600'
                          : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300'
                          }`}
                      >
                        🔗 Browser Link
                      </button>
                    </div>

                    {/* File Upload Mode */}
                    {uploadMethod === 'file' && !receiptFile && (
                      <>
                        <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all bg-gray-50/50 dark:bg-black/30 ${receiptError
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20 hover:border-red-600'
                          : 'border-gray-300 dark:border-white/20 hover:border-red-500/50'
                          }`}>
                          <HiOutlineCloudArrowUp className={`mb-3 ${receiptError ? 'text-red-500' : 'text-gray-400'}`} size={40} />
                          <span className={`text-sm font-bold ${receiptError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-300'}`}>
                            Click or drag receipt (image / pdf) <span className="text-red-500">*</span>
                          </span>
                          <span className="text-xs text-gray-400 mt-1">Max 5MB</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                          />
                        </label>
                        {/* Field-level error message */}
                        {receiptError && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                            <HiOutlineExclamationTriangle size={16} />
                            {receiptError}
                          </p>
                        )}
                      </>
                    )}

                    {/* URL Input Mode */}
                    {uploadMethod === 'url' && (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={receiptUrl || ''}
                          onChange={(e) => { setReceiptUrl(e.target.value); setReceiptError(null); setError(null); }}
                          placeholder="Paste payment screenshot link (e.g., https://imgbb.com/...)"
                          className={`w-full bg-gray-50 dark:bg-black border ${receiptError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-red-600'} dark:text-white p-4 rounded-2xl outline-none text-sm`}
                        />
                        <p className="text-xs text-gray-500">
                          Paste a direct link to your payment screenshot or proof image
                        </p>
                      </div>
                    )}

                    {/* File Preview */}
                    {uploadMethod === 'file' && receiptFile && (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 p-4">
                        {receiptPreview ? (
                          <img src={receiptPreview} alt="Receipt preview" className="max-h-64 mx-auto rounded-lg" />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p className="font-medium">{receiptFile.name}</p>
                            <p className="text-xs mt-1">PDF document</p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700"
                        >
                          <HiOutlineXMark size={20} />
                        </button>

                        <p className="text-xs text-center text-gray-500 mt-3">
                          {receiptFile.name} • {(receiptFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-start gap-3">
                      <HiOutlineInformationCircle className="text-blue-600 shrink-0 mt-1" size={22} />
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wide mb-1 text-blue-800 dark:text-blue-300">
                          {paymentMethod.replace('_', ' ').toUpperCase()} Instructions
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                          {getPaymentInstructions()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !paymentAmount || !bankRefNumber.trim()}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-6 rounded-2xl font-black uppercase tracking-[0.25em] text-sm transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        {uploadProgress > 0 && uploadProgress < 100
                          ? `Uploading... ${uploadProgress}%`
                          : 'Processing...'}
                        <div className="animate-spin w-5 h-5 border-4 border-t-transparent border-white rounded-full" />
                      </>
                    ) : (
                      <>
                        <HiOutlineCheckCircle size={22} />
                        Confirm & Submit Payment
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-800 mt-4">
                <h4 className="font-black">Order Status: {(order.status || '').replace(/_/g, ' ')}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{getStatusNote() || 'This order cannot accept payments at the moment.'}</p>
                {getRemainingDue() > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mt-3">Remaining due: {CURRENCY.SYMBOL} {formatCurrency(getRemainingDue())}</p>
                    <p className="text-xs text-gray-500 mt-2">If you believe you should be able to pay now, please contact the reception desk for assistance.</p>
                  </>
                )}
              </div>
            )}

            {/* View Payment Modal */}
            <AnimatePresence>
              {viewPayment && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div onClick={() => setViewPayment(null)} className="absolute inset-0 bg-black/60" />
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative max-w-lg w-full bg-white dark:bg-[#0b0b0b] rounded-2xl p-6 z-60 border dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-black uppercase">Payment Details</h4>
                      <button onClick={() => setViewPayment(null)} className="text-gray-500 dark:text-white"><HiOutlineXMark size={20} /></button>
                    </div>
                    <div className="space-y-3 text-sm">
                      <p><span className="text-xs text-gray-400">Amount:</span> <strong>{CURRENCY.SYMBOL} {formatCurrency(viewPayment.amount || viewPayment.payment_amount || 0)}</strong></p>
                      <p><span className="text-xs text-gray-400">Method:</span> {viewPayment.payment_method || viewPayment.method || '—'}</p>
                      <p><span className="text-xs text-gray-400">Ref:</span> {viewPayment.bank_ref_number || viewPayment.reference || '—'}</p>
                      <p><span className="text-xs text-gray-400">Status:</span> {viewPayment.status || 'Sent'}</p>
                      <p><span className="text-xs text-gray-400">When:</span> {new Date(viewPayment.created_at || viewPayment.created || viewPayment.timestamp || Date.now()).toLocaleString()}</p>
                      {viewPayment.receipt_pdf_url && (
                        <p><a href={viewPayment.receipt_pdf_url} target="_blank" rel="noreferrer" className="text-red-600 underline">Open Receipt Link</a></p>
                      )}
                      {viewPayment.receipt_screenshot && viewPayment.receipt_screenshot.startsWith && viewPayment.receipt_screenshot.startsWith('data:') && (
                        <img src={viewPayment.receipt_screenshot} alt="Receipt" className="max-h-80 rounded-lg mt-3" />
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;