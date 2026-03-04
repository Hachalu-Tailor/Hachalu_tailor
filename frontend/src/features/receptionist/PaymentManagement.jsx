import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineCurrencyDollar,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineClock,
    HiOutlineDocumentText,
    HiOutlineMagnifyingGlass,
    HiOutlineEye,
    HiOutlineCheck,
    HiOutlineXMark
} from 'react-icons/hi2';
import api, { getPayments, verifyPayment } from '../../api/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';
import { CURRENCY } from '../../utils/constants';

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVerified, setFilterVerified] = useState('all'); // 'all', 'verified', 'pending'
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, [filterVerified]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterVerified === 'verified') {
                params.is_verified = 'true';
            } else if (filterVerified === 'pending') {
                params.is_verified = 'false';
            }
            const response = await getPayments(params);
            // Handle both array and paginated responses
            let paymentsData = response.data;
            if (paymentsData && typeof paymentsData === 'object' && !Array.isArray(paymentsData)) {
                paymentsData = paymentsData.results || paymentsData.data || paymentsData.items || [];
            }
            setPayments(paymentsData || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (paymentId, isVerified) => {
        try {
            setVerifyLoading(true);
            await verifyPayment(paymentId, {
                is_verified: isVerified
            });
            fetchPayments();
            setShowVerifyModal(false);
            setSelectedPayment(null);
        } catch (error) {
            console.error('Error verifying payment:', error);
            alert(error.response?.data?.error || 'Failed to verify payment');
        } finally {
            setVerifyLoading(false);
        }
    };

    const filteredPayments = payments.filter(payment =>
        payment.order_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.bank_ref_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (isVerified) => {
        if (isVerified) {
            return (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-500">
                    Verified
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-500">
                Pending
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
                        Payment Management
                    </h2>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                        Verify and manage customer payments
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <HiOutlineCurrencyDollar className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Payments</p>
                            <p className="text-2xl font-black dark:text-white">{payments.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <HiOutlineCheckCircle className="text-green-500" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified</p>
                            <p className="text-2xl font-black dark:text-white">
                                {payments.filter(p => p.is_verified).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                            <HiOutlineClock className="text-yellow-500" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                            <p className="text-2xl font-black dark:text-white">
                                {payments.filter(p => !p.is_verified).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by order code or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-red-600/20 dark:text-white"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'verified'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setFilterVerified(filter)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterVerified === filter
                                ? 'bg-red-600 text-white'
                                : 'bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 text-gray-400 hover:text-red-600'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/5">
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order Code</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Ref</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                                    <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment) => (
                                    <motion.tr
                                        key={payment.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-4">
                                            <span className="text-sm font-bold dark:text-white">{payment.order_code}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-bold text-green-500">
                                                {CURRENCY.SYMBOL} {payment.payment_amount}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-medium dark:text-gray-300">{payment.bank_ref_number || '-'}</span>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(payment.is_verified)}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs text-gray-400">
                                                {formatDateTime(payment.created_at)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setShowVerifyModal(true);
                                                    }}
                                                    className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                                    title="View Details"
                                                >
                                                    <HiOutlineEye size={16} />
                                                </button>
                                                {!payment.is_verified && (
                                                    <button
                                                        onClick={() => handleVerifyPayment(payment.id, true)}
                                                        className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                                                        title="Verify Payment"
                                                    >
                                                        <HiOutlineCheck size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <HiOutlineCurrencyDollar size={48} className="mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-400">No payments found</p>
                    </div>
                )}
            </div>

            {/* Verify Modal */}
            <AnimatePresence>
                {showVerifyModal && selectedPayment && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowVerifyModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-8"
                        >
                            <button
                                onClick={() => setShowVerifyModal(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                            >
                                <HiOutlineXMark size={20} />
                            </button>

                            <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6 dark:text-white">
                                Payment Details
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Order Code</span>
                                    <span className="text-sm font-bold dark:text-white">{selectedPayment.order_code}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
                                    <span className="text-sm font-bold text-green-500">
                                        {CURRENCY.SYMBOL} {selectedPayment.payment_amount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Bank Reference</span>
                                    <span className="text-sm font-medium dark:text-gray-300">{selectedPayment.bank_ref_number || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Receipt URL</span>
                                    {selectedPayment.receipt_pdf_url ? (
                                        <a
                                            href={selectedPayment.receipt_pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-red-500 hover:underline"
                                        >
                                            View Receipt
                                        </a>
                                    ) : (
                                        <span className="text-sm text-gray-400">No receipt</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                                    {getStatusBadge(selectedPayment.is_verified)}
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Created At</span>
                                    <span className="text-xs text-gray-400">{formatDateTime(selectedPayment.created_at)}</span>
                                </div>
                            </div>

                            {!selectedPayment.is_verified && (
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => handleVerifyPayment(selectedPayment.id, true)}
                                        disabled={verifyLoading}
                                        className="flex-1 py-3 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <HiOutlineCheck size={16} />
                                        {verifyLoading ? 'Verifying...' : 'Verify Payment'}
                                    </button>
                                    <button
                                        onClick={() => handleVerifyPayment(selectedPayment.id, false)}
                                        disabled={verifyLoading}
                                        className="py-3 px-4 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        <HiOutlineXMark size={16} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PaymentManagement;
