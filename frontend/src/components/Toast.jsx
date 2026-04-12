import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXMark
} from 'react-icons/hi2';

// Toast Context
const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Types
const TOAST_TYPES = {
  success: {
    icon: HiOutlineCheckCircle,
    bgColor: 'bg-green-600',
    borderColor: 'border-green-500',
    iconColor: 'text-white',
    title: 'Success!',
  },
  error: {
    icon: HiOutlineXCircle,
    bgColor: 'bg-red-600',
    borderColor: 'border-red-500',
    iconColor: 'text-white',
    title: 'Error!',
  },
  warning: {
    icon: HiOutlineExclamationTriangle,
    bgColor: 'bg-yellow-600',
    borderColor: 'border-yellow-500',
    iconColor: 'text-white',
    title: 'Warning!',
  },
  info: {
    icon: HiOutlineInformationCircle,
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500',
    iconColor: 'text-white',
    title: 'Info',
  },
};

// Toast Component
const Toast = ({ id, type = 'info', message, duration = 5000, onRemove }) => {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-xl
        ${config.bgColor} ${config.borderColor}
        min-w-[320px] max-w-[450px]
      `}
    >
      <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={24} />
      <div className="flex-1">
        <p className="text-white font-bold text-sm">{config.title}</p>
        <p className="text-white/90 text-sm mt-0.5">{message}</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="text-white/70 hover:text-white transition-colors flex-shrink-0 p-1"
      >
        <HiOutlineXMark size={18} />
      </button>
    </motion.div>
  );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, options = {}) => addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', message, ...options }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default Toast;
