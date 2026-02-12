import React from 'react';
import { HiOutlinePlus, HiOutlineAdjustmentsVertical } from 'react-icons/hi2';

const Inventory = () => (
  <div className="animate-in fade-in duration-700">
    <div className="flex justify-between items-end mb-10">
      <div>
        <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter italic">Suite Stock</h2>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Bespoke & Ready-to-wear</p>
      </div>
      <button className="bg-red-600 text-white px-6 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-black transition-all">Add Product</button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 p-2 rounded-2xl group transition-all hover:shadow-2xl">
          <div className="relative h-64 overflow-hidden rounded-xl">
             <img src={`https://images.unsplash.com/photo-1593032465175-481ac7f401a${item}?q=80&w=600`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
             <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white px-3 py-1 text-[9px] font-black uppercase">Category: Prime</div>
          </div>
          <div className="p-5 space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-black dark:text-white uppercase">Midnight Peak Suite</h3>
                <span className="text-red-600 font-black">$1,450</span>
             </div>
             <div className="flex gap-2">
                <span className="text-[8px] bg-gray-100 dark:bg-white/5 dark:text-gray-400 p-1.5 font-black uppercase rounded">Chest</span>
                <span className="text-[8px] bg-gray-100 dark:bg-white/5 dark:text-gray-400 p-1.5 font-black uppercase rounded">Waist</span>
                <span className="text-[8px] bg-gray-100 dark:bg-white/5 dark:text-gray-400 p-1.5 font-black uppercase rounded">Shoulder</span>
             </div>
             <div className="pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase">Current Stock: 12</p>
                <button className="text-[10px] font-black uppercase text-red-600 hover:tracking-widest transition-all">Edit Details</button>
             </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Inventory;