import React from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlineGlobeEuropeAfrica, HiOutlineHandRaised, HiOutlineCheckBadge } from 'react-icons/hi2';

const About = () => {
  return (
  <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-500 overflow-x-hidden">

    {/* 1. CINEMATIC HERO SECTION */}
    <section className="relative h-screen flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1520923179278-ee25e25e09e4?q=80&w=1471"
          className="w-full h-full object-cover grayscale opacity-40 dark:opacity-20"
          alt="Tailoring Atelier"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/50 to-white dark:via-brand dark:to-brand-dark]" />
      </div>

      <div className="relative z-10 text-center px-6">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          animate={{ opacity: 1, letterSpacing: "0.6em" }}
          className="text-red-600 font-black uppercase text-xs mb-6"
        >
          Established
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="text-7xl md:text-[10rem] font-black text-black dark:text-white uppercase leading-none tracking-tighter"
        >
          The House
        </motion.h1>
      </div>
    </section>

    {/* 2. OUR STORY (The Split Section) */}
    <section className="max-w-360 mx-auto px-6 lg:px-20 py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-8">
          <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tight italic">
            "We don't just stitch fabric; we architect confidence."
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            Founded in the heart of Adama(Nazerit), Hachalu Protocol emerged from a desire to merge
            traditional Ethiopian craftsmanship with the sharp, architectural silhouettes of modern global tailoring.
            Our journey began in a small atelier with a single goal: to define the modern African luxury protocol.
          </p>
          <div className="flex gap-10 border-t border-gray-100 dark:border-white/5 pt-10">
            <Stat count="120+" label="Global Clients" />
            <Stat count="14" label="Master Tailors" />
            <Stat count="100%" label="Bespoke" />
          </div>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=1470"
            className="w-full aspect-square object-cover grayscale hover:grayscale-0 transition-all duration-1000 rounded-sm"
            alt="Craftsmanship"
          />
          <div className="absolute -bottom-10 -left-10 bg-red-600 text-white p-10 hidden md:block">
            <p className="text-xs font-black tracking-widest uppercase">The Heritage Guarantee</p>
          </div>
        </div>
      </div>
    </section>

    {/* 3. CORE VALUES (The Interaction Section) */}
    <section className="bg-gray-50 dark:bg-[#0c0c0c] py-32">
      <div className="max-w-360 mx-auto px-6 lg:px-20">
        <div className="text-center mb-20">
          <h3 className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] mb-4">Our DNA</h3>
          <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tighter">THE CORE PROTOCOLS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <ValueCard
            Icon={HiOutlineCheckBadge}
            title="Excellence"
            desc="Every buttonhole, every stitch, every lining is inspected by a Master Tailor."
          />
          <ValueCard
            Icon={HiOutlineGlobeEuropeAfrica}
            title="Global Soul"
            desc="Sourcing the finest Italian wools and Ethiopian silks for a unique fusion."
          />
          <ValueCard
            Icon={HiOutlineUserGroup}
            title="Community"
            desc="Investing in local apprenticeships to keep the art of tailoring alive."
          />
          <ValueCard
            Icon={HiOutlineHandRaised}
            title="Integrity"
            desc="Full transparency in our supply chain. Ethical sourcing is our baseline."
          />
        </div>
      </div>
    </section>

    {/* 4. FOUNDER'S NOTE (The Mood Maker) */}
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

  </div>
  );
};

/* --- HELPER COMPONENTS --- */

const Stat = ({ count, label }) => (
  <div>
    <h4 className="text-2xl font-black text-black dark:text-white">{count}</h4>
    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{label}</p>
  </div>
);

const ValueCard = ({ Icon, title, desc }) => (
  <motion.div
    whileHover={{ y: -10 }}
    className="bg-white dark:bg-white/5 p-10 border border-gray-100 dark:border-white/5 hover:border-red-600 transition-all group"
  >
    <Icon size={32} className="text-gray-300 group-hover:text-red-600 transition-colors mb-6" />
    <h4 className="text-black dark:text-white font-black uppercase text-sm tracking-widest mb-4">{title}</h4>
    <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed uppercase tracking-tighter">{desc}</p>
  </motion.div>
);

export default About;