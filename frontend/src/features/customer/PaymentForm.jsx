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

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankRefNumber, setBankRefNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState(null);

  const fileInputRef = useRef(null);

  // Auto-focus order code input on mount
  useEffect(() => {
    document.querySelector('input[placeholder="e.g., HP-00000001"]')?.focus();
  }, []);

  const handleSearchOrder = async () => {
    if (!orderCode.trim()) return;

    setIsSearching(true);
    setError(null);
    setOrder(null);

    try {
      const response = await api.get(`/orders/list/?order_code=${orderCode.trim().toUpperCase()}`);
      const orders = response.data.results || response.data || [];

      if (orders.length === 0) {
        setError('Order not found. Please check the code.');
        return;
      }

      const foundOrder = orders[0];

      if (!['AWAITING_PAYMENT', 'PENDING_APPROVAL'].includes(foundOrder.status)) {
        setError(`Order is not payable (status: ${foundOrder.status})`);
        return;
      }

      setOrder(foundOrder);
      setPaymentAmount(foundOrder.total_price?.toString() || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not fetch order. Try again.');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(paymentAmount);

    if (!orderCode.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (amountNum > parseFloat(order?.total_price || 0)) {
      setError('Amount cannot exceed the due amount');
      return;
    }

    if (!bankRefNumber.trim()) {
      setError('Transaction reference is required');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('order_code', orderCode.trim().toUpperCase());
      formData.append('amount', amountNum);
      formData.append('bank_ref_number', bankRefNumber.trim());
      formData.append('payment_method', paymentMethod);
      if (receiptFile) {
        formData.append('receipt_file', receiptFile);
      }

      const response = await api.post('/payments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      setSubmittedPayment(response.data);
      setPaymentSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Payment submission failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setOrderCode('');
    setOrder(null);
    setError(null);
    setPaymentSuccess(false);
    setSubmittedPayment(null);
    setPaymentAmount('');
    setBankRefNumber('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setPaymentMethod('bank_transfer');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'bank_transfer':
        return 'Transfer to: Commercial Bank of Ethiopia – Acct: 1000123456789 (Melaku Trading). Use order code as reference.';
      case 'mobile_money':
        return 'Send to: Telebirr / HelloCash / M-Birr – +251912345678. Include order code in message.';
      case 'cash_deposit':
        return 'Deposit cash at nearest branch and keep receipt. Submit here for verification.';
      default:
        return 'Please provide clear reference and proof of payment.';
    }
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
              <p className="text-red-800 dark:text-red-300">{error}</p>
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
            <div className="bg-gray-50 dark:bg-zinc-900/80 p-7 rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-black dark:text-white uppercase tracking-wide">Order Summary</h3>
                <button onClick={resetForm} className="text-sm text-red-600 dark:text-red-400 underline hover:text-red-700">
                  Change Order
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Code</p>
                  <p className="font-bold dark:text-white">{order.order_code}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Due</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    {CURRENCY.SYMBOL} {formatCurrency(order.total_price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</p>
                  <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                    Awaiting Payment
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Due Date</p>
                  <p className="font-medium dark:text-gray-200">{order.due_date || '—'}</p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
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
                      min="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 dark:text-white p-5 pl-12 rounded-2xl outline-none font-bold text-xl"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Remaining due: {CURRENCY.SYMBOL} {formatCurrency((order?.total_price || 0) - parseFloat(paymentAmount || 0))}
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
                    Upload Receipt / Proof (recommended)
                  </label>

                  {!receiptFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl cursor-pointer hover:border-red-500/50 transition-all bg-gray-50/50 dark:bg-black/30">
                      <HiOutlineCloudArrowUp className="text-gray-400 mb-3" size={40} />
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-300">
                        Click or drag receipt (image / pdf)
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
                  ) : (
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

            {/* Final Help */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Our team usually verifies payments within 24 hours.</p>
              <p className="mt-1">You will receive confirmation once approved.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;