import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineDocument,
} from 'react-icons/hi2';
import { getPayments, verifyPayment } from '../../api/api';
import { formatDateTime } from '../../utils/helpers';
import { CURRENCY } from '../../utils/constants';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const normalizePaymentsPayload = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      return payload.results || payload.data || payload.items || [];
    }

    return [];
  };

  const fetchPayments = useCallback(async ({ isRefresh = false } = {}) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const params = {};
      if (filterVerified === 'verified') {
        params.is_verified = 'true';
      } else if (filterVerified === 'pending') {
        params.is_verified = 'false';
      }

      const response = await getPayments(params);
      const paymentsData = normalizePaymentsPayload(response.data);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterVerified]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleVerifyPayment = async (paymentId) => {
    try {
      setVerifyLoading(true);
      await verifyPayment(paymentId, { is_verified: true });
      setToast('Payment verified successfully.');
      setShowDetailModal(false);
      setSelectedPayment(null);
      await fetchPayments({ isRefresh: true });
    } catch (err) {
      console.error('Error verifying payment:', err);
      setToast(err.response?.data?.error || 'Failed to verify payment.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const openPaymentDetail = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    if (verifyLoading) return;
    setShowDetailModal(false);
    setSelectedPayment(null);
  };

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return payments;

    return payments.filter((payment) => {
      const searchable = [
        payment.order_code,
        payment.bank_ref_number,
        payment.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [payments, searchTerm]);

  const stats = useMemo(() => {
    const verifiedCount = payments.filter((p) => p.is_verified).length;
    const pendingCount = payments.filter((p) => !p.is_verified).length;
    const verifiedAmount = payments
      .filter((p) => p.is_verified)
      .reduce((sum, p) => sum + Number(p.payment_amount || 0), 0);

    return {
      total: payments.length,
      verifiedCount,
      pendingCount,
      verifiedAmount,
    };
  }, [payments]);

  const getStatusBadge = (isVerified) => {
    if (isVerified) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
          Verified
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
        Pending
      </span>
    );
  };

  const renderReceipt = (payment) => {
    if (payment?.receipt_pdf_url) {
      return (
        <a
          href={payment.receipt_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-red-500 hover:underline text-xs font-bold"
        >
          <HiOutlineDocument size={14} />
          Open Receipt Link
        </a>
      );
    }

    if (payment?.receipt_screenshot) {
      return (
        <a
          href={payment.receipt_screenshot}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-red-500 hover:underline text-xs font-bold"
        >
          <HiOutlineEye size={14} />
          View Receipt Image
        </a>
      );
    }

    return <span className="text-xs text-gray-400">Not provided</span>;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-[110] bg-black text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
            Payment Management
          </h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            Verify and review customer payment proof
          </p>
        </div>

        <button
          onClick={() => fetchPayments({ isRefresh: true })}
          className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider"
        >
          <HiOutlineArrowPath size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
          <HiOutlineExclamationTriangle className="text-red-500 mt-0.5" size={18} />
          <p className="text-xs font-bold text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <HiOutlineCurrencyDollar className="text-blue-500" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-green-500/10 rounded-xl flex items-center justify-center">
              <HiOutlineCheckCircle className="text-green-500" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified</p>
              <p className="text-2xl font-black dark:text-white">{stats.verifiedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <HiOutlineClock className="text-yellow-500" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black dark:text-white">{stats.pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <HiOutlineCurrencyDollar className="text-emerald-500" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified Amount</p>
              <p className="text-lg font-black dark:text-white">
                {CURRENCY.SYMBOL} {stats.verifiedAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by order code, bank reference, or payment id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none dark:text-white"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'verified'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterVerified(filter)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterVerified === filter
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPayments.length > 0 ? (
          <>
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 p-4 border-b border-gray-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <div className="col-span-2">Order</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-3">Bank Ref</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredPayments.map((payment) => (
                <Motion.div
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4"
                >
                  <div className="hidden lg:grid lg:grid-cols-12 gap-3 items-center">
                    <div className="col-span-2 text-sm font-bold dark:text-white">{payment.order_code || '-'}</div>
                    <div className="col-span-2 text-sm font-bold text-green-500">
                      {CURRENCY.SYMBOL} {Number(payment.payment_amount || 0).toLocaleString()}
                    </div>
                    <div className="col-span-3 text-sm text-gray-500 dark:text-gray-300 truncate">{payment.bank_ref_number || '-'}</div>
                    <div className="col-span-2">{getStatusBadge(payment.is_verified)}</div>
                    <div className="col-span-2 text-xs text-gray-400">{formatDateTime(payment.created_at)}</div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => openPaymentDetail(payment)}
                        className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                        title="View Details"
                      >
                        <HiOutlineEye size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="lg:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black dark:text-white">{payment.order_code || '-'}</p>
                      {getStatusBadge(payment.is_verified)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 uppercase text-[9px] font-bold">Amount</p>
                        <p className="font-black text-green-500">
                          {CURRENCY.SYMBOL} {Number(payment.payment_amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase text-[9px] font-bold">Date</p>
                        <p className="dark:text-gray-300">{formatDateTime(payment.created_at)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[9px] font-bold">Bank Ref</p>
                      <p className="text-xs dark:text-gray-300 break-all">{payment.bank_ref_number || '-'}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => openPaymentDetail(payment)}
                        className="px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-red-600 hover:text-white transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </Motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <HiOutlineCurrencyDollar size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No payments found</p>
            <p className="text-[10px] text-gray-500 mt-1">Try another filter or search term</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDetailModal && selectedPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <Motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-6 sm:p-8"
            >
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
              >
                <HiOutlineXMark size={20} />
              </button>

              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6 dark:text-white">
                Payment Details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Order Code</p>
                    <p className="text-sm font-bold dark:text-white mt-1 break-all">{selectedPayment.order_code || '-'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedPayment.is_verified)}</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Amount</p>
                  <p className="text-lg font-black text-green-500 mt-1">
                    {CURRENCY.SYMBOL} {Number(selectedPayment.payment_amount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Bank Reference</p>
                  <p className="text-sm dark:text-gray-300 mt-1 break-all">{selectedPayment.bank_ref_number || '-'}</p>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Payment Proof</p>
                  <div className="mt-2">{renderReceipt(selectedPayment)}</div>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Created At</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDateTime(selectedPayment.created_at)}</p>
                </div>
              </div>

              {!selectedPayment.is_verified && (
                <button
                  onClick={() => handleVerifyPayment(selectedPayment.id)}
                  disabled={verifyLoading}
                  className="w-full mt-6 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <HiOutlineCheck size={16} />
                  {verifyLoading ? 'Verifying...' : 'Verify Payment'}
                </button>
              )}
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentManagement;
