import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCurrencyDollar,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineClock,
    HiOutlineCreditCard,
    HiOutlineBanknotes,
    HiOutlineDevicePhoneMobile,
    HiOutlineBuildingLibrary,
    HiOutlineEye,
    HiOutlineDocumentText
} from 'react-icons/hi2';
import {
    PAYMENT_STATUS_LABELS,
    PAYMENT_METHOD_LABELS,
    CURRENCY,
    ORDER_STATUS_LABELS
} from '../../utils/constants';
import {
    getPayments,
    verifyPayment,
    createPayment
} from '../../api/api';

const PaymentReview = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, completed, failed
    const [processingPayment, setProcessingPayment] = useState(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await getPayments();
            setPayments(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (paymentId, approved) => {
        try {
            setProcessingPayment(paymentId);
            await verifyPayment(paymentId, { approved });

            // Update local state
            setPayments(prev => prev.map(p =>
                p.id === paymentId
                    ? { ...p, status: approved ? 'completed' : 'failed' }
                    : p
            ));

            setShowModal(false);
            setSelectedPayment(null);
        } catch (error) {
            console.error('Error verifying payment:', error);
        } finally {
            setProcessingPayment(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'failed':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'refunded':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'cash':
                return <HiOutlineBanknotes className="text-green-400" size={20} />;
            case 'card':
                return <HiOutlineCreditCard className="text-blue-400" size={20} />;
            case 'mobile_money':
                return <HiOutlineDevicePhoneMobile className="text-purple-400" size={20} />;
            case 'bank_transfer':
                return <HiOutlineBuildingLibrary className="text-orange-400" size={20} />;
            default:
                return <HiOutlineCurrencyDollar className="text-gray-400" size={20} />;
        }
    };

    const filteredPayments = payments.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    const PaymentDetailModal = () => {
        if (!selectedPayment) return null;

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                                    Payment Details
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <HiOutlineXCircle size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Payment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Transaction ID
                                    </p>
                                    <p className="text-white font-mono text-sm">
                                        {selectedPayment.transaction_id || selectedPayment.id?.slice(0, 8)}
                                    </p>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Amount
                                    </p>
                                    <p className="text-white font-bold text-lg">
                                        {CURRENCY.SYMBOL} {selectedPayment.amount?.toLocaleString()}
                                    </p>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Payment Method
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {getPaymentIcon(selectedPayment.payment_method)}
                                        <span className="text-white text-sm">
                                            {PAYMENT_METHOD_LABELS[selectedPayment.payment_method] || selectedPayment.payment_method}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                        Status
                                    </p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(selectedPayment.status)}`}>
                                        {PAYMENT_STATUS_LABELS[selectedPayment.status] || selectedPayment.status}
                                    </span>
                                </div>
                            </div>

                            {/* Order Info */}
                            {selectedPayment.order && (
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Related Order
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-mono">
                                            Order #{selectedPayment.order_code || selectedPayment.order?.slice(0, 8)}
                                        </span>
                                        <span className="text-gray-400 text-sm">
                                            {ORDER_STATUS_LABELS[selectedPayment.order_status] || ''}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Customer Info */}
                            {selectedPayment.customer_name && (
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Customer
                                    </p>
                                    <p className="text-white">{selectedPayment.customer_name}</p>
                                    {selectedPayment.customer_phone && (
                                        <p className="text-gray-400 text-sm">{selectedPayment.customer_phone}</p>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            {selectedPayment.notes && (
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        Notes
                                    </p>
                                    <p className="text-gray-300 text-sm">{selectedPayment.notes}</p>
                                </div>
                            )}

                            {/* Created Date */}
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <HiOutlineClock size={16} />
                                <span>
                                    Created: {new Date(selectedPayment.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        {selectedPayment.status === 'pending' && (
                            <div className="p-6 border-t border-white/10 flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleVerifyPayment(selectedPayment.id, false)}
                                    disabled={processingPayment === selectedPayment.id}
                                    className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                                >
                                    <HiOutlineXCircle size={18} />
                                    Reject
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleVerifyPayment(selectedPayment.id, true)}
                                    disabled={processingPayment === selectedPayment.id}
                                    className="flex-1 py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                                >
                                    <HiOutlineCheckCircle size={18} />
                                    Approve
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
                        Payment Review
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Review and verify customer payments
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    {['all', 'pending', 'completed', 'failed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${filter === status
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <HiOutlineCurrencyDollar className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Total</p>
                            <p className="text-white font-bold text-xl">
                                {payments.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <HiOutlineClock className="text-yellow-400" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Pending</p>
                            <p className="text-white font-bold text-xl">
                                {payments.filter(p => p.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <HiOutlineCheckCircle className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Completed</p>
                            <p className="text-white font-bold text-xl">
                                {payments.filter(p => p.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/20 rounded-lg">
                            <HiOutlineXCircle className="text-red-400" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Failed</p>
                            <p className="text-white font-bold text-xl">
                                {payments.filter(p => p.status === 'failed').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-400 text-sm">Loading payments...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="p-12 text-center">
                        <HiOutlineDocumentText className="text-gray-500 mx-auto mb-4" size={48} />
                        <p className="text-gray-400">No payments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Transaction
                                    </th>
                                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Customer
                                    </th>
                                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Amount
                                    </th>
                                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Method
                                    </th>
                                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Status
                                    </th>
                                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Date
                                    </th>
                                    <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredPayments.map((payment) => (
                                    <motion.tr
                                        key={payment.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-white font-mono text-sm">
                                                #{payment.transaction_id || payment.id?.slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white text-sm">{payment.customer_name || 'N/A'}</p>
                                                {payment.customer_phone && (
                                                    <p className="text-gray-500 text-xs">{payment.customer_phone}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-bold">
                                                {CURRENCY.SYMBOL} {payment.amount?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getPaymentIcon(payment.payment_method)}
                                                <span className="text-gray-300 text-sm">
                                                    {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(payment.status)}`}>
                                                {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-400 text-sm">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    setSelectedPayment(payment);
                                                    setShowModal(true);
                                                }}
                                                className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <HiOutlineEye size={18} />
                                            </motion.button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && <PaymentDetailModal />}
        </div>
    );
};

export default PaymentReview;
