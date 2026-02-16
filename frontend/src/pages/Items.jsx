import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HiOutlineXMark, 
  HiArrowLongRight, 
  HiOutlineQueueList, 
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineScale
} from 'react-icons/hi2';
import { products } from '../hooks/productData';
import ItemCard from '../components/ItemCard';

const Items = ({ isHomePage = true }) => {
  const [filter, setFilter] = useState('All');
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'bespoke'

  // 1. Filter Logic
  const filteredProducts = filter === 'All' 
    ? products 
    : products.filter(p => p.category === filter);

  const activeItem = filteredProducts[activeIdx] || filteredProducts[0];

  // 2. Auto-play Logic
  useEffect(() => {
    if (isPaused || selectedItem || filteredProducts.length <= 1) return;
    
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % filteredProducts.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [isPaused, selectedItem, filteredProducts, activeIdx]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] pt-20 md:pt-28 pb-20 md:px-16 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <header>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] mb-2"
            >
              Hachalu Atelier • Private Collection
            </motion.p>
            <h2 className="text-4xl md:text-7xl font-black text-black dark:text-white uppercase tracking-tighter leading-none">
              The Gallery
            </h2>
          </header>

          {/* Classification Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-2">
            {['All', 'Men', 'Women', 'Children'].map((cat) => (
              <button
                key={cat}
                onClick={() => { setFilter(cat); setActiveIdx(0); }}
                className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-full border transition-all shrink-0 ${
                  filter === cat 
                  ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xl' 
                  : 'border-gray-200 dark:border-white/10 dark:text-white hover:border-red-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN INTERACTIVE LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-auto lg:h-[75vh]">
          
          {/* LEFT: CINEMATIC PREVIEW */}
          <div 
            className="flex-[2] relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-sm aspect-[4/5] lg:aspect-auto" 
            onMouseEnter={() => setIsPaused(true)} 
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem?.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                <img src={activeItem?.img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Preview Floating Content */}
            <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 flex flex-col md:flex-row justify-between items-end gap-6 z-10">
              <motion.div 
                key={activeItem?.id + "info"}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-xl"
              >
                <span className="bg-red-600 text-white text-[8px] font-bold px-3 py-1 uppercase tracking-widest mb-4 inline-block">
                  Ref: 00{activeItem?.id}
                </span>
                <h3 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight">
                  {activeItem?.name}
                </h3>
                <p className="text-white/60 text-xs md:text-sm mt-4 leading-relaxed line-clamp-2 md:line-clamp-none">
                  {activeItem?.desc}
                </p>
              </motion.div>
              
              <button 
                onClick={() => setSelectedItem(activeItem)}
                className="w-full md:w-auto bg-white text-black px-10 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform active:scale-95 shadow-2xl"
              >
                Customize Design
              </button>
            </div>
          </div>

          {/* RIGHT: SCROLLABLE LIST (Responsive) */}
          <div className="flex-1 w-full lg:max-w-[420px] flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2 px-1">
               <HiOutlineQueueList size={16} className="text-red-600"/> Discover {filter}
            </h4>
            
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:pr-2 h-full">
              {filteredProducts.map((item, idx) => (
                <div key={item.id} className="min-w-[280px] lg:min-w-full">
                  <ItemCard 
                    item={item} 
                    isActive={activeIdx === idx} 
                    onClick={() => setActiveIdx(idx)} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- BESPOKE MODAL / DRAWER --- */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-white dark:bg-[#0c0c0c] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex gap-4">
                  <TabBtn active={activeTab === 'details'} onClick={() => setActiveTab('details')} label="Overview" icon={<HiOutlineQueueList/>} />
                  <TabBtn active={activeTab === 'bespoke'} onClick={() => setActiveTab('bespoke')} label="Requirements" icon={<HiOutlineScale/>} />
                </div>
                <button onClick={() => setSelectedItem(null)} className="dark:text-white hover:text-red-600 transition-colors">
                  <HiOutlineXMark size={28}/>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <AnimatePresence mode="wait">
                  {activeTab === 'details' ? (
                    <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                       <div className="aspect-[4/5] rounded overflow-hidden">
                          <img src={selectedItem.img} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                          <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">{selectedItem.name}</h2>
                          <p className="text-red-600 font-bold text-2xl mt-2">{selectedItem.price}</p>
                          <p className="text-gray-500 dark:text-gray-400 mt-6 leading-relaxed text-lg italic">"{selectedItem.desc}"</p>
                       </div>
                       <button 
                        onClick={() => setActiveTab('bespoke')}
                        className="w-full py-6 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all"
                       >
                         Enter Requirements
                       </button>
                    </motion.div>
                  ) : (
                    <motion.div key="bespoke" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                       <header className="border-b dark:border-white/10 pb-6">
                          <h3 className="text-2xl font-black dark:text-white uppercase">Tailoring Brief</h3>
                          <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">Personalize your garment details below.</p>
                       </header>

                       <div className="grid grid-cols-2 gap-6">
                          <Input label="Chest (cm)" placeholder="00.0" />
                          <Input label="Waist (cm)" placeholder="00.0" />
                          <Input label="Shoulder (cm)" placeholder="00.0" />
                          <Input label="Height (cm)" placeholder="00.0" />
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest dark:text-gray-400 flex items-center gap-2">
                            <HiOutlineChatBubbleBottomCenterText size={16}/> Special Instructions
                          </label>
                          <textarea 
                            className="w-full bg-gray-50 dark:bg-white/5 p-6 dark:text-white outline-none focus:ring-1 ring-red-600 min-h-[150px] border-none text-sm leading-relaxed"
                            placeholder="e.g., Silk inner lining in emerald green, hidden pocket for timepiece, initials 'H.A' on cuff..."
                          />
                       </div>

                       <button className="w-full py-6 bg-red-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-black transition-all">
                         Submit Bespoke Request
                       </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const TabBtn = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
    }`}
  >
    {icon} {label}
  </button>
);

const Input = ({ label, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type="number" 
      placeholder={placeholder}
      className="bg-transparent border-b border-gray-200 dark:border-white/10 py-3 text-lg font-bold dark:text-white outline-none focus:border-red-600 transition-all"
    />
  </div>
);

export default Items;