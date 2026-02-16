import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCurrencyDollar, HiOutlineCheckCircle, HiOutlineXCircle,
    HiOutlineClock, HiOutlineExclamationTriangle, HiOutlineDocumentText,
    HiOutlinePrinter, HiOutlineXMark, HiOutlineArrowPath
} from 'react-icons/hi2';
import api from '../../api/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS, CURRENCY } from '../../utils/constants';

const PaymentReview = ({ isOpen, onClose, payment, onApprove, onReject }) => {
    const [loading, setLoading] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);

    // Fetch order details when payment changes
    useEffect(() => {
        if (payment?.order) {
            fetchOrderDetails(payment.order);
        }
    }, [payment]);

    const fetchOrderDetails = async (orderId) => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/list/${orderId}/`);
            setOrderDetails(response.data);
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    // Handle approve payment
    const handleApprove = async () => {
        if (!payment) return;

        try {
            setLoading(true);
            await api.post(`/payments/${payment.id}/approve/`, {
                notes: notes
            });

            if (onApprove) {
                onApprove(payment);
            }

            onClose();
        } catch (err) {
            console.error('Error approving payment:', err);
            setError(err.response?.data?.detail || 'Failed to approve payment');
        } finally {
            setLoading(false);
        }
    };

    // Handle reject payment
    const handleReject = async () => {
        if (!payment) return;

        if (!notes.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/payments/${payment.id}/reject/`, {
                notes: notes
            });

            if (onReject) {
                onReject(payment);
            }

            onClose();
        } catch (err) {
            console.error('Error rejecting payment:', err);
            setError(err.response?.data?.detail || 'Failed to reject payment');
        } finally {
            setLoading(false);
        }
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const colorClass = PAYMENT_STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-600';
        const label = PAYMENT_STATUS_LABELS[status] || status;

        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${colorClass}`}>
                {label}
            </span>
        );
    };

    if (!isOpen || !payment) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                <HiOutlineCurrencyDollar className="text-emerald-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black dark:text-white uppercase tracking-tight">
                                    Payment Review
                                </h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                    Transaction #{payment.id?.slice(0, 8) || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                        >
                            <HiOutlineXMark className="text-gray-500" size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <HiOutlineExclamationTriangle className="text-red-500" size={20} />
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}

                        {/* Payment Status */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Status</span>
                            {getStatusBadge(payment.status)}
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                                <p className="text-2xl font-black dark:text-white">
                                    {formatCurrency(payment.amount, CURRENCY.CODE)}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
                                <p className="text-lg font-bold dark:text-white capitalize">
                                    {payment.payment_method || 'Cash'}
                                </p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Information</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-400">Name</p>
                                    <p className="text-sm font-bold dark:text-white">{payment.customer_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400">Phone</p>
                                    <p className="text-sm font-bold dark:text-white">{payment.customer_phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Details */}
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : orderDetails ? (
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Order Details</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Order Code</span>
                                        <span className="text-sm font-bold dark:text-white">{orderDetails.order_code || orderDetails.id?.slice(0, 8)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Total Price</span>
                                        <span className="text-sm font-bold dark:text-white">{formatCurrency(orderDetails.total_price, CURRENCY.CODE)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Created</span>
                                        <span className="text-sm font-bold dark:text-white">{formatDateTime(orderDetails.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Notes Input */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                                placeholder="Add notes about this payment..."
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-all"
                        >
                            <HiOutlinePrinter size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Print</span>
                        </button>

                        <div className="flex items-center gap-3">
                            {payment.status === 'pending' && (
                                <>
                                    <button
                                        onClick={handleReject}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                        <HiOutlineXCircle size={16} />
                                        Reject
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                        <HiOutlineCheckCircle size={16} />
                                        Approve
                                    </button>
                                </>
                            )}

                            {payment.status !== 'pending' && (
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-300 dark:hover:bg-white/20 transition-all"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PaymentReview;
