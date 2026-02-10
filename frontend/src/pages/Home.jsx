import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiChevronRight, HiChevronLeft } from 'react-icons/hi2';
import Items from './Items';

const suits = [
  {
    id: 1,
    title: "Midnight Peak Lapel",
    price: "$899",
    image: "https://i.ebayimg.com/images/g/5RcAAOSwZc5k2eQ4/s-l1600.webp",
    desc: "Precision cut tailored wool for the modern executive."
  },
  {
    id: 2,
    title: "Charcoal 3-Piece",
    price: "$1,200",
    image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1480&auto=format&fit=crop",
    desc: "Heritage weaving meets contemporary architectural fit."
  },
  {
    id: 3,
    title: "Arctic White Tuxedo",
    price: "$1,450",
    image: "https://image.made-in-china.com/2f0j00kKQlobaGJcqp/OEM-Suits-Suits-Work-Clothes-Company-Formal-Suits-for-Men-and-Women.webp",
    desc: "A bold statement piece for the most exclusive evening events."
  }
];

const Home = () => {
  const [index, setIndex] = useState(0);

  // Global auto-play for synced transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % suits.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setIndex((prev) => (prev + 1) % suits.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + suits.length) % suits.length);

  return (
    <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-500 overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col lg:flex-row items-center">
        
        {/* LEFT CONTENT (TEXT) */}
        <div className="w-full lg:w-1/2 px-10 lg:px-24 z-10 pt-20">
          <div className="relative h-100 flex flex-col justify-center">
            {/* ONLY this part animates */}
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="absolute"
              >
                <span className="text-red-600 font-black tracking-[0.4em] uppercase text-xs">New Collection 2026</span>
                <h3 className="text-6xl lg:text-8xl font-black text-black dark:text-white mt-4 leading-tight uppercase tracking-tighter">
                  {suits[index].title.split(' ')[0]} <br /> 
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-red-600 to-red-400">
                    {suits[index].title.split(' ').slice(2).join(' ')}
                  </span>
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-6 max-w-md text-lg italic">
                  "{suits[index].desc || "Crafted for the elite."}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* STATIC BUTTONS (These never move or re-render) */}
          <div className="mt-2 flex gap-6 items-center">
            <Link 
              to="/items" 
              className="bg-black dark:bg-white dark:text-black text-white px-10 py-5 font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-2xl"
            >
              Shop Collection <HiOutlineShoppingBag size={18} />
            </Link>
            
            <div className="flex gap-2">
              <button onClick={prevSlide} className="p-4 border border-gray-200 dark:border-white/10 dark:text-white hover:bg-red-600 hover:text-white transition-all">
                <HiChevronLeft />
              </button>
              <button onClick={nextSlide} className="p-4 border border-gray-200 dark:border-white/10 dark:text-white hover:bg-red-600 hover:text-white transition-all">
                <HiChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE AREA (AUTO-PLAYING) */}
        <div className="w-full lg:w-1/2 h-[60vh] lg:h-full relative overflow-hidden bg-gray-100 dark:bg-zinc-900 group">
          <AnimatePresence mode="wait">
            <motion.img
              key={suits[index].id}
              src={suits[index].image}
              initial={{ opacity: 0, scale: 1.1, filter: "grayscale(100%)" }}
              animate={{ opacity: 1, scale: 1, filter: "grayscale(20%)" }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover group-hover:grayscale-0 transition-all duration-1000"
              alt="Luxury Suit"
            />
          </AnimatePresence>

          {/* HOVER DESCRIPTION (Bottom Reveal) */}
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-18 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
             <p className="text-white text-sm tracking-widest uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity delay-200">
               {suits[index].desc} — Available in Bespoke Sizes
             </p>
          </div>

          {/* DOT NAVIGATION */}
          <div className="absolute bottom-10 left-10 flex gap-4 z-30">
            {suits.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`transition-all duration-700 h-1 ${
                  index === i ? "w-20 bg-red-600" : "w-6 bg-white/30 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="py-24 bg-gray-50 dark:bg-[#0c0c0c] border-y border-gray-100 dark:border-white/5">
        <div className="max-w-360 mx-auto px-10 grid grid-cols-1 md:grid-cols-3 gap-16">
           <FeatureCard title="Ethiopian Craft" desc="Every stitch represents a century of heritage." />
           <FeatureCard title="Bespoke Fit" desc="Tailored to your exact anatomical dimensions." />
           <FeatureCard title="Global Presence" desc="Shipping to major fashion capitals worldwide." />
        </div>
      </section>
      <Items />
    </div>
  );
};

const FeatureCard = ({ title, desc }) => (
  <div className="group">
    <div className="h-px w-full bg-gray-200 dark:bg-white/10 mb-8 overflow-hidden">
        <div className="h-full bg-red-600 w-0 group-hover:w-full transition-all duration-700" />
    </div>
    <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-[0.3em] mb-4">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-xs leading-loose uppercase tracking-widest">{desc}</p>
  </div>
);

export default Home;