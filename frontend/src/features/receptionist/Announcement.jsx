import React from 'react';
import { HiOutlineMegaphone } from 'react-icons/hi2';

const Announcement = () => (
  <div className="max-w-4xl">
    <h2 className="text-2xl font-black dark:text-white uppercase italic mb-8">Internal Bulletins</h2>
    <div className="space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="bg-red-600 p-8 rounded-3xl text-white relative overflow-hidden group">
          <HiOutlineMegaphone className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-125 transition-transform duration-700" size={150} />
          <div className="relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Urgent Notice</span>
            <h3 className="text-xl font-black uppercase mt-4">Stock Holiday: Feb 20-25</h3>
            <p className="text-white/80 text-sm mt-2 font-medium">Please finalize all pending measurements before the warehouse audit begins.</p>
            <p className="text-[9px] font-black uppercase mt-6 opacity-60">Posted by: Head Admin</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Announcement;