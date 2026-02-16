import React from 'react';
import { 
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS
} from '../utils/constants';

const StatusBadge = ({ 
  status, 
  type = 'order', // order, payment, priority, custom
  customColors = {},
  customLabels = {},
  size = 'md', // sm, md, lg
  className = ''
}) => {
  // Get color based on type
  const getColor = () => {
    if (customColors[status]) return customColors[status];
    
    if (type === 'order') {
      return ORDER_STATUS_COLORS[status] || 'bg-gray-500';
    }
    
    if (type === 'payment') {
      const paymentColors = {
        pending: 'bg-yellow-500',
        completed: 'bg-green-500',
        failed: 'bg-red-500',
        refunded: 'bg-purple-500',
      };
      return paymentColors[status] || 'bg-gray-500';
    }
    
    if (type === 'priority') {
      return PRIORITY_COLORS[status] || 'bg-gray-500';
    }
    
    return 'bg-gray-500';
  };

  // Get label based on type
  const getLabel = () => {
    if (customLabels[status]) return customLabels[status];
    
    if (type === 'order') {
      return ORDER_STATUS_LABELS[status] || status;
    }
    
    if (type === 'payment') {
      return PAYMENT_STATUS_LABELS[status] || status;
    }
    
    if (type === 'priority') {
      return PRIORITY_LABELS[status] || status;
    }
    
    return status;
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const color = getColor();
  const label = getLabel();

  return (
    <span
      className={`
        inline-flex items-center justify-center
        ${sizeClasses[size]}
        font-bold uppercase tracking-wider
        rounded-full border
        ${color}/20 ${color.replace('bg-', 'border-')}/30
        ${color.replace('bg-', 'text-')}
        ${className}
      `}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
