import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineCheckBadge
} from 'react-icons/hi2';
import api from '../api/api';
import { formatRelativeTime } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

// Get icon based on notification type
const getNotificationIcon = (type) => {
  const normalizedType = type?.toLowerCase() || '';
  switch (normalizedType) {
    case 'order':
    case 'order_created':
    case 'order_update':
    case 'order_rejected':
    case 'order_expired':
      return HiOutlineShoppingBag;
    case 'payment':
    case 'payment_submitted':
    case 'payment_approved':
    case 'payment_rejected':
      return HiOutlineCurrencyDollar;
    case 'inventory':
    case 'inventory_low':
    case 'inventory_updated':
      return HiOutlineCube;
    case 'system':
    case 'general':
      return HiOutlineCheckBadge;
    case 'staff':
    case 'staff_created':
    case 'user':
      return HiOutlineUsers;
    default:
      return HiOutlineBell;
  }
};

// Get color based on notification type
const getNotificationColor = (type) => {
  const normalizedType = type?.toLowerCase() || '';
  switch (normalizedType) {
    case 'order':
    case 'order_created':
    case 'order_update':
      return { bg: 'bg-blue-500/10', icon: 'text-blue-500', border: 'border-blue-500/20' };
    case 'payment':
    case 'payment_submitted':
    case 'payment_approved':
      return { bg: 'bg-green-500/10', icon: 'text-green-500', border: 'border-green-500/20' };
    case 'inventory':
      return { bg: 'bg-yellow-500/10', icon: 'text-yellow-500', border: 'border-yellow-500/20' };
    case 'system':
    case 'general':
      return { bg: 'bg-purple-500/10', icon: 'text-purple-500', border: 'border-purple-500/20' };
    default:
      return { bg: 'bg-gray-500/10', icon: 'text-gray-500', border: 'border-gray-500/20' };
  }
};

const Notifications = ({ userRole = 'receptionist' }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/accounts/user/notifications/', { params: { limit: 50 } });
      let data = response.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.results || data.data || data.items || [];
      }
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark single notification as complete - REMOVE from list completely
  const handleMarkAsRead = (notificationId) => {
    // Remove notification completely from list when marked as complete
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Mark all as complete - REMOVE ALL from list
  const handleMarkAllRead = () => {
    // Remove all notifications completely when marked as complete
    setNotifications([]);
  };

  // Delete notification (local only)
  const handleDelete = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Handle notification click - mark as read and navigate
  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id);
    
    const notifType = String(notification.notification_type || notification.type || '').toLowerCase().trim();
    
    if (notifType === 'order_created' || notifType === 'order_update' || notifType === 'order') {
      navigate(userRole === 'garment' ? '/garment/orders' : '/reception/orders');
    } else if (notifType === 'payment_submitted' || notifType === 'payment') {
      navigate('/reception/payments');
    } else if (notifType === 'inventory') {
      navigate('/reception/inventory');
    } else if (notifType === 'staff' || notifType === 'user' || notifType === 'staff_created') {
      navigate('/admin/staff');
    } else {
      navigate(userRole === 'admin' ? '/admin' : userRole === 'garment' ? '/garment' : '/reception');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading notifications...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Notifications
          </h2>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.notification_type || notification.type);
            const colors = getNotificationColor(notification.notification_type || notification.type);
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  relative p-4 rounded-xl border transition-all cursor-pointer
                  ${!notification.is_read 
                    ? `${colors.bg} ${colors.border} border-l-4` 
                    : 'bg-gray-50 dark:bg-white/5 border-transparent'}
                `}
              >
                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      title="Mark as read"
                    >
                      <HiOutlineCheckCircle size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                    title="Delete"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>

                {/* Content */}
                <div 
                  onClick={() => handleNotificationClick(notification)}
                  className="flex gap-3 pr-16"
                >
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={colors.icon} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold ${notification.is_read ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {notification.title}
                    </h3>
                    <p className={`text-xs mt-1 ${notification.is_read ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
