import React from 'react';

const Clients = () => (
  <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
        <tr>
          <th className="p-6">Client Name</th>
          <th className="p-6">Join Date</th>
          <th className="p-6">Orders</th>
          <th className="p-6">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
        {[1, 2, 3].map(i => (
          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <td className="p-6 font-bold dark:text-white text-sm uppercase">Client User {i}</td>
            <td className="p-6 text-xs text-gray-500 font-bold">FEB 10, 2026</td>
            <td className="p-6 text-xs font-black dark:text-white">0{i} Items</td>
            <td className="p-6"><span className="px-3 py-1 bg-red-600/10 text-red-600 text-[9px] font-black uppercase rounded-full">VIP Protocol</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Clients;
