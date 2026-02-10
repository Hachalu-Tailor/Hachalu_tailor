import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

const Navbar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark for Hachalu theme
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [mobileAccordion, setMobileAccordion] = useState(null);
  
  const location = useLocation();

  // Mock User Session
  const user = { role: 'admin' }; 
  const isAdminOrReceptionist = user.role === 'admin' || user.role === 'receptionist';

  // 1. THEME INITIALIZATION & PERSISTENCE
  useEffect(() => {
    const savedTheme = localStorage.getItem('hachalu-theme');
    // Check if user has a preference or if system is dark
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hachalu-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hachalu-theme', 'light');
    }
  };

  // 2. SCROLL OPTIMIZATION
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 40;
      setScrolled(prev => prev !== isScrolled ? isScrolled : prev);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. CLEAN NAVIGATION HANDLER (Avoids setState cascading render errors)
  const handleLinkClick = useCallback(() => {
    setIsSidebarOpen(false);
    setActiveMenu(null);
    setMobileAccordion(null);
    window.scrollTo(0, 0); // Reset scroll on new page
  }, []);

  const menuItems = [
    { name: 'Home', href: '/' },
    { 
      name: 'Services', 
      href: '/services',
      subItems: [
        { title: 'we-offer', desc: 'What Hachalu Protocol Offer to You', icon: <HiOutlineShieldCheck />, href: '/services' },
        { title: 'Why Choose-Us', desc: 'Why Hachalu Protocol is the best choice for your needs.', icon: <HiOutlineGlobeAlt />, href: '/services/only-we' },
        { title: 'Discount', desc: 'We Had Great Discount For your tristy.', icon: <HiOutlineCpuChip />, href: '/services/discount' }
      ] 
    },
    { 
      name: 'Items', 
      href: '/items',
      subItems: [
        { title: 'Womens', desc: 'Hachalu Women\'s Collection', icon: <HiOutlineCpuChip />, href: '/products/womens' },
        { title: 'Mens', desc: 'Hachalu Men\'s Collection', icon: <HiOutlineCubeTransparent />, href: '/items/mens' },
        { title: 'All-in-one', desc: 'Zero-latency processing.', icon: <HiOutlineArrowRight />, href: '/items/edge' }
      ] 
    },
    { name: 'About', href: '/about' },
  ];

  return (
    <div className="w-full font-sans transition-colors duration-500">
      
      {/* TOP UTILITY BAR */}
      <div className={`bg-[#1a1a1a] dark:bg-black text-white/50 py-2 text-[10px] tracking-[0.3em] uppercase transition-all duration-300 ${scrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'} fixed top-0 w-full z-[110] hidden md:block`}>
        <div className="max-w-[1440px] mx-auto px-10 flex justify-between">
          <span>Hachalu Protocol Suite v2.0</span>
          <span>System Status: <span className="text-red-500 font-bold">Online</span></span>
        </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav 
        onMouseLeave={() => setActiveMenu(null)}
        className={`w-full z-[100] transition-all duration-500 
        ${scrolled 
          ? 'fixed top-0 left-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-2xl border-b border-red-600/20 py-2' 
          : 'relative bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/5 py-6 mt-0 md:mt-8'}`}
      >
        <div className="max-w-[1440px] mx-auto px-10 flex items-center justify-between">
          
          {/* LOGO */}
          <Link to="/" onClick={handleLinkClick} className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ rotate: 90, scale: 1.1 }}
              className="w-11 h-11 bg-grey-6 flex items-center justify-center rounded-br-2xl rounded-tl-2xl  group-hover:rounded-br-none transition-all duration-500"
            >
              {/* <span className="text-white font-black text-2xl">H</span> */}
              <img src={logo} alt="Hachalu Protocol Logo" className="w-8 h-8 ml-1" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-black dark:text-white font-black text-2xl tracking-tighter uppercase">Hachalu</span>
              <span className="text-red-600 font-bold text-[9px] tracking-[0.4em] -mt-1 uppercase">Protocol</span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden lg:flex items-center space-x-12 h-full">
            {menuItems.map((item) => (
              <div 
                key={item.name} 
                className="relative py-2"
                onMouseEnter={() => setActiveMenu(item.name)}
              >
                <Link 
                  to={item.href} 
                  onClick={handleLinkClick}
                  className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${location.pathname === item.href ? 'text-red-600' : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500'}`}
                >
                  {item.name}
                  {item.subItems && (
                    <HiChevronDown className={`transition-transform duration-300 ${activeMenu === item.name ? 'rotate-180' : ''}`} />
                  )}
                </Link>
                {location.pathname === item.href && (
                  <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600" />
                )}
              </div>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-6">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-yellow-400 transition-all shadow-inner"
            >
              {isDarkMode ? <HiSun size={20} /> : <HiMoon size={20} />}
            </motion.button>

            {isAdminOrReceptionist && (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/login" onClick={handleLinkClick} className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-6 py-3 uppercase tracking-widest shadow-lg shadow-red-600/20 transform transition hover:-translate-y-0.5">
                  Login
                </Link>
              </div>
            )}

            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-900 dark:text-white hover:scale-110 transition-transform">
              <HiMenuAlt3 size={30} />
            </button>
          </div>
        </div>

        {/* MEGA MENU (Framer Motion) */}
        <AnimatePresence>
          {activeMenu && menuItems.find(m => m.name === activeMenu)?.subItems && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 w-full bg-white dark:bg-[#0c0c0c] border-b border-red-600/20 shadow-2xl z-50 overflow-hidden"
            >
              <div className="max-w-[1440px] mx-auto px-10 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {menuItems.find(m => m.name === activeMenu).subItems.map((sub) => (
                    <Link 
                      key={sub.title} 
                      to={sub.href} 
                      onClick={handleLinkClick}
                      className="group/item flex flex-col gap-4 p-6 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-red-600/10"
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-red-600 text-white rounded-xl shadow-lg group-hover/item:scale-110 transition-transform">
                        <span className="text-2xl">{sub.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-tight flex items-center gap-2">
                          {sub.title}
                          <HiOutlineArrowRight className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all text-red-600" />
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 leading-relaxed">{sub.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[200]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white dark:bg-[#0a0a0a] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-red-600 font-black tracking-widest text-xl italic uppercase">Hachalu</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="text-gray-900 dark:text-white p-2 bg-gray-100 dark:bg-white/5 rounded-full"
                >
                  <HiX size={28} />
                </button>
              </div>

              <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {menuItems.map((item) => (
                  <div key={item.name} className="flex flex-col border-b border-gray-100 dark:border-white/5 pb-4">
                    <div 
                      className="flex justify-between items-center py-2 cursor-pointer group"
                      onClick={() => item.subItems ? setMobileAccordion(mobileAccordion === item.name ? null : item.name) : null}
                    >
                      {item.subItems ? (
                         <span className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{item.name}</span>
                      ) : (
                        <Link to={item.href} onClick={handleLinkClick} className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{item.name}</Link>
                      )}
                      {item.subItems && (
                        <HiChevronDown className={`dark:text-white transition-transform duration-300 ${mobileAccordion === item.name ? 'rotate-180' : ''}`} />
                      )}
                    </div>

                    <AnimatePresence>
                      {item.subItems && mobileAccordion === item.name && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className="grid gap-4 pl-4 border-l-2 border-red-600 mt-4 py-2">
                            {item.subItems.map((sub) => (
                              <Link key={sub.title} to={sub.href} onClick={handleLinkClick} className="flex items-center gap-3">
                                <span className="text-red-600">{sub.icon}</span>
                                <div className="text-sm font-bold dark:text-white uppercase">{sub.title}</div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <Link to="/login" onClick={handleLinkClick} className="block w-full py-4 bg-red-600 text-white font-black text-center uppercase text-xs tracking-widest rounded-sm">Login</Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;