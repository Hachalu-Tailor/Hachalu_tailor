import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlineMegaphone,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineFunnel,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import api, { getNotifications } from '../../api/api';
import { useAuth } from '../../hooks/useAuth';
import { formatRelativeTime, formatDate } from '../../utils/helpers';

const Announcement = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, order, payment, system
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      // Handle both array and paginated responses
      let notificationsData = response.data;
      if (notificationsData && typeof notificationsData === 'object' && !Array.isArray(notificationsData)) {
        notificationsData = notificationsData.results || notificationsData.data || notificationsData.items || [];
      }
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Use mock data if API fails
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  // Mock notifications for demo
  const getMockNotifications = () => [
    {
      id: '1',
      type: 'order',
      title: 'New Order Received',
      message: 'Order #ORD-1234 has been placed by John Doe. Please review and process.',
      priority: 'high',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      data: { order_id: '1234' }
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Pending Verification',
      message: 'Payment of ETB 5,000 for Order #ORD-1230 requires your verification.',
      priority: 'high',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      data: { payment_id: 'pay-123' }
    },
    {
      id: '3',
      type: 'system',
      title: 'Inventory Alert',
      message: '3 items are running low on stock. Please review inventory levels.',
      priority: 'medium',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString,
    },
    {
      id: '4',
      type: 'order',
      title: 'Order Ready for Pickup',
      message: 'Order #ORD-1220 is ready for customer pickup.',
      priority: 'normal',
      read: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: '5',
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Feb 20, 2026 from 2:00 AM to 4:00 AM.',
      priority: 'low',
      read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/accounts/user/notifications/${notificationId}/`, { read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      // Update locally if API fails
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/accounts/user/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      // Update locally if API fails
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/accounts/user/notifications/${notificationId}/`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      // Delete locally if API fails
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return HiOutlineClipboardDocumentCheck;
      case 'payment':
        return HiOutlineCurrencyDollar;
      case 'system':
        return HiOutlineBell;
      default:
        return HiOutlineMegaphone;
    }
  };

  // Get notification color
  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return { bg: 'bg-red-500/10', icon: 'text-red-500', border: 'border-red-500/20' };
    if (priority === 'medium') return { bg: 'bg-yellow-500/10', icon: 'text-yellow-500', border: 'border-yellow-500/20' };

    switch (type) {
      case 'order':
        return { bg: 'bg-blue-500/10', icon: 'text-blue-500', border: 'border-blue-500/20' };
      case 'payment':
        return { bg: 'bg-green-500/10', icon: 'text-green-500', border: 'border-green-500/20' };
      case 'system':
        return { bg: 'bg-purple-500/10', icon: 'text-purple-500', border: 'border-purple-500/20' };
      default:
        return { bg: 'bg-gray-500/10', icon: 'text-gray-500', border: 'border-gray-500/20' };
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic">
            Notifications
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <HiOutlineArrowPath size={16} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <HiOutlineCheckCircle size={16} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
        {[
          { id: 'all', label: 'All', icon: HiOutlineBell },
          { id: 'unread', label: 'Unread', icon: HiOutlineExclamationTriangle },
          { id: 'order', label: 'Orders', icon: HiOutlineClipboardDocumentCheck },
          { id: 'payment', label: 'Payments', icon: HiOutlineCurrencyDollar },
          { id: 'system', label: 'System', icon: HiOutlineMegaphone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === tab.id
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.id === 'unread' && unreadCount > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
            <HiOutlineBell className="mx-auto text-gray-600 mb-3" size={40} />
            <p className="text-gray-400 text-sm">No notifications found</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type);
              const colors = getNotificationColor(notification.type, notification.priority);

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative p-5 rounded-2xl border transition-all cursor-pointer
                    ${notification.read
                      ? 'bg-white/5 border-white/5'
                      : `${colors.bg} ${colors.border}`}
                  `}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={colors.icon} size={24} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-bold ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                        {notification.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[9px] font-bold uppercase rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${notification.read ? 'text-gray-500' : 'text-gray-300'} line-clamp-2`}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-2">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title={notification.read ? 'Mark as unread' : 'Mark as read'}
                      >
                        <HiOutlineEye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(getNotificationIcon(selectedNotification.type), {
                    className: getNotificationColor(selectedNotification.type, selectedNotification.priority).icon,
                    size: 24
                  })}
                  <h3 className="text-lg font-bold text-white">{selectedNotification.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <p className="text-gray-300 text-sm mb-4">{selectedNotification.message}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(selectedNotification.created_at)}</span>
                <span className="capitalize">{selectedNotification.type}</span>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Announcement;
