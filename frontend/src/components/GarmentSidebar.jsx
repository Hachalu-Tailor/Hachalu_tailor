import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineSquares2X2,
    HiOutlineChatBubbleLeftEllipsis,
    HiOutlineUser,
    HiOutlineCheckCircle,
    HiOutlineLockClosed,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineXMark,
    HiOutlineScissors,
    HiOutlineCalendarDays,
    HiOutlineClipboardDocumentList,
    HiOutlineArrowRightOnRectangle
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
    isLoadingOrders = false,
    onLogout
}) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

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
        { path: '/garment/orders', label: t('orders') || 'Orders', icon: <HiOutlineClipboardDocumentList /> },
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
            <aside
                className={`fixed left-0 top-0 h-full z-[210] flex flex-col w-72 sm:w-80
          ${darkMode
                        ? 'bg-[#0a0a0a] border-r border-white/5'
                        : 'bg-white border-r border-gray-100'
                    }
          translate-x-0
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
                                end={item.path === '/garment'}
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

                {/* Footer */}
                <div className={`p-4 border-t mt-auto ${darkMode ? 'border-white/5' : 'border-gray-100'} space-y-2`}>
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
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white"
                        >
                            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {t('logout') || 'Logout'}
                            </span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default GarmentSidebar;
