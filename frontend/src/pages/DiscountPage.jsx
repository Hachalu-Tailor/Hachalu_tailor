import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineTicket, 
  HiOutlineGift, 
  HiOutlineSparkles, 
  HiOutlineLockOpen,
  HiOutlineLockClosed,
  HiOutlineArrowRight,
  HiOutlineScissors
} from 'react-icons/hi2';

const DiscountPage = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 24, minutes: 0, seconds: 0 });

  // Simple Countdown Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] pt-32 pb-20 transition-colors duration-500 overflow-hidden">
      <div className="px-6 lg:px-12">
        
        {/* HERO SECTION */}
        <div className="text-center mb-20 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-red-600/10 text-red-600 px-4 py-2 rounded-full mb-6"
          >
            <HiOutlineSparkles className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exclusive Seasonal Access</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-[7rem] font-black dark:text-white uppercase tracking-tighter leading-none mb-6"
          >
            Private <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">Sale.</span>
          </motion.h1>
          
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed italic">
            "Quality is remembered long after the price is forgotten. But a legacy begins with an invitation."
          </p>
        </div>

        {/* MAIN INTERACTIVE OFFER CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          
          {/* LEFT: THE VIP UNLOCKER */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="lg:col-span-2 relative group rounded-[2.5rem] overflow-hidden bg-zinc-900 aspect-video lg:aspect-auto flex flex-col justify-center items-center text-center p-12 border border-white/5 shadow-2xl"
          >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none grayscale" 
                 style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')` }} />
            
            <AnimatePresence mode="wait">
              {isLocked ? (
                <motion.div 
                  key="locked"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative z-10 space-y-6"
                >
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center mx-auto mb-8 cursor-pointer hover:scale-110 transition-transform shadow-3xl"
                       onClick={() => setIsLocked(false)}>
                    <HiOutlineLockClosed className="text-white" size={40} />
                  </div>
                  <h3 className="text-white text-3xl font-black uppercase tracking-tighter">Unlock Your Personal Code</h3>
                  <p className="text-white/50 text-[10px] uppercase tracking-[0.4em]">Available for members only</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="unlocked"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 space-y-6"
                >
                  <div className="bg-red-600 text-white px-10 py-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 opacity-80">Your Unique Key</p>
                    <h2 className="text-5xl font-black tracking-widest">HACHALU-20</h2>
                  </div>
                  <p className="text-white font-bold uppercase tracking-widest text-xs">20% OFF ALL BESPOKE SUITS</p>
                  <button className="text-white/40 text-[9px] uppercase tracking-widest hover:text-white transition-colors" onClick={() => setIsLocked(true)}>Re-Lock Archive</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT: THE TICKING CLOCK */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-xl">
            <div>
              <HiOutlineTicket className="text-red-600 mb-6" size={32} />
              <h4 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Offer Expires In</h4>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-2">Limited tailoring slots remaining</p>
            </div>

            <div className="flex justify-between items-center py-10">
              <TimeBlock unit="Hrs" value={timeLeft.hours} />
              <span className="text-4xl font-black text-red-600">:</span>
              <TimeBlock unit="Min" value={timeLeft.minutes} />
              <span className="text-4xl font-black text-red-600">:</span>
              <TimeBlock unit="Sec" value={timeLeft.seconds} />
            </div>

            <button className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all">
              Claim Slot Now <HiOutlineArrowRight />
            </button>
          </div>
        </div>

        {/* TIERED OFFERS SECTION */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter shrink-0">Incentive Tiers</h2>
            <div className="h-[2px] w-full bg-gray-100 dark:bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TierCard 
              level="Essential" 
              save="10% OFF" 
              desc="Single Suit Commission" 
              perks={["Master Measurement", "Premium Wool", "Satin Lining"]}
            />
            <TierCard 
              level="Executive" 
              save="15% OFF" 
              desc="2+ Suit Commission" 
              featured 
              perks={["Free Silk Tie", "Custom Embroidery", "Express Delivery"]}
            />
            <TierCard 
              level="Heritage" 
              save="25% OFF" 
              desc="Wedding/Group Order" 
              perks={["Groomsmen Discount", "Personal Stylist", "Lifetime Adjustments"]}
            />
          </div>
        </div>

        {/* BRAND FOOTNOTE */}
        <div className="text-center py-10 border-t dark:border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.8em] text-gray-400">Hachalu Protocol • Shashemene • Ethiopia</p>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const TimeBlock = ({ unit, value }) => (
  <div className="text-center">
    <p className="text-4xl md:text-5xl font-black dark:text-white tracking-tighter">{String(value).padStart(2, '0')}</p>
    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">{unit}</p>
  </div>
);

const TierCard = ({ level, save, desc, perks, featured }) => (
  <div className={`p-8 rounded-3xl border transition-all duration-500 ${
    featured 
      ? 'bg-red-600 border-red-600 text-white shadow-2xl shadow-red-600/20 -translate-y-2' 
      : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-white/5 dark:text-white'
  }`}>
    <div className="flex justify-between items-start mb-6">
      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${featured ? 'text-white/80' : 'text-red-600'}`}>{level}</span>
      <HiOutlineScissors className={featured ? 'text-white/50' : 'text-gray-300'} size={24} />
    </div>
    <h3 className="text-4xl font-black uppercase tracking-tighter mb-2">{save}</h3>
    <p className={`text-xs font-bold uppercase mb-8 ${featured ? 'text-white/70' : 'text-gray-500'}`}>{desc}</p>
    
    <ul className="space-y-4 mb-8">
      {perks.map((p, i) => (
        <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
          <div className={`w-1.5 h-1.5 rounded-full ${featured ? 'bg-white' : 'bg-red-600'}`} />
          {p}
        </li>
      ))}
    </ul>

    <button className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
      featured ? 'bg-white text-black hover:bg-black hover:text-white' : 'bg-black text-white dark:bg-white dark:text-black dark:hover:bg-red-600 dark:hover:text-white'
    }`}>
      Select Plan
    </button>
  </div>
);

export default DiscountPage;