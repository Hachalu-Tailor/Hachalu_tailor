import React from 'react';
import { motion } from 'framer-motion';
import { HiOutlineClock, HiOutlineExclamationTriangle, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useCountdown } from '../hooks/useCountdown';
import { formatDate } from '../utils/helpers';

// Urgency level configurations
const URGENCY_CONFIG = {
  critical: {
    // Less than 3 hours (red accent)
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600',
    badgeColor: 'bg-red-500 text-white',
    icon: HiOutlineExclamationCircle,
    label: 'Critical',
    pulse: true,
  },
  urgent: {
    // 1 day or less (red accent)
    borderColor: 'border-red-400',
    bgColor: 'bg-red-500/5',
    textColor: 'text-red-500',
    badgeColor: 'bg-red-500/20 text-red-600',
    icon: HiOutlineExclamationTriangle,
    label: 'Urgent',
    pulse: false,
  },
  warning: {
    // 2 days (orange accent)
    borderColor: 'border-orange-400',
    bgColor: 'bg-orange-500/5',
    textColor: 'text-orange-500',
    badgeColor: 'bg-orange-500/20 text-orange-600',
    icon: HiOutlineClock,
    label: 'Due Soon',
    pulse: false,
  },
  overdue: {
    // Overdue (dark/grey)
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-600',
    badgeColor: 'bg-gray-500 text-white',
    icon: HiOutlineExclamationCircle,
    label: 'Overdue',
    pulse: true,
  },
  normal: {
    // Normal (no urgency)
    borderColor: 'border-gray-200',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
    badgeColor: 'bg-gray-200 text-gray-600',
    icon: HiOutlineClock,
    label: 'On Track',
    pulse: false,
  },
};

/**
 * UrgencyIndicator - Shows due date countdown with urgency styling
 * @param {string|Date} dueDate - The due date
 * @param {string} orderCode - Order code for display
 * @param {boolean} showFullCountdown - Show full countdown (days:hours:minutes:seconds)
 * @param {boolean} compact - Compact mode for small spaces
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 */
export const UrgencyIndicator = ({ 
  dueDate, 
  orderCode, 
  showFullCountdown = false, 
  compact = false,
  size = 'md'
}) => {
  const {
    days,
    hours,
    minutes,
    seconds,
    isOverdue,
    isLessThan3Hours,
    isLessThan1Day,
    isLessThan2Days,
    urgencyLevel,
    formatted
  } = useCountdown(dueDate);

  const config = URGENCY_CONFIG[urgencyLevel] || URGENCY_CONFIG.normal;
  const Icon = config.icon;

  // Size variants
  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'w-3 h-3',
      text: 'text-xs',
      badge: 'text-[8px] px-1.5 py-0.5',
    },
    md: {
      container: 'p-3',
      icon: 'w-4 h-4',
      text: 'text-sm',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      container: 'p-4',
      icon: 'w-5 h-5',
      text: 'text-base',
      badge: 'text-xs px-2.5 py-1',
    },
  };

  const sizeConfig = sizeClasses[size];

  // Don't render if no due date
  if (!dueDate) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${sizeConfig.text}`}>
        <HiOutlineClock className={sizeConfig.icon} />
        <span>No due date</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        ${sizeConfig.container}
        rounded-xl border-2 
        ${config.borderColor}
        ${config.bgColor}
        ${config.textColor}
        ${compact ? 'flex items-center gap-2' : 'space-y-2'}
      `}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.pulse ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Icon className={sizeConfig.icon} />
            </motion.div>
          ) : (
            <Icon className={sizeConfig.icon} />
          )}
          <span className={`font-semibold ${sizeConfig.text}`}>
            {formatted}
          </span>
        </div>
        
        {/* Status Badge */}
        <span className={`${sizeConfig.badge} rounded-full font-bold uppercase ${config.badgeColor}`}>
          {config.label}
        </span>
      </div>

      {/* Due Date Display */}
      {!compact && (
        <div className={`text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200/50`}>
          Due: {formatDate(dueDate, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      {/* Full Countdown Display */}
      {showFullCountdown && !compact && !isOverdue && (
        <div className="grid grid-cols-4 gap-1 pt-2">
          <div className="text-center">
            <div className={`font-bold ${sizeConfig.text}`}>{days}</div>
            <div className="text-[8px] uppercase text-gray-500">Days</div>
          </div>
          <div className="text-center">
            <div className={`font-bold ${sizeConfig.text}`}>{hours}</div>
            <div className="text-[8px] uppercase text-gray-500">Hrs</div>
          </div>
          <div className="text-center">
            <div className={`font-bold ${sizeConfig.text}`}>{minutes}</div>
            <div className="text-[8px] uppercase text-gray-500">Min</div>
          </div>
          <div className="text-center">
            <div className={`font-bold ${sizeConfig.text}`}>{seconds}</div>
            <div className="text-[8px] uppercase text-gray-500">Sec</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Compact version of UrgencyIndicator for inline use
 */
export const CompactUrgency = ({ dueDate }) => {
  const { urgencyLevel, formatted, isOverdue } = useCountdown(dueDate);
  
  const config = URGENCY_CONFIG[urgencyLevel] || URGENCY_CONFIG.normal;
  
  if (!dueDate) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.badgeColor}`}>
      <motion.span
        animate={config.pulse ? { opacity: [1, 0.5, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {isOverdue ? '⚠' : '⏱'}
      </motion.span>
      {formatted}
    </span>
  );
};

/**
 * Get urgency border class for order cards
 */
export const getUrgencyBorderClass = (dueDate, excludeCompleted = true) => {
  if (!dueDate) return 'border-gray-100 dark:border-white/5';
  
  const { urgencyLevel } = useCountdown(dueDate);
  const config = URGENCY_CONFIG[urgencyLevel] || URGENCY_CONFIG.normal;
  
  return config.borderColor;
};

export default UrgencyIndicator;
