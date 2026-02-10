import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineXMark, HiOutlineChevronRight, HiOutlineChevronLeft, HiArrowLongRight } from 'react-icons/hi2';

const products = [
  { 
    id: 1, 
    category: "Men",
    name: "Midnight Peak Lapel", 
    price: "ETB8999", 
    desc: "Super 120s Italian wool, hand-finished lapels.",
    img: "https://i.ebayimg.com/images/g/81kAAeSwmlZowMqW/s-l1600.webp" 
  },
  { 
    id: 2, 
    category: "Women",
    name: "Signature Power Suit", 
    price: "ETB11000", 
    desc: "Sculpted shoulders and tapered waist for a commanding silhouette.",
    img: "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1374" 
  },
  { 
    id: 3, 
    category: "Kerebat",
    name: "Silk Crimson Tie", 
    price: "ETB1200", 
    desc: "100% Mulberry silk, jacquard woven in Ethiopia.",
    img: "https://i.ebayimg.com/images/g/orsAAOSwMi1mpUjb/s-l1600.webp" 
  },
  { 
    id: 4, 
    category: "Men",
    name: "Ivory Dinner Jacket", 
    price: "ETB9500", 
    desc: "Double-breasted excellence for galas and exclusive events.",
    img: "https://image.kgstores.com/is/image/marketing/25-4666887-mens-suits-desktop.jpg" 
  },
  { 
    id: 5, 
    category: "Men",
    name: "Midnight Peak Lapel", 
    price: "ETB8999", 
    desc: "Super 120s Italian wool, hand-finished lapels.",
    img: "https://i.ebayimg.com/images/g/81kAAeSwmlZowMqW/s-l1600.webp" 
  },
  { 
    id: 6, 
    category: "Women",
    name: "Signature Power Suit", 
    price: "ETB11000", 
    desc: "Sculpted shoulders and tapered waist for a commanding silhouette.",
    img: "https://images.unsplash.com/photo-1617113930975-f9c7243ae527?q=80&w=1374" 
  },
  { 
    id: 7, 
    category: "Kerebat",
    name: "Silk Crimson Tie", 
    price: "ETB1200", 
    desc: "100% Mulberry silk, jacquard woven in Ethiopia.",
    img: "https://i.ebayimg.com/images/g/orsAAOSwMi1mpUjb/s-l1600.webp" 
  },
  { 
    id: 8, 
    category: "Men",
    name: "Ivory Dinner Jacket", 
    price: "ETB9500", 
    desc: "Double-breasted excellence for galas and exclusive events.",
    img: "https://image.kgstores.com/is/image/marketing/25-4666887-mens-suits-desktop.jpg" 
  }
];

const Items = ({ isHomePage = true }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Logic for Mobile Slider
  const nextMobile = () => setMobileIndex((prev) => (prev + 1) % products.length);
  const prevMobile = () => setMobileIndex((prev) => (prev - 1 + products.length) % products.length);

  return (
    <div className="min-h-[80vh] bg-white dark:bg-[#0a0a0a] pt-20 px-6 lg:px-16 pb-20 transition-colors duration-500">
      <div className="max-w-[1440px] mx-auto">
        
        {/* HEADER AREA */}
        <div className="flex justify-between items-end mb-12">
          <header>
            <span className="text-red-600 font-black tracking-[0.5em] uppercase text-[10px]">Hachalu Atelier</span>
            <h2 className="text-4xl md:text-6xl font-black text-black dark:text-white uppercase tracking-tighter mt-2">The Collection</h2>
          </header>

          {/* View All Button for Desktop (only shows if on home) */}
          {isHomePage && (
            <Link to="/items" className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-600 transition-colors group">
              View Full Inventory <HiArrowLongRight className="group-hover:translate-x-2 transition-transform" size={20}/>
            </Link>
          )}
        </div>

        {/* --- MOBILE VIEW: CINEMATIC SLIDER --- */}
        <div className="md:hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full"
              onClick={() => setSelectedItem(products[mobileIndex])}
            >
              <ProductCard product={products[mobileIndex]} />
            </motion.div>
          </AnimatePresence>

          {/* Mobile Controls */}
          <div className="flex justify-between mt-6">
            <button onClick={prevMobile} className="p-4 bg-gray-100 dark:bg-white/5 dark:text-white">
              <HiOutlineChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2">
               {products.map((_, i) => (
                 <div key={i} className={`h-1 transition-all ${mobileIndex === i ? 'w-8 bg-red-600' : 'w-2 bg-gray-300'}`} />
               ))}
            </div>
            <button onClick={nextMobile} className="p-4 bg-gray-100 dark:bg-white/5 dark:text-white">
              <HiOutlineChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* --- DESKTOP VIEW: GRID --- */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} onClick={() => setSelectedItem(product)}>
               <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* --- BESPOKE MODAL (Reuse your existing logic) --- */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              className="relative w-full max-w-xl h-full bg-white dark:bg-[#0f0f0f] p-10 md:p-16 overflow-y-auto"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 dark:text-white"><HiOutlineXMark size={30}/></button>
              <h2 className="text-3xl font-black uppercase dark:text-white">{selectedItem.name}</h2>
              <p className="text-gray-500 my-6 text-sm">{selectedItem.desc}</p>
              
              <div className="space-y-8 mt-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest dark:text-white border-b border-gray-100 dark:border-white/5 pb-2">Measurement Profile</h4>
                <div className="grid grid-cols-2 gap-6">
                  <MeasurementField label="Shoulder (cm)" />
                  <MeasurementField label="Chest (cm)" />
                  <MeasurementField label="Waist (cm)" />
                  <MeasurementField label="Height (cm)" />
                </div>
                <div className="mt-12">
                    <h4 className="text-black dark:text-white font-black uppercase text-xs tracking-widest mb-4">Special Requirements</h4>
                    <textarea 
                      placeholder="e.g. Inner pocket for phone, specific lining color..."
                      className="w-full bg-gray-50 dark:bg-white/5 border-none p-4 text-xs font-bold tracking-widest outline-none focus:ring-1 ring-red-600 min-h-[100px] dark:text-white"
                    />
                  </div>
                <button className="w-full bg-red-600 text-white py-5 font-black uppercase tracking-widest text-xs mt-10 hover:bg-black transition-colors">
                  Submit Requirements
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-Component for individual card
const ProductCard = ({ product }) => (
  <div className="group cursor-pointer">
    <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-zinc-900 mb-6 relative">
      <img src={product.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" alt="" />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-widest">Tailor Me</span>
      </div>
    </div>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-black dark:text-white font-black uppercase text-[11px] tracking-widest">{product.name}</h3>
        <p className="text-gray-400 text-[9px] mt-1 uppercase font-bold tracking-tighter">{product.category}</p>
      </div>
      <p className="text-red-600 font-black text-sm">{product.price}</p>
    </div>
  </div>
);

const MeasurementField = ({ label }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[9px] uppercase font-bold text-gray-400">{label}</label>
    <input type="number" className="bg-transparent border-b border-gray-200 dark:border-white/10 py-2 outline-none focus:border-red-600 dark:text-white text-sm" placeholder="0.0" />
  </div>
);

export default Items;