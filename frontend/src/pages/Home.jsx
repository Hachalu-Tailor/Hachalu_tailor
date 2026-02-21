import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag, HiChevronRight, HiChevronLeft, HiOutlineArrowLongRight } from 'react-icons/hi2';
import { products } from '../hooks/productData';
import Contact from './Contact';
import { IMAGES } from '../constants/images';

const suits = [
  {
    id: 1,
    title: "Midnight Peak Lapel",
    price: "ETB 18,500",
    image: IMAGES.UI.HERO01,
    desc: "Precision cut tailored wool for the modern executive."
  },
  {
    id: 2,
    title: "Charcoal 3-Piece",
    price: "ETB 21,000",
    image: IMAGES.UI.HERO02,
    desc: "Heritage weaving meets contemporary architectural fit."
  },
  {
    id: 3,
    title: "Arctic White Tuxedo",
    image: "https://image.made-in-china.com/2f0j00kKQlobaGJcqp/OEM-Suits-Suits-Work-Clothes-Company-Formal-Suits-for-Men-and-Women.webp",
    desc: "A bold statement piece for the most exclusive evening events."
  }
];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

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
      
      {/* HERO SECTION - REORDERED FOR MOBILE */}
      <section 
        className="relative min-h-screen flex flex-col lg:flex-row-reverse items-stretch"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* IMAGE AREA - TOP ON MOBILE, FULL WIDTH */}
        <div className="w-full lg:w-1/2 h-[55vh] lg:h-screen relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 group cursor-pointer" onClick={() => navigate('/items')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={suits[index].id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1, ease: "circOut" }}
              className="absolute inset-0 flex items-center justify-center p-0 m-0"
            >
              <img
                src={suits[index].image}
                // object-contain ensures the WHOLE image is seen without cutting
                // w-full h-full ensures it takes the entire block
                className="w-full h-full object-contain lg:object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000"
                alt={suits[index].title}
              />
              
              {/* Overlay description (Desktop only for cleanliness) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                <p className="text-white font-black uppercase tracking-[0.2em] text-xs mb-2">Heritage Protocol</p>
                <p className="text-gray-300 text-sm italic max-w-sm">{suits[index].desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* PROGRESS DOTS - REPOSITIONED */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:left-10 lg:translate-x-0 flex gap-2 z-30">
            {suits.map((_, i) => (
              <button 
                key={i} 
                onClick={(e) => { e.stopPropagation(); setIndex(i); }} 
                className={`h-1 transition-all duration-500 rounded-full ${index === i ? "w-12 bg-red-600" : "w-3 bg-black/20 dark:bg-white/20"}`} 
              />
            ))}
          </div>
        </div>

        {/* TEXT CONTENT - BOTTOM ON MOBILE */}
        <div className="w-full lg:w-1/2 px-6 py-12 md:px-12 lg:px-24 flex flex-col justify-center bg-white dark:bg-[#080808] z-10">
          <div className="relative min-h-[250px] lg:min-h-[350px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="lg:absolute w-full"
              >
                <span className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px]">Collection 2026</span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black dark:text-white mt-4 leading-[0.85] uppercase tracking-tighter">
                  {suits[index].title.split(' ')[0]} <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
                    {suits[index].title.split(' ').slice(1).join(' ')}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-6 max-w-md text-sm md:text-base font-medium leading-relaxed">
                  {suits[index].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 items-center">
            <button 
              onClick={() => navigate('/items')}
              className="bg-black dark:bg-white dark:text-black text-white px-8 py-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all active:scale-95"
            >
              Explore Collection <HiOutlineShoppingBag size={18} />
            </button>
            <div className="flex gap-1">
              <button onClick={prevSlide} className="p-4 border border-gray-100 dark:border-white/5 dark:text-white hover:text-red-600 transition-all"><HiChevronLeft size={20}/></button>
              <button onClick={nextSlide} className="p-4 border border-gray-100 dark:border-white/5 dark:text-white hover:text-red-600 transition-all"><HiChevronRight size={20}/></button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE STRIP - NO UNWANTED PADDING */}
      <section className="bg-zinc-50 dark:bg-[#0c0c0c] border-y border-gray-100 dark:border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
           <FeatureCard title="Ethiopian Craft" desc="Hand-stitched in Adama." />
           <FeatureCard title="Bespoke Fit" desc="32 Unique body measurements." />
           <FeatureCard title="Shipping" desc="Global Luxury Delivery." />
        </div>
      </section>

      {/* PRODUCT GRID PREVIEW */}
      <section className="pt-18 px-6 md:px-12 lg:px-24 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
          <div className="w-full">
            <span className="text-red-600 font-black tracking-[0.3em] uppercase text-[10px]">The Atelier</span>
            <h2 className="text-4xl md:text-5xl font-black dark:text-white uppercase tracking-tighter mt-1">Ready to Wear</h2>
          </div>
          <Link to="/items" className="whitespace-nowrap text-black dark:text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-red-600 transition-colors">
            All Items <HiOutlineArrowLongRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} navigate={navigate} />
          ))}
        </div>
      </section>

      <section id='contact' className='px-0'>
        <Contact />
      </section>
    </div>
  );
};

/* --- MINI COMPONENTS --- */

const FeatureCard = ({ title, desc }) => (
  <div className="flex flex-col items-center md:items-start text-center md:text-left p-4">
    <div className="h-0.5 w-12 bg-red-600 mb-4" />
    <h3 className="text-black dark:text-white font-black uppercase text-[11px] tracking-widest">{title}</h3>
    <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-2 uppercase tracking-tighter">{desc}</p>
  </div>
);

const ProductCard = ({ product, navigate }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={() => navigate('/items')}
    className="group cursor-pointer w-full"
  >
    <div className="aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-4 relative rounded-sm">
      <img src={product.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
        <span className="bg-white text-black px-4 py-2 text-[9px] font-black uppercase tracking-widest">Select</span>
      </div>
    </div>
    <div className="flex flex-col gap-1 px-1">
      <h3 className="text-black dark:text-white font-black uppercase text-xs truncate">{product.name}</h3>
      <p className="text-gray-400 text-[9px] uppercase font-bold tracking-widest">{product.category}</p>
    </div>
  </motion.div>
);

export default Home;