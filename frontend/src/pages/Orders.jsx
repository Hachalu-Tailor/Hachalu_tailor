import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineTicket, 
  HiOutlineCheckCircle, 
  HiOutlineCreditCard, 
  HiOutlineClock,
  HiOutlineCloudArrowUp,
  HiOutlineInformationCircle,
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlineEye
} from 'react-icons/hi2';
import { createPayment, getPayments, getOrderDetail } from '../api/api';

const Orders = () => {
  const [orderCode, setOrderCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    amount: "",
    bank_ref_number: "",
    receipt_pdf_url: ""
  });

  // Fetch Payment History for the tracked order
  const fetchOrderHistory = async (code) => {
    try {
      const response = await getPayments(); // Assuming this lists all, we filter by code
      const filtered = response.data.filter(p => p.order_code === code);
      setPaymentsList(filtered);
    } catch (err) {
      console.error("Payment history fetch failed", err);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      // In a real app, you'd have an endpoint to get order by code: getOrderDetails(orderCode)
      // For now, we simulate finding the order and fetching its payments
      await fetchOrderHistory(orderCode);
      setOrderDetails({ code: orderCode, status: 'In Progress' }); 
    } catch (error) {
      alert("Order not found. Please check your code.");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      order_code: orderCode,
      amount: paymentData.amount,
      bank_ref_number: paymentData.bank_ref_number,
      receipt_pdf_url: paymentData.receipt_pdf_url
    };

    try {
      const res = await createPayment(payload);
      if (res.status === 201) {
        alert("Payment Submitted for Verification");
        fetchOrderHistory(orderCode); // Refresh list
        setPaymentData({ amount: "", bank_ref_number: "", receipt_pdf_url: "" });
      }
    } catch (err) {
      alert("Submission failed. Check your network or Reference Number.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">
        
        {!orderDetails ? (
          /* --- SEARCH VIEW --- */
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-zinc-50 dark:bg-zinc-900 p-10 rounded-3xl border dark:border-white/5 shadow-2xl">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-xl">
                  <HiOutlineTicket className="text-white -rotate-3" size={40} />
                </div>
                <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Track Order</h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mt-2">Enter your Hachalu Order Code</p>
              </div>

              <form onSubmit={handleTrack} className="space-y-4">
                <input 
                  type="text" required placeholder="HP-XXXXXXXX" value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                  className="w-full bg-white dark:bg-black border-2 border-gray-100 dark:border-white/5 focus:border-red-600 dark:text-white p-5 rounded-2xl outline-none transition-all font-black text-center uppercase"
                />
                <button disabled={isSearching} className="w-full bg-black dark:bg-white text-white dark:text-black font-black uppercase py-5 rounded-2xl tracking-widest text-xs hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all flex items-center justify-center gap-3">
                  {isSearching ? "Verifying..." : "Access Dashboard"}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* --- DASHBOARD VIEW --- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Status & Payments (Col 7) */}
            <div className="lg:col-span-7 space-y-6">
              <header className="flex justify-between items-center bg-black p-8 rounded-3xl text-white">
                <div>
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Active Order</p>
                  <h2 className="text-4xl font-black tracking-tighter">{orderCode}</h2>
                </div>
                <button onClick={() => setOrderDetails(null)} className="text-[10px] uppercase font-bold border-b border-white/20 pb-1">Exit</button>
              </header>

              {/* Payment History List */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border dark:border-white/5">
                <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                  <HiOutlineShieldCheck className="text-red-600" size={20}/> Payment History
                </h3>
                <div className="space-y-3">
                  {paymentsList.length > 0 ? paymentsList.map((pay) => (
                    <div 
                      key={pay.id}
                      onClick={() => setSelectedPayment(pay)}
                      className="group flex items-center justify-between p-4 bg-white dark:bg-black rounded-2xl border dark:border-white/5 cursor-pointer hover:border-red-600 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${pay.is_verified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          <HiOutlineCreditCard size={20}/>
                        </div>
                        <div>
                          <p className="text-xs font-black dark:text-white uppercase tracking-tight">ETB {pay.payment_amount}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest">{pay.bank_ref_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${pay.is_verified ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {pay.is_verified ? 'Verified' : 'Pending'}
                        </span>
                        <HiOutlineEye className="text-gray-300 group-hover:text-red-600" />
                      </div>
                    </div>
                  )) : (
                    <p className="text-center py-10 text-gray-400 text-[10px] uppercase tracking-widest">No payments recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Payment Submission Form (Col 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border dark:border-white/5 shadow-xl">
                <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-widest mb-6">Secure Payment Entry</h3>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount (ETB)</label>
                    <input 
                      type="number" required placeholder="0.00"
                      value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-black p-4 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 ring-red-600/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Reference / TXN ID</label>
                    <input 
                      type="text" required placeholder="e.g. FT231..."
                      value={paymentData.bank_ref_number} onChange={(e) => setPaymentData({...paymentData, bank_ref_number: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-black p-4 rounded-xl text-sm font-bold dark:text-white outline-none uppercase tracking-tighter"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Receipt URL (PDF/Image Link)</label>
                    <div className="relative">
                      <HiOutlineCloudArrowUp className="absolute right-4 top-4 text-gray-400" />
                      <input 
                        type="url" required placeholder="https://..."
                        value={paymentData.receipt_pdf_url} onChange={(e) => setPaymentData({...paymentData, receipt_pdf_url: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black p-4 rounded-xl text-[11px] font-medium dark:text-white outline-none italic"
                      />
                    </div>
                  </div>
                  <button className="w-full bg-red-600 text-white font-black uppercase py-5 rounded-2xl tracking-[0.2em] text-[10px] shadow-lg shadow-red-600/30 hover:bg-black transition-all">
                    Submit Payment Proof
                  </button>
                </form>
              </div>

              <div className="bg-red-600/5 p-6 rounded-2xl border border-red-600/10 flex gap-4">
                <HiOutlineInformationCircle className="text-red-600 shrink-0" size={24}/>
                <p className="text-[9px] text-red-800 dark:text-red-400 uppercase leading-relaxed font-bold tracking-widest">
                  Payments are verified manually by our finance team within 2-4 hours during business days.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPayment(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b dark:border-white/5 flex justify-between items-center">
                <h4 className="font-black uppercase tracking-tighter dark:text-white text-xl">Receipt Detail</h4>
                <button onClick={() => setSelectedPayment(null)}><HiOutlineXMark size={24} className="dark:text-white"/></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Transaction ID" value={selectedPayment.bank_ref_number} />
                  <DetailItem label="Amount Paid" value={`ETB ${selectedPayment.payment_amount}`} />
                  <DetailItem label="Status" value={selectedPayment.is_verified ? "Verified" : "Under Review"} highlight={selectedPayment.is_verified} />
                  <DetailItem label="Date" value={new Date(selectedPayment.created_at).toLocaleDateString()} />
                </div>
                <div className="pt-4">
                  <a 
                    href={selectedPayment.receipt_pdf_url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-zinc-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest dark:text-white hover:bg-red-600 hover:text-white transition-all"
                  >
                    View Attached Proof <HiOutlineEye size={18}/>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailItem = ({ label, value, highlight }) => (
  <div>
    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm font-bold uppercase tracking-tighter ${highlight ? 'text-green-600' : 'dark:text-white'}`}>{value}</p>
  </div>
);

export default Orders;