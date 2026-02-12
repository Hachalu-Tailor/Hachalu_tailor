import React from 'react';
import { HiOutlineCheck, HiOutlineEye, HiOutlineNoSymbol } from 'react-icons/hi2';

const Orders = () => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
       <StatBox label="Pending Verification" count="14" color="text-orange-500" />
       <StatBox label="Awaiting Tailor" count="08" color="text-blue-500" />
       <StatBox label="Completed" count="124" color="text-green-500" />
    </div>

    <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
         <h4 className="text-[10px] font-black uppercase tracking-widest dark:text-white">Live Payment Stream</h4>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-white/5">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-6">
               <div className="h-16 w-16 bg-gray-200 dark:bg-white/5 rounded-xl overflow-hidden border border-red-600/20">
                  <img src="https://images.unsplash.com/photo-1554224155-169743017552?q=80&w=100" className="w-full h-full object-cover" alt="Receipt" />
               </div>
               <div>
                  <h5 className="text-sm font-black dark:text-white uppercase">Order #HP-99{i}</h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Client: Hana Solomon</p>
               </div>
            </div>
            <div className="flex gap-3">
               <button className="bg-green-600 text-white p-3 rounded-xl shadow-lg shadow-green-600/20"><HiOutlineCheck size={18} /></button>
               <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 rounded-xl"><HiOutlineEye /> Review</button>
               <button className="text-gray-400 p-3 hover:text-red-600 transition-colors"><HiOutlineNoSymbol size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatBox = ({ label, count, color }) => (
  <div className="bg-white dark:bg-[#0c0c0c] p-8 border border-gray-100 dark:border-white/5 rounded-3xl">
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-4xl font-black ${color}`}>{count}</p>
  </div>
);

export default Orders;

