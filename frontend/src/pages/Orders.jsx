import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineTicket, 
  HiOutlineTruck, 
  HiOutlineCheckCircle, 
  HiOutlineCreditCard, 
  HiOutlineClock,
  HiOutlineCloudArrowUp,
  HiOutlineInformationCircle
} from 'react-icons/hi2';

const Orders = () => {
  const [orderId, setOrderId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [fileName, setFileName] = useState('');

  // Simulated search action
  const handleTrack = (e) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate a 1.5s delay to make it feel like a real database search
    setTimeout(() => {
      setIsSearching(false);
      setShowResult(true);
    }, 1500);
  };

  const handleUpload = (e) => {
    if (e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handlePaymentConfirm = (e) => {
    e.preventDefault();
    setPaymentSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-5xl mx-auto">
        
        {/* TOP STATUS MESSAGES */}
        <AnimatePresence>
          {!showResult && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center gap-3 bg-red-50 dark:bg-red-900/10 p-4 border border-red-100 dark:border-red-900/20 rounded-lg"
            >
              <HiOutlineInformationCircle className="text-red-600 shrink-0" size={20} />
              <p className="text-[10px] md:text-xs text-red-800 dark:text-red-400 font-medium uppercase tracking-wider">
                Note: This is a tracking simulation. Use any ID (e.g., <span className="font-black underline">ETH-7721</span>) to see the dashboard.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!showResult ? (
          /* --- SEARCH VIEW --- */
          <div className="flex flex-col items-center justify-center py-10 md:py-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-gray-50 dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/20">
                  <HiOutlineTicket className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Order Tracking</h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2">Enter your unique receipt number</p>
              </div>

              <form onSubmit={handleTrack} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    placeholder="ENTER ORDER ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                    className="w-full bg-white dark:bg-black border-2 border-transparent focus:border-red-600 dark:text-white p-5 rounded-xl outline-none transition-all font-black tracking-widest text-center uppercase shadow-inner"
                  />
                </div>
                <button 
                  disabled={isSearching}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-black uppercase py-5 rounded-xl tracking-[0.2em] text-xs hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSearching ? (
                    <>Searching <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-t-transparent border-current rounded-full" /></>
                  ) : "Locate My Order"}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* --- TRACKING DASHBOARD --- */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: Main Progress */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-black text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">In Tailoring</span>
                      <h2 className="text-4xl font-black mt-4 uppercase tracking-tighter tracking-widest">{orderId || "ETH-7721"}</h2>
                    </div>
                    <button onClick={() => setShowResult(false)} className="text-[10px] font-black uppercase underline decoration-red-600 underline-offset-4">Change ID</button>
                  </div>
                  
                  <div className="mt-10">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                      <span>Progress</span>
                      <span>65%</span>
                    </div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: '65%' }} 
                        className="h-full bg-red-600" 
                      />
                    </div>
                  </div>
                </div>
                <HiOutlineTruck className="absolute -bottom-10 -right-10 text-white/5" size={250} />
              </div>

              {/* Progress Steps List */}
              <div className="bg-gray-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-widest mb-8">Timeline</h3>
                <div className="space-y-8">
                  <TrackStep status="done" title="Order Received" time="Feb 10, 2026" />
                  <TrackStep status="done" title="Payment Confirmed" time="Feb 11, 2026" />
                  <TrackStep status="active" title="Fabric Cutting & Tailoring" time="In Progress" />
                  <TrackStep status="pending" title="Quality Inspection" time="Waiting" />
                  <TrackStep status="pending" title="Ready for Collection" time="Waiting" />
                </div>
              </div>
            </div>

            {/* Right: Payment & Summary */}
            <div className="space-y-6">
              {/* Payment Box */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <HiOutlineCreditCard className="text-red-600" size={24} />
                  <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-widest">Payment Status</h3>
                </div>

                {paymentSubmitted ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                    <HiOutlineCheckCircle className="text-green-500 mx-auto mb-2" size={40} />
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Proof Submitted</p>
                    <p className="text-gray-400 text-[9px] mt-1 italic">Awaiting reception review...</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handlePaymentConfirm} className="space-y-4">
                    <p className="text-gray-500 text-[10px] leading-relaxed uppercase tracking-widest mb-4">
                      Upload your bank screenshot or enter transaction ID to verify your order.
                    </p>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                      <HiOutlineCloudArrowUp className="text-gray-400 mb-2" size={28} />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{fileName || "Click to upload file"}</span>
                      <input type="file" className="hidden" onChange={handleUpload} />
                    </label>
                    <input 
                      type="text" 
                      placeholder="OR ENTER TRANS-ID"
                      className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 p-4 rounded-xl text-[10px] font-bold outline-none focus:border-red-600 dark:text-white uppercase tracking-widest"
                    />
                    <button className="w-full bg-red-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all">
                      Confirm Payment
                    </button>
                  </form>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-zinc-900/30 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                <h4 className="text-black dark:text-white font-black uppercase text-[10px] tracking-widest mb-4">Item Details</h4>
                <div className="flex gap-4">
                  <img src="https://i.ebayimg.com/images/g/5RcAAOSwZc5k2eQ4/s-l1600.webp" className="w-16 h-20 object-cover rounded-lg" alt="" />
                  <div>
                    <p className="text-black dark:text-white font-black uppercase text-[10px] leading-tight">Midnight Peak Lapel</p>
                    <p className="text-red-600 font-bold text-xs mt-1">ETB 18,500</p>
                    <p className="text-gray-500 text-[9px] mt-2 uppercase">Qty: 1 | Size: Custom</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Sub-component for Timeline Steps
const TrackStep = ({ status, title, time }) => (
  <div className="flex gap-6 relative">
    <div className="flex flex-col items-center">
      <div className={`w-4 h-4 rounded-full border-2 z-10 ${
        status === 'done' ? 'bg-red-600 border-red-600' : 
        status === 'active' ? 'bg-white border-red-600 animate-pulse' : 
        'bg-gray-200 border-gray-200 dark:bg-zinc-800 dark:border-zinc-800'
      }`} />
      <div className="w-[2px] h-full bg-gray-100 dark:bg-white/5 absolute top-4" />
    </div>
    <div className="pb-2">
      <h4 className={`text-[11px] font-black uppercase tracking-widest ${status === 'pending' ? 'text-gray-400' : 'text-black dark:text-white'}`}>
        {title}
      </h4>
      <p className="text-[9px] text-gray-500 uppercase mt-1 flex items-center gap-1">
        <HiOutlineClock size={12} /> {time}
      </p>
    </div>
  </div>
);

export default Orders;