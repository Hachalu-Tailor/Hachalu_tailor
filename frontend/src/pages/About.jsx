import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  HiOutlineUserGroup, 
  HiOutlineGlobeEuropeAfrica, 
  HiOutlineHandRaised, 
  HiOutlineCheckBadge,
  HiChevronDown,
  HiOutlineScissors
} from 'react-icons/hi2';

import { IMAGES } from '../constants/images';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-500 overflow-x-hidden">
      
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.ABOUT.ABOUT01}
            className="w-full h-full object-cover grayscale opacity-40 dark:opacity-20"
            alt="Tailoring Atelier"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-[#080808]/50 dark:to-[#080808]" />
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.p 
            initial={{ opacity: 0, y: 10, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.6em" }}
            className="text-red-600 font-black uppercase text-xs mb-6"
          >
            {t('about.established')}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl md:text-[10rem] font-black text-black dark:text-white uppercase leading-none tracking-tighter"
          >
            {t('about.theHouse')}
          </motion.h1>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-400"
          >
            <HiChevronDown size={24} />
          </motion.div>
        </div>
      </section>

      {/* 2. OUR STORY (The Split Section) */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tight italic leading-tight">
              "We don't just stitch fabric; <br/> we architect confidence."
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
              Founded in the heart of Adama, Hachalu Protocol emerged from a desire to merge 
              traditional Ethiopian craftsmanship with the sharp, architectural silhouettes of modern global tailoring. 
              Our journey began in a small atelier with a single goal: to define the modern African luxury protocol.
            </p>
            <div className="flex flex-wrap gap-10 border-t border-gray-100 dark:border-white/5 pt-10">
              <Stat count="120+" label="Global Clients" />
              <Stat count="14" label="Master Tailors" />
              <Stat count="100%" label="Bespoke" />
            </div>
          </div>
          <div className="relative group">
            <div className="overflow-hidden rounded-sm">
              <img 
                src={IMAGES.ABOUT.ABOUT02}
                className="w-full aspect-square object-cover group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                alt="Craftsmanship"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-red-600 text-white p-8 hidden md:block shadow-xl">
               <p className="text-[10px] font-black tracking-widest uppercase">The Heritage Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUES */}
      <section className="bg-gray-50 dark:bg-[#0c0c0c] py-32 border-y border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="text-center mb-20">
            <h3 className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] mb-4">Our DNA</h3>
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tighter">THE CORE PROTOCOLS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ValueCard Icon={HiOutlineCheckBadge} title="Excellence" desc="Every buttonhole and lining is inspected by a Master Tailor." />
            <ValueCard Icon={HiOutlineGlobeEuropeAfrica} title="Global Soul" desc="Fusion of Italian wools and Ethiopian silks." />
            <ValueCard Icon={HiOutlineUserGroup} title="Community" desc="Investing in local apprenticeships for the art of tailoring." />
            <ValueCard Icon={HiOutlineHandRaised} title="Integrity" desc="Full transparency and ethical sourcing in our supply chain." />
          </div>
        </div>
      </section>

      {/* 4. FOUNDER'S NOTE */}
      <section className="py-40 px-6 lg:px-20 text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="w-24 h-0.5 bg-red-600 mx-auto" />
          <h2 className="text-3xl md:text-5xl font-light italic text-black dark:text-white leading-snug">
            "Clothing is the first language we speak to the world. Hachalu Protocol exists to ensure you never have to raise your voice to be heard."
          </h2>
          <div>
            <p className="text-black dark:text-white font-black uppercase tracking-[0.5em] text-xs">Lidetu Tesfaye</p>
            <p className="text-gray-400 uppercase tracking-widest text-[9px] mt-2">Co-Founder & Creative Developer</p>
          </div>
        </div>
      </section>

      {/* 5. UPDATED CINEMATIC WORKSHOP SECTION */}
{/* 5. UPDATED CINEMATIC WORKSHOP SECTION */}
<section className="relative w-full min-h-screen flex flex-col justify-between bg-gray-50 dark:bg-[#080808] transition-colors duration-700 overflow-hidden">
  
  {/* Background Image Layer */}
  <div className="absolute inset-0 z-0">
    <img 
      src={IMAGES.ABOUT.ABOUT03}
      className="w-full h-full object-cover dark:opacity-60 md:opacity-70 md:dark:opacity-70 transition-opacity duration-700"
      alt="Tailoring Workshop"
      onError={(e) => { e.target.src = IMAGES.ITEMS.PLACEHOLDER }}
    />
    
    {/* Multi-stage Overlays - Dynamic for Light/Dark */}
    {/* Top Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent dark:from-black" />
    
    {/* Bottom Gradient - Fades into the page background */}
    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent dark:from-[#080808]" />
  </div>

  {/* Top Text Layer: Title */}
  <div className="relative z-10 pt-32 pb-10 px-6 text-center">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-4 mb-4"
    >
      <div className="h-[1px] w-8 bg-red-600" />
      <p className="text-red-600 font-black uppercase text-xs md:text-sm tracking-[0.5em]">
        {t('Our Workshop')}
      </p>
      <div className="h-[1px] w-8 bg-red-600" />
    </motion.div>
  </div>

  {/* Bottom Description Layer: Experience Info */}
  <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-20 pb-20">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-end">
      
      {/* Block 1 */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        <HiOutlineScissors className="text-red-600" size={40} />
        <h3 className="text-black dark:text-white text-2xl font-black uppercase tracking-tight">The Cutting Table</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
          Every garment begins here. Our master cutters translate 32 unique body measurements into a paper pattern—the blueprint of your personal style.
        </p>
      </motion.div>

      {/* Block 2 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="hidden lg:block border-l border-gray-200 dark:border-white/10 pl-12 py-4"
      >
        <h3 className="text-black dark:text-white text-2xl font-black uppercase tracking-tight">Pure Precision</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          Hand-sewn lapels and functional buttonholes. We believe the details that go unseen are the ones that define luxury.
        </p>
      </motion.div>

      {/* Block 3 - The Highlight Box */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="bg-red-600 p-8 text-white rounded-sm md:ml-auto w-full max-w-sm shadow-2xl"
      >
        <p className="text-[10px] font-black tracking-widest uppercase mb-4 opacity-80">Workshop Location</p>
        <p className="text-lg font-bold">Adama, Oromia, Ethiopia</p>
        <p className="text-sm opacity-90 mt-2 font-medium">Available for private fittings and consultation by appointment.</p>
      </motion.div>

    </div>
  </div>
</section>

    </div>
  );
};

/* --- HELPER COMPONENTS --- */

const Stat = ({ count, label }) => (
  <div>
    <h4 className="text-3xl font-black text-black dark:text-white">{count}</h4>
    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">{label}</p>
  </div>
);

const ValueCard = ({ Icon, title, desc }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="bg-white dark:bg-white/5 p-10 border border-gray-100 dark:border-white/5 hover:border-red-600 transition-all group rounded-sm"
  >
    <Icon size={32} className="text-gray-300 group-hover:text-red-600 transition-colors mb-6" />
    <h4 className="text-black dark:text-white font-black uppercase text-sm tracking-widest mb-4">{title}</h4>
    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed uppercase tracking-tighter">{desc}</p>
  </motion.div>
);

export default About;