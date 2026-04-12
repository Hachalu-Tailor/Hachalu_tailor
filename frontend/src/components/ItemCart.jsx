import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineXMark, HiOutlineTrash } from 'react-icons/hi2';

const ItemCart = ({ isOpen, onClose, cart, onRemove }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-250"
          />
          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#0f0f0f] z-300 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b dark:border-white/5 flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-widest dark:text-white">Your Selection ({cart.length})</h2>
              <button onClick={onClose} className="dark:text-white"><HiOutlineXMark size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <p className="text-gray-400 text-xs uppercase tracking-widest text-center mt-20">Your vault is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex gap-4 border-b dark:border-white/5 pb-4">
                    <img src={item.img} className="w-16 h-20 object-cover" alt="" />
                    <div className="flex-1">
                      <h4 className="text-[10px] font-black dark:text-white uppercase">{item.name}</h4>
                      <p className="text-red-600 text-xs font-bold">{item.price}</p>
                      <button 
                        onClick={() => onRemove(item.cartId)}
                        className="text-gray-400 hover:text-red-600 mt-2 transition-colors"
                      >
                        <HiOutlineTrash size={16}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-gray-50 dark:bg-white/5">
                <button className="w-full bg-black dark:bg-white dark:text-black text-white py-4 font-black uppercase text-[10px] tracking-widest">
                  Checkout Now
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ItemCart;