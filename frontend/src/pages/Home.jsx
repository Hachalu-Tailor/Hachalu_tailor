import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag, HiChevronRight, HiChevronLeft, HiOutlineArrowLongRight } from 'react-icons/hi2';
import { products } from '../hooks/productData';
import Contact from './Contact';

const suits = [
  {
    id: 1,
    title: "Midnight Peak Lapel",
    price: "ETB 18,500",
    image: "https://i.ebayimg.com/images/g/5RcAAOSwZc5k2eQ4/s-l1600.webp",
    desc: "Precision cut tailored wool for the modern executive."
  },
  {
    id: 2,
    title: "Charcoal 3-Piece",
    price: "ETB 21,000",
    image: "https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1480&auto=format&fit=crop",
    desc: "Heritage weaving meets contemporary architectural fit."
  },
  {
    id: 3,
    title: "Arctic White Tuxedo",
    price: "ETB 24,500",
    image: "https://image.made-in-china.com/2f0j00kKQlobaGJcqp/OEM-Suits-Suits-Work-Clothes-Company-Formal-Suits-for-Men-and-Women.webp",
    desc: "A bold statement piece for the most exclusive evening events."
  }
];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  // Integrated Auto-play with Pause on Hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % suits.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const nextSlide = () => setIndex((prev) => (prev + 1) % suits.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + suits.length) % suits.length);

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-500 overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section 
        className="relative h-screen flex flex-col lg:flex-row items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* TEXT CONTENT */}
        <div className="w-full lg:w-1/2 px-6 md:px-10 lg:px-24 z-10 flex flex-col justify-center h-full pt-20">
          <div className="relative h-80 lg:h-96">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute w-full"
              >
                <span className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] md:text-xs">New Collection 2026</span>
                <h3 className="text-5xl md:text-7xl lg:text-8xl font-black text-black dark:text-white mt-4 leading-[0.9] uppercase tracking-tighter">
                  {suits[index].title.split(' ')[0]} <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                    {suits[index].title.split(' ').slice(1).join(' ')}
                  </span>
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-6 max-w-sm text-sm md:text-lg italic leading-relaxed">
                  "{suits[index].desc}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 md:mt-12 flex flex-wrap gap-4 items-center">
            <button 
              onClick={() => navigate('/items')}
              className="bg-black dark:bg-white dark:text-black text-white px-8 py-4 md:px-10 md:py-5 font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-3 hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-2xl active:scale-95"
            >
              Shop Collection <HiOutlineShoppingBag size={18} />
            </button>
            <div className="flex gap-2">
              <button onClick={prevSlide} className="p-4 border border-gray-200 dark:border-white/10 dark:text-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"><HiChevronLeft /></button>
              <button onClick={nextSlide} className="p-4 border border-gray-200 dark:border-white/10 dark:text-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"><HiChevronRight /></button>
            </div>
          </div>
        </div>

        {/* IMAGE AREA */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-full relative overflow-hidden bg-gray-100 dark:bg-zinc-900 group cursor-pointer" onClick={() => navigate('/items')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={suits[index].id}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <img
                src={suits[index].image}
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000"
                alt="Luxury Suit"
              />
              {/* Dynamic Bottom Description Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                <p className="text-white font-black uppercase tracking-[0.2em] text-xs mb-2">Exclusive Piece</p>
                <p className="text-gray-300 text-sm italic max-w-sm">{suits[index].desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* PROGRESS DOTS */}
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex gap-3 z-30">
            {suits.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setIndex(i); }} 
                className={`h-1 transition-all duration-700 rounded-full ${index === i ? "w-16 md:w-24 bg-red-600" : "w-4 md:w-8 bg-white/30"}`} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="py-20 bg-gray-50 dark:bg-[#0c0c0c] border-y border-gray-100 dark:border-white/5">
        <div className="w-full px-6 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-12">
           <FeatureCard title="Ethiopian Craft" desc="Hand-stitched excellence from the heart of Addis." />
           <FeatureCard title="Bespoke Fit" desc="Custom measurements for a truly personal silhouette." />
           <FeatureCard title="Global Shipping" desc="Luxury delivery to major fashion capitals." />
        </div>
      </section>

      {/* PRODUCT GRID PREVIEW */}
      <section className="py-24 px-6 md:px-10 lg:px-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div>
            <span className="text-red-600 font-black tracking-[0.3em] uppercase text-[10px]">Ready to Wear</span>
            <h2 className="text-4xl md:text-5xl font-black dark:text-white uppercase tracking-tighter mt-2">New Arrivals</h2>
          </div>
          <Link to="/items" className="text-black dark:text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-red-600 transition-colors">
            View All Collection <HiOutlineArrowLongRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} navigate={navigate} />
          ))}
        </div>
      </section>
      <Contact />

    </div>
  );
};

const FeatureCard = ({ title, desc }) => (
  <div className="group">
    <div className="h-[2px] w-full bg-gray-200 dark:bg-white/10 mb-6 overflow-hidden">
        <div className="h-full bg-red-600 w-0 group-hover:w-full transition-all duration-700" />
    </div>
    <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-[0.2em] mb-3">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed uppercase tracking-widest">{desc}</p>
  </div>
);

const ProductCard = ({ product, navigate }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    onClick={() => navigate('/items')}
    className="group cursor-pointer"
  >
    <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-zinc-900 mb-6 relative rounded-sm">
      <img src={product.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" alt={product.name} />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
        <span className="bg-white text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest shadow-2xl">View Details</span>
      </div>
    </div>
    <div className="flex justify-between items-start px-1">
      <div>
        <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-tighter">{product.name}</h3>
        <p className="text-gray-400 text-[9px] mt-1 uppercase font-bold tracking-widest">{product.category}</p>
      </div>
      <p className="text-red-600 font-black text-sm">{product.price}</p>
    </div>
  </motion.div>
);

export default Home;