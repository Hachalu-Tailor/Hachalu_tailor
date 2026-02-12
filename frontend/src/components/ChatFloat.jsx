import React, { useState } from 'react';
import { HiOutlineChatBubbleBottomCenterText, HiOutlineXMark } from 'react-icons/hi2';

const ChatFloat = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-[100]">
      {isOpen && (
        <div className="bg-white dark:bg-[#111] w-72 h-96 shadow-2xl rounded-2xl border border-gray-100 dark:border-white/10 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-red-600 p-4 text-white flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest">Client Chat</span>
            <button onClick={() => setIsOpen(false)}><HiOutlineXMark /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto text-[11px] font-bold dark:text-gray-300">
            <div className="bg-gray-100 dark:bg-white/5 p-2 rounded mb-2">System: Client #882 is online.</div>
          </div>
          <input className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 outline-none text-xs dark:text-white" placeholder="Send response..." />
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform"
      >
        <HiOutlineChatBubbleBottomCenterText size={24} />
      </button>
    </div>
  );
};

export default ChatFloat;