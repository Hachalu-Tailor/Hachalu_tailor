import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineSquares2X2,
    HiOutlineChatBubbleLeftEllipsis,
    HiOutlineUser,
    HiOutlineCheckCircle,
    HiOutlineTruck,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineXMark,
    HiOutlineScissors,
    HiOutlineCalendarDays,
    HiOutlineClipboardDocumentList
} from 'react-icons/hi2';
import { useLanguage } from '../context/LanguageContext';
import { getHexColor } from '../utils/colors';

const GarmentSidebar = ({
    darkMode,
    setDarkMode,
    isOpen,
    setIsOpen,
    completedOrders = [],
    onOrderClick,
    isLoadingOrders = false
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) setDarkMode(savedTheme === 'dark');
    }, [location.pathname, setDarkMode]);

    const toggleTheme = () => {
        const newTheme = !darkMode;
        setDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const menuItems = [
        { path: '/garment', label: t('dashboard') || 'Dashboard', icon: <HiOutlineSquares2X2 /> },
        { path: '/garment/messages', label: t('messages') || 'Messages', icon: <HiOutlineChatBubbleLeftEllipsis /> },
        { path: '/garment/profile', label: t('profile') || 'Profile', icon: <HiOutlineUser /> },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    x: isOpen ? 0 : '-100%',
                    width: isCollapsed ? 80 : 320
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed left-0 top-0 h-full z-[210] flex flex-col
          ${darkMode
                        ? 'bg-[#0a0a0a] border-r border-white/5'
                        : 'bg-white border-r border-gray-100'
                    }
          ${isOpen ? 'w-80' : 'lg:w-80 lg:translate-x-0'}
          -translate-x-full lg:relative
        `}
            >
                {/* Header */}
                <div className={`p-6 flex items-center justify-between border-b ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                            <HiOutlineScissors className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className={`text-lg font-black uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Garment
                            </h2>
                            <span className="text-[8px] font-bold text-red-600 uppercase tracking-[0.3em]">
                                Workshop
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                    >
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <div className="p-4">
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-3 px-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Menu
                    </p>
                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                        : `${darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
                                    }`
                                }
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Completed Orders Section */}
                <div className={`flex-1 overflow-y-auto p-4 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Completed Orders
                        </p>
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[9px] font-bold uppercase rounded-full">
                            {completedOrders.length}
                        </span>
                    </div>

                    {isLoadingOrders ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-16 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                                </div>
                            ))}
                        </div>
                    ) : completedOrders.length === 0 ? (
                        <div className={`text-center py-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                                <HiOutlineCheckCircle className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-medium">No completed orders</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {completedOrders.slice(0, 10).map((order) => (
                                <motion.button
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => onOrderClick && onOrderClick(order)}
                                    className={`w-full p-3 rounded-xl text-left transition-all ${darkMode
                                            ? 'bg-white/5 hover:bg-white/10 border border-white/5'
                                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {order.order_code}
                                        </span>
                                        <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                    <p className={`text-[10px] truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {order.customer_name || 'Unknown'}
                                    </p>
                                    {order.suit_type && (
                                        <div className="flex items-center gap-2 mt-2">
                                            {order.selected_color && (
                                                <div
                                                    className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                                                    style={{ backgroundColor: getHexColor(order.selected_color) || '#666' }}
                                                />
                                            )}
                                            <span className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {order.suit_type}
                                            </span>
                                        </div>
                                    )}
                                    {order.completed_date && (
                                        <p className={`text-[8px] mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {formatDate(order.completed_date)}
                                        </p>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${darkMode
                                ? 'bg-white/5 hover:bg-white/10 text-yellow-500'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                    >
                        {darkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default GarmentSidebar;
