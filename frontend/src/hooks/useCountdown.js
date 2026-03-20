import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for live countdown timer
 * @param {string|Date} targetDate - The target date to count down to
 * @returns {object} Object containing countdown values and utility functions
 */
export const useCountdown = (targetDate) => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isOverdue: false,
    isLessThan3Hours: false,
    isLessThan1Day: false,
    isLessThan2Days: false,
  });
  
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!targetDate) {
      setCountdown({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        isOverdue: false,
        isLessThan3Hours: false,
        isLessThan1Day: false,
        isLessThan2Days: false,
      });
      return;
    }

    const calculateCountdown = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
          isOverdue: true,
          isLessThan3Hours: false,
          isLessThan1Day: false,
          isLessThan2Days: false,
        };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const totalHours = diff / (1000 * 60 * 60);

      return {
        days,
        hours,
        minutes,
        seconds,
        total: diff,
        isOverdue: false,
        isLessThan3Hours: totalHours < 3,
        isLessThan1Day: totalHours < 24,
        isLessThan2Days: totalHours < 48,
      };
    };

    // Calculate initial countdown
    setCountdown(calculateCountdown());

    // Set up interval for live updates
    intervalRef.current = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);

    // Cleanup interval on unmount or targetDate change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetDate]);

  // Format countdown for display
  const getFormattedCountdown = () => {
    if (countdown.isOverdue) return 'Overdue';
    
    const { days, hours, minutes, seconds } = countdown;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get urgency level
  const getUrgencyLevel = () => {
    if (countdown.isOverdue) return 'overdue';
    if (countdown.isLessThan3Hours) return 'critical';
    if (countdown.isLessThan1Day) return 'urgent';
    if (countdown.isLessThan2Days) return 'warning';
    return 'normal';
  };

  return {
    ...countdown,
    formatted: getFormattedCountdown(),
    urgencyLevel: getUrgencyLevel(),
  };
};

export default useCountdown;
