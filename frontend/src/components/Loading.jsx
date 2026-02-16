import React from 'react';
import { motion } from 'framer-motion';

const Loading = ({
    size = 'md',
    text = 'Loading...',
    fullScreen = false,
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-2',
        lg: 'w-16 h-16 border-4',
        xl: 'w-24 h-24 border-4',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${sizeClasses[size]} border-red-500 border-t-transparent rounded-full animate-spin`}
            />
            {text && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 text-sm uppercase tracking-wider"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className={`fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
                {spinner}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center p-8 ${className}`}>
            {spinner}
        </div>
    );
};

export default Loading;
