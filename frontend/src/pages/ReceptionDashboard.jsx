import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminReceptionSidebar from '../components/AdminReceptionSidebar';
import { 
  HiOutlineAdjustmentsHorizontal, HiOutlineInboxArrowDown, 
  HiOutlineArchiveBox, HiOutlinePaperAirplane, HiOutlineUserCircle,
  HiOutlineChevronRight, HiOutlineCamera, HiOutlineHashtag
} from 'react-icons/hi2';

const ReceptionDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // Detail Inspector State

  // MOCK DATA: Suits with Stock & Requirements
  const [inventory, setInventory] = useState([
    { id: 1, name: "Velvet Dinner Jacket", category: "Men", stock: 8, price: 1250, req: "Chest, Arm Length", img: "https://images.unsplash.com/photo-1594932224456-74a00e5728a5?q=80&w=500" },
    { id: 2, name: "Crepe Satin Blazer", category: "Women", stock: 3, price: 980, req: "Waist, Shoulder", img: "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=500" },
    { id: 3, name: "Pure Silk Kerebat", category: "Accessory", stock: 45, price: 150, req: "N/A", img: "https://images.unsplash.com/photo-1589756823851-411590f8863f?q=80&w=500" },
  ]);

  // High-End Suite Data
  const [suites, setSuites] = useState([
    { id: "S-001", name: "Midnight Peak Lapel", stock: 12, price: 899, status: "Ready", img: "https://i.ebayimg.com/images/g/81kAAeSwmlZowMqW/s-l1600.webp" },
    { id: "S-002", name: "Ivory Dinner Jacket", stock: 3, price: 950, status: "Low Stock", img: "https://image.kgstores.com/is/image/marketing/25-4666887-mens-suits-desktop.jpg" },
  ]);

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-[#050505] transition-colors duration-500">

        {/* MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* MOBILE HEADER */}
          <header className="lg:hidden p-4 bg-white dark:bg-[#0a0a0a] flex justify-between items-center border-b dark:border-white/5">
             <h2 className="font-black dark:text-white uppercase tracking-tighter">HP Protocol</h2>
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 dark:text-white">
                {darkMode ? '🌙' : '☀️'}
             </button>
          </header>

          {/* DASHBOARD CONTENT GRID */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* CENTER PANEL: List of items */}
            <section className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-2xl md:text-3xl font-black dark:text-white uppercase tracking-tighter">
                    {activeTab} <span className="text-red-600">Master</span>
                  </h1>
                  <div className="flex gap-2">
                    <button className="p-2 bg-white dark:bg-white/5 dark:text-white rounded-md border dark:border-white/10"><HiOutlineAdjustmentsHorizontal/></button>
                  </div>
                </div>

                {/* INVENTORY VIEW */}
                {activeTab === 'inventory' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suites.map(suite => (
                      <motion.div 
                        layoutId={suite.id}
                        onClick={() => setSelectedOrder(suite)}
                        key={suite.id} 
                        className="bg-white dark:bg-[#0d0d0d] p-4 rounded-xl border border-transparent hover:border-red-600/30 cursor-pointer group transition-all shadow-sm"
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                          <img src={suite.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[8px] text-white font-black uppercase rounded-sm">
                            SKU: {suite.id}
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <h3 className="text-xs font-black dark:text-white uppercase tracking-widest">{suite.name}</h3>
                            <p className="text-[10px] text-red-600 font-bold mt-1">${suite.price}</p>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${suite.stock < 5 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {suite.stock} in stock
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT PANEL: INSPECTOR (Visible on Desktop, Overlay on Mobile) */}
            <AnimatePresence>
              {selectedOrder && (
                <motion.aside 
                  initial={{ x: 400 }} 
                  animate={{ x: 0 }} 
                  exit={{ x: 400 }}
                  className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-[#0a0a0a] border-l dark:border-white/5 z-50 shadow-2xl p-8 overflow-y-auto"
                >
                  <button onClick={() => setSelectedOrder(null)} className="mb-8 p-2 bg-gray-100 dark:bg-white/5 dark:text-white rounded-full"><HiOutlineChevronRight size={20}/></button>
                  
                  <div className="space-y-8">
                    <img src={selectedOrder.img} className="w-full h-48 object-cover rounded-xl" alt="" />
                    
                    <div>
                      <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">{selectedOrder.name}</h2>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Management Profile</p>
                    </div>

                    {/* ACTIONS: Stock Management */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                         <ActionBtn icon={<HiOutlineArchiveBox/>} label="Update Stock" />
                         <ActionBtn icon={<HiOutlineCamera/>} label="View Receipt" />
                         <ActionBtn icon={<HiOutlinePaperAirplane/>} label="Send Response" />
                         <ActionBtn icon={<HiOutlineUserCircle/>} label="Client History" />
                      </div>
                    </div>

                    {/* ASSIGNMENT FORM */}
                    <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-xl space-y-4">
                       <h4 className="text-[10px] font-black dark:text-white uppercase">Assign to Order</h4>
                       <div className="relative">
                          <HiOutlineHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" placeholder="ENTER ORDER ID (e.g. #771)" className="w-full bg-white dark:bg-black/40 border dark:border-white/10 p-3 pl-10 text-[10px] font-black uppercase tracking-widest outline-none focus:border-red-600 dark:text-white" />
                       </div>
                       <button className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all">Link Product</button>
                    </div>
                  </div>
                </motion.aside>
              )}

              {/* --- CUSTOMER MESSAGING VIEW --- */}
              {activeTab === 'messages' && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-4xl mx-auto">
                   <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px]">
                      <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xs">SK</div>
                            <div>
                               <h4 className="text-sm font-black dark:text-white uppercase">Samuel Kassa</h4>
                               <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Order #HP-7712 Ready for Fitting</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                         <MessageBubble text="Hello Samuel, your Midnight Tuxedo is ready for the first fitting." sender="Atelier" />
                         <MessageBubble text="Great! Can I come at 4:00 PM today?" sender="Customer" />
                      </div>
                      <div className="p-6 bg-gray-50 dark:bg-white/5 flex gap-4">
                         <input placeholder="Type response to client..." className="flex-1 bg-transparent border-none text-sm font-bold dark:text-white outline-none" />
                         <button className="bg-red-600 text-white p-3 rounded-xl hover:scale-105 transition-transform"><HiOutlinePaperAirplane /></button>
                      </div>
                   </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

// Sub-component for Grid Action Buttons
const ActionBtn = ({ icon, label }) => (
  <button className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 rounded-lg hover:bg-red-600 hover:text-white transition-all group">
    <span className="text-gray-400 group-hover:text-white mb-2">{icon}</span>
    <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default ReceptionDashboard;