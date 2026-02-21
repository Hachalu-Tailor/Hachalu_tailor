import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Import NavHashLink for smooth scrolling to #contact
import { NavHashLink } from 'react-router-hash-link';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  HiBars3BottomRight as HiMenuAlt3,
  HiXMark as HiX,
  HiChevronDown,
  HiSun,
  HiMoon,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
  HiOutlineCpuChip,
  HiOutlineCubeTransparent,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import logo from '../assets/logo.jpg';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [mobileAccordion, setMobileAccordion] = useState(null);

  const location = useLocation();

  const user = { role: 'admin' };
  const isAdminOrReceptionist = user.role === 'admin' || user.role === 'receptionist';

  // THEME LOGIC
  useEffect(() => {
    const savedTheme = localStorage.getItem('hachalu-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('hachalu-theme', newMode ? 'dark' : 'light');
  };

  // SCROLL LOGIC
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = useCallback((href) => {
    setIsSidebarOpen(false);
    setActiveMenu(null);
    setMobileAccordion(null);

    // Only scroll to top if NOT a hash link (like #contact)
    if (href && !href.includes('#')) {
      window.scrollTo(0, 0);
    }
  }, []);

  const menuItems = [
    { name: t('nav.home'), href: '/' },
    {
      name: t('nav.services'),
      href: '/services',
      subItems: [
        { title: t('nav.weOffer'), desc: t('nav.authorizedService'), icon: <HiOutlineShieldCheck />, href: '/services' },
        { title: t('nav.discount'), desc: t('nav.exclusiveLoyalty'), icon: <HiOutlineCpuChip />, href: '/services/discount' },
        { title: t('nav.needHelp'), desc: t('nav.customerSupport'), icon: <HiOutlineGlobeAlt />, href: '/#contact' },
      ]
    },
    {
      name: t('nav.shop'),
      href: '/items',
      subItems: [
        { title: t('nav.womens'), desc: t('nav.premierFemale'), icon: <HiOutlineCpuChip />, href: '/items/women' },
        { title: t('nav.mens'), desc: t('nav.advancedMale'), icon: <HiOutlineCubeTransparent />, href: '/items/men' },
        { title: t('nav.children'), desc: t('nav.qualityChildren'), icon: <HiOutlineArrowRight />, href: '/items/children' }
      ]
    },
    { name: t('nav.about'), href: '/about' },
    // { name: t('nav.myOrders'), href: '/my-orders' },
    { name: t('nav.submitPayment'), href: '/submit-payment' }
  ];

  return (
    <div className="w-full font-sans selection:bg-red-600/30">
      {/* TOP UTILITY */}
      <div className={`bg-[#0c0c0c] text-white/40 py-1.5 text-[9px] tracking-[0.3em] uppercase transition-all duration-500 hidden md:block ${scrolled ? 'opacity-0 -translate-y-full' : 'opacity-100'}`}>
        <div className="max-w-[1440px] mx-auto px-10 flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-2"><span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" /> {t('nav.globalNode')}</span>
            <span>{t('nav.uptime')}: 99.9%</span>
          </div>
          <span className="italic">Hachalu {t('nav.protocol')} v2.0.4</span>
        </div>
      </div>

      {/* MAIN NAV */}
      <nav
        onMouseLeave={() => setActiveMenu(null)}
        className={`w-full z-[100] transition-all duration-500 border-b ${scrolled
          ? 'fixed top-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-red-600/10 py-3 shadow-xl'
          : 'relative bg-white dark:bg-[#0a0a0a] border-gray-100 dark:border-white/5 py-6'
          }`}
      >
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between">

          <Link to="/" onClick={() => handleLinkClick('/')} className="flex items-center gap-3 group">
            <motion.div whileHover={{ scale: 1.05 }} className="relative">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg shadow-lg group-hover:shadow-red-600/20 transition-all" />
              <div className="absolute -inset-1 bg-red-600/20 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
            </motion.div>
            <div className="flex flex-col text-left">
              <span className="text-black dark:text-white font-black text-2xl tracking-tighter uppercase leading-none">Hachalu</span>
              <span className="text-red-600 font-bold text-[8px] tracking-[0.5em] uppercase">Protocol</span>
            </div>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden lg:flex items-center space-x-10">
            {menuItems.map((item) => (
              <div
                key={item.name}
                className="relative py-2"
                onMouseEnter={() => setActiveMenu(item.name)}
              >
                <Link
                  to={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${location.pathname === item.href ? 'text-red-600' : 'text-gray-500 dark:text-gray-400 hover:text-red-600'
                    }`}
                >
                  {item.name}
                  {item.subItems && <HiChevronDown size={14} className={`transition-transform ${activeMenu === item.name ? 'rotate-180' : ''}`} />}
                </Link>
                {location.pathname === item.href && (
                  <motion.div layoutId="nav-pill" className="absolute -bottom-1 left-0 w-full h-[2px] bg-red-600" />
                )}
              </div>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-yellow-500 border border-transparent hover:border-red-600/20 transition-all">
              {isDarkMode ? <HiSun size={18} /> : <HiMoon size={18} />}
            </button>
            <LanguageSwitcher className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white border border-transparent hover:border-red-600/20 transition-all" />

            {isAdminOrReceptionist && (
              <Link to="/login" className="hidden md:block bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-6 py-2.5 uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                Access Hub
              </Link>
            )}

            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-900 dark:text-white">
              <HiMenuAlt3 size={28} />
            </button>
          </div>
        </div>

        {/* MEGA MENU (DESKTOP) */}
        <AnimatePresence>
          {activeMenu && menuItems.find(m => m.name === activeMenu)?.subItems && (
            <motion.div
              initial={{ height: 0, opacity: 0, filter: 'blur(10px)' }}
              animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
              exit={{ height: 0, opacity: 0, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="absolute left-0 w-full bg-white dark:bg-[#0c0c0c] border-b border-red-600/10 shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-50 overflow-hidden"
            >
              <div className="max-w-[1440px] mx-auto px-10 py-12 grid grid-cols-4 gap-12 text-left">
                <div className="col-span-1 border-r border-gray-100 dark:border-white/5">
                  <h3 className="text-red-600 font-black text-3xl uppercase italic tracking-tighter mb-4">{activeMenu}</h3>
                  <p className="text-[11px] text-gray-400 uppercase tracking-widest leading-loose max-w-[200px]">
                    Authorized neural access for the {activeMenu.toLowerCase()} environment. Select your next operation.
                  </p>
                </div>

                <div className="col-span-3 grid grid-cols-3 gap-6">
                  {menuItems.find(m => m.name === activeMenu).subItems.map((sub, i) => (
                    <motion.div
                      key={sub.title}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {/* USING NavHashLink HERE */}
                      <NavHashLink
                        smooth
                        to={sub.href}
                        onClick={() => handleLinkClick(sub.href)}
                        className="group/item flex flex-col gap-4 p-5 rounded-2xl hover:bg-red-600/5 dark:hover:bg-white/5 transition-all border border-transparent hover:border-red-600/10"
                      >
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl group-hover/item:bg-red-600 group-hover/item:text-white transition-all duration-300">
                          {sub.icon}
                        </div>
                        <div>
                          <h4 className="text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest flex items-center justify-between">
                            {sub.title}
                            <HiOutlineArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all text-red-600" />
                          </h4>
                          <p className="text-gray-400 text-[10px] mt-2 leading-relaxed text-left">{sub.desc}</p>
                        </div>
                      </NavHashLink>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[85%] bg-white dark:bg-[#0c0c0c] z-[210] p-10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.2)]"
            >
              <div className="flex justify-between items-center mb-16">
                <div className="flex flex-col text-left">
                  <span className="text-black dark:text-white font-black text-2xl uppercase tracking-tighter leading-none">Hachalu</span>
                  <span className="text-red-600 font-bold text-[8px] tracking-[0.5em] uppercase">Protocol</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full dark:text-white"><HiX size={24} /></button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto text-left">
                {menuItems.map((item) => (
                  <div key={item.name} className="border-b border-gray-100 dark:border-white/5 pb-4">
                    <div className="flex justify-between items-center py-2" onClick={() => item.subItems && setMobileAccordion(mobileAccordion === item.name ? null : item.name)}>
                      {item.subItems ? (
                        <span className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{item.name}</span>
                      ) : (
                        <Link to={item.href} onClick={() => handleLinkClick(item.href)} className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{item.name}</Link>
                      )}
                      {item.subItems && <HiChevronDown className={`transition-transform duration-300 dark:text-white ${mobileAccordion === item.name ? 'rotate-180' : ''}`} />}
                    </div>
                    <AnimatePresence>
                      {item.subItems && mobileAccordion === item.name && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-gray-50 dark:bg-white/5 rounded-xl mt-2">
                          <div className="p-4 grid gap-4">
                            {item.subItems.map((sub) => (
                              <NavHashLink
                                smooth
                                key={sub.title}
                                to={sub.href}
                                onClick={() => handleLinkClick(sub.href)}
                                className="flex items-center gap-3 group"
                              >
                                <span className="p-2 bg-white dark:bg-black rounded-lg text-red-600">{sub.icon}</span>
                                <span className="text-xs font-bold dark:text-white uppercase tracking-widest">{sub.title}</span>
                              </NavHashLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="pt-8">
                <Link to="/login" onClick={() => handleLinkClick('/login')} className="block w-full py-4 bg-red-600 text-white font-black text-center uppercase text-xs tracking-[.2em]">Hub Authentication</Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;