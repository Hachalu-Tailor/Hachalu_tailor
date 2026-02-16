import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineHome, HiOutlineArrowLeft } from 'react-icons/hi2';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* 404 Text */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-[150px] md:text-[200px] font-black text-white/5 leading-none"
        >
          404
        </motion.h1>

        {/* Content */}
        <div className="relative -mt-20 md:-mt-28">
          <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tight mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              <HiOutlineHome size={18} />
              Go Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-white/10 transition-colors"
            >
              <HiOutlineArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-[100px]" />
      </motion.div>
    </div>
  );
};

export default NotFound;
