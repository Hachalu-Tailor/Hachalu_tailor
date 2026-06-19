import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShoppingBag, HiChevronRight, HiChevronLeft, HiOutlineArrowLongRight } from 'react-icons/hi2';
import { getMaterials, getSuitTypes } from '../api/api';
import Contact from './Contact';
import { IMAGES } from '../constants/images';

const BACKEND_BASE = import.meta.env.PROD
  ? 'https://hachalu-tailor.onrender.com'
  : 'http://127.0.0.1:8000';

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const suits = [
  {
    id: 1,
    title: "Executive Navy Classic",
    collection: "Men's Collection",
    image: IMAGES.UI.HERO01,
    desc: "Precision-cut premium wool suit designed for modern professionals. Perfect for office wear, business meetings, and formal occasions."
  },
  {
    id: 2,
    title: "Prestige Charcoal Set",
    collection: "Men's Premium",
    image: IMAGES.UI.HERO02,
    desc: "A luxury three-piece suit crafted with heritage weaving and a contemporary fit. Ideal for executives, grooms, and high-level events."
  },
  {
    id: 3,
    title: "Family Ceremony Set",
    collection: "Group Package",
    image: IMAGES.UI.HERO03,
    desc: "Matching tailored suits for family members. Custom measurements, coordinated colors, and exclusive package discounts."
  },
  {
    id: 4,
    title: "Arctic White Wedding",
    collection: "Ceremony 2026",
    image: IMAGES.UI.HERO04,
    desc: "A bold and refined tuxedo tailored for weddings and exclusive celebrations. Designed to make you stand out with confidence."
  },
  {
    id: 5,
    title: "University Classic",
    collection: "Student Edition",
    image: IMAGES.UI.HERO05, // Added fallback image logic
    desc: "Specially tailored for university students. Affordable, stylish, and professionally fitted with budget-friendly pricing."
  },
];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      setLoading(true);
      const [materialsRes] = await Promise.all([
        getMaterials()
      ]);

      // Handle paginated responses
      let materials = materialsRes.data;
      if (materials && typeof materials === 'object' && !Array.isArray(materials)) {
        materials = materials.results || materials.data || materials.items || [];
      }

      // Create featured items from materials
      const featured = (materials || []).slice(0, 5).map((material, idx) => ({
        id: material.id,
        title: material.name || 'Custom Suit',
        collection: material.category || 'Premium Collection',
        image: resolveImageUrl(material.suit_sample_image) || resolveImageUrl(material.material_image) || material.image_url || Object.values(IMAGES.UI)[idx % 5 + 1],
        desc: material.description || `Premium ${material.texture || ''} fabric tailored to perfection.`
      }));

      setFeaturedItems(featured);
    } catch (error) {
      console.error('Error fetching featured items:', error);
    } finally {
      setLoading(false);
    }
  };

  const suits = featuredItems.length > 0 ? featuredItems : [
    { id: 1, title: "Executive Navy Classic", collection: "Men's Collection", image: IMAGES.UI.HERO01, desc: "Precision-cut premium wool suit." },
    { id: 2, title: "Prestige Charcoal Set", collection: "Men's Premium", image: IMAGES.UI.HERO02, desc: "A luxury three-piece suit." },
    { id: 3, title: "Family Ceremony Set", collection: "Group Package", image: IMAGES.UI.HERO03, desc: "Matching tailored suits." },
    { id: 4, title: "Arctic White Wedding", collection: "Ceremony 2026", image: IMAGES.UI.HERO04, desc: "A bold tuxedo for weddings." },
    { id: 5, title: "University Classic", collection: "Student Edition", image: IMAGES.UI.HERO05, desc: "For university students." }
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % suits.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, suits.length]);

  const nextSlide = () => setIndex((prev) => (prev + 1) % suits.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + suits.length) % suits.length);

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-500 overflow-x-hidden">

      {/* HERO SECTION */}
      <section
        className="relative min-h-[90vh] lg:h-screen flex flex-col lg:flex-row-reverse items-stretch overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* LARGE BACKGROUND GHOST TEXT - OVERFLOW EFFECT */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full pointer-events-none z-0 hidden lg:block">
          <AnimatePresence mode="wait">
            <motion.h2
              key={index}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 0.03, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 1 }}
              className="text-[25vw] font-black uppercase whitespace-nowrap dark:text-white leading-none"
            >
              {suits[index].title.split(' ')[0]}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* IMAGE AREA */}
        <div className="w-full lg:w-1/2 min-h-[50vh] lg:h-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 group cursor-pointer" onClick={() => navigate('/items')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={suits[index].id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={suits[index].image}
                className="w-full h-full min-w-full min-h-full object-cover object-center grayscale-[15%] group-hover:grayscale-0 transition-all duration-1000"
                alt={suits[index].title}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-white/10 dark:from-black/10 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* PROGRESS INDICATOR */}
          <div className="absolute bottom-6 left-6 lg:left-12 flex items-center gap-4 z-30">
            <span className="text-[10px] font-black dark:text-white transition-all">0{index + 1}</span>
            <div className="w-32 h-[2px] bg-black/10 dark:bg-white/10 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((index + 1) / suits.length) * 100}%` }}
                className="absolute top-0 left-0 h-full bg-red-600"
              />
            </div>
            <span className="text-[10px] font-black text-gray-400">0{suits.length}</span>
          </div>
        </div>

        {/* TEXT CONTENT */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-20 py-8 relative z-10 bg-white dark:bg-[#080808]">
          <div className="max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-[2px] bg-red-600" />
                  <span className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px]">
                    {suits[index].collection}
                  </span>
                </div>

                <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-black text-black dark:text-white leading-[0.9] uppercase tracking-tighter mb-8">
                  {suits[index].title.split(' ').slice(0, 2).join(' ')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
                    {suits[index].title.split(' ').slice(2).join(' ')}
                  </span>
                </h1>

                <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm md:text-base font-medium leading-relaxed border-l-2 border-gray-100 dark:border-white/5 pl-6">
                  {suits[index].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => navigate('/items')}
                className="group relative overflow-hidden bg-black dark:bg-white text-white dark:text-black px-8 py-3 sm:px-10 sm:py-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:text-white transition-colors"
              >
                <span className="relative z-10">Explore A TAILOR</span>
                <HiOutlineShoppingBag size={18} className="relative z-10" />
                <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>

              <div className="flex items-center gap-2">
                <NavBtn onClick={prevSlide} icon={<HiChevronLeft size={20} />} />
                <NavBtn onClick={nextSlide} icon={<HiChevronRight size={20} />} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="bg-zinc-50 dark:bg-[#0c0c0c] border-y border-gray-100 dark:border-white/5 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard title="Ethiopian Craft" desc="Hand-stitched precision in Shashemene." />
          <FeatureCard title="Bespoke Fit" desc="32 Unique body measurements per suit." />
          <FeatureCard title="Global Logistics" desc="Luxury delivery to your doorstep." />
        </div>
      </section>

      {/* PRODUCT GRID PREVIEW */}
      <section className="pt-16 px-4 sm:px-6 md:px-12 lg:px-24 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="w-full">
            <span className="text-red-600 font-black tracking-[0.3em] uppercase text-[10px]">The Collection</span>
            <h2 className="text-4xl md:text-6xl font-black dark:text-white uppercase tracking-tighter mt-2">Signature Pieces</h2>
          </div>
          <Link to="/items" className="group whitespace-nowrap text-black dark:text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
            View All <HiOutlineArrowLongRight size={22} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {suits.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={{ ...product, price: product.desc, img: product.image, name: product.title, category: product.collection }} navigate={navigate} />
          ))}
        </div>
      </section>

      <section id='contact'>
        <Contact />
      </section>
    </div>
  );
};

