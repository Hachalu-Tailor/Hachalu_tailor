import React from 'react';
import { motion } from 'framer-motion';

const ItemCard = ({ item, isActive, onClick }) => (
  <motion.div
    onClick={onClick}
    className={`relative group cursor-pointer flex gap-4 p-4 transition-all border-l-2 ${
      isActive 
      ? 'bg-zinc-100 dark:bg-white/5 border-red-600' 
      : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
    }`}
  >
    <div className="w-20 h-24 overflow-hidden bg-gray-200 shrink-0">
      <img 
        src={item.img} 
        className={`w-full h-full object-cover transition-all duration-700 ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} 
        alt={item.name} 
      />
    </div>
    <div className="flex flex-col justify-center">
      <span className="text-[8px] text-red-600 font-bold uppercase tracking-widest">{item.category}</span>
      <h5 className={`font-black text-[11px] uppercase tracking-widest leading-tight ${ isActive ? 'text-red-600' : 'dark:text-white'}`}>
        {item.name}
      </h5>
      <p className="text-[10px] text-gray-400 mt-1">{item.price}</p>
      {isActive && (
        <motion.div layoutId="play-bar" className="mt-2 h-0.5 bg-red-600 w-12" />
      )}
    </div>
  </motion.div>
);
export default ItemCard;