/* --- MINI COMPONENTS --- */

const NavBtn = ({ onClick, icon }) => (
  <button
    onClick={onClick}
    className="w-14 h-14 flex items-center justify-center border border-gray-200 dark:border-white/10 dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:scale-90"
  >
    {icon}
  </button>
);

const FeatureCard = ({ title, desc }) => (
  <div className="group flex flex-col items-center md:items-start text-center md:text-left">
    <div className="h-[1px] w-8 bg-red-600 mb-4 group-hover:w-16 transition-all duration-500" />
    <h3 className="text-black dark:text-white font-black uppercase text-[11px] tracking-widest">{title}</h3>
    <p className="text-gray-400 text-[10px] mt-2 uppercase tracking-tight">{desc}</p>
  </div>
);

const ProductCard = ({ product, navigate }) => (
  <motion.div
    whileHover={{ y: -10 }}
    onClick={() => navigate('/items')}
    className="group cursor-pointer w-full"
  >
    {/* 1. Changed object-cover to object-contain to show the full image.
      2. Added p-4 (padding) so the full image doesn't touch the very edges, looking more like a gallery.
      3. Kept aspect-[3/4] for a consistent grid, but the image will now fit entirely inside it.
    */}
    <div className="aspect-[3/4] overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 mb-6 relative border border-transparent group-hover:border-gray-100 dark:group-hover:border-white/5 transition-all duration-500 rounded-sm">
      <img
        src={product.img}
        className="w-full h-full object-contain p-2 transition-all duration-700"
        alt={product.name}
      />

      {/* Interactive Overlay */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-8 backdrop-blur-[1px]">
        <motion.span
          initial={{ y: 10, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          className="bg-white text-black px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl"
        >
          View Details
        </motion.span>
      </div>

      {/* Availability indicator if needed */}
      <div className="absolute top-4 left-4">
        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
      </div>
    </div>

    {/* Text Details */}
    <div className="flex justify-between items-start px-1">
      <div className="max-w-[80%]">
        <h3 className="text-black dark:text-white font-black uppercase text-xs tracking-tight truncate">
          {product.name}
        </h3>
        <p className="text-gray-400 text-[9px] uppercase font-bold tracking-[0.2em] mt-1.5">
          {product.category}
        </p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-red-600 font-black text-[10px] uppercase tracking-tighter">
          Exclusive
        </span>
      </div>
    </div>
  </motion.div>
);

export default Home;