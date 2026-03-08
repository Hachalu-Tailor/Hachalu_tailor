import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineXMark, HiOutlinePlus } from 'react-icons/hi2';
import { createColor } from '../../api/api';
import { getAvailableColors, formatColorName } from '../../utils/colors';

const CreateCollection = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#6b7280');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const trimmed = (name || '').trim();

    // Derive a clean, human-friendly name
    let finalName;
    const match = getAvailableColors().find(c => c.hex.toLowerCase() === hex.toLowerCase());
    if (trimmed) {
      finalName = formatColorName(trimmed);
    } else if (match) {
      finalName = formatColorName(match.name);
    } else {
      finalName = `Color ${hex.toUpperCase()}`;
    }

    try {
      setLoading(true);
      const payload = { name: finalName };
      const res = await createColor(payload);
      const created = res.data || res;
      setLoading(false);
      setName('');
      setHex('#6b7280');
      if (onCreated) onCreated(created);
      if (onClose) onClose();
    } catch (err) {
      setLoading(false);
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err.message || 'Failed to create color';
      alert(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70" />

        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} className="relative w-full max-w-md bg-white dark:bg-[#0b0b0b] rounded-2xl p-6 border border-zinc-200 dark:border-white/10 shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/5">
            <HiOutlineXMark size={18} />
          </button>

          <h3 className="text-lg font-black uppercase mb-3">Create Color</h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Pick Color</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="w-12 h-12 rounded" />
                <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Name (optional)</label>
              <input type="text" placeholder="e.g. Midnight Blue" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl px-3 py-2 mt-2" />
              <p className="text-[10px] text-zinc-400 mt-1">If left blank, a friendly name will be generated from the picked color.</p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button onClick={handleCreate} disabled={loading} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black uppercase">
                {loading ? 'Creating...' : (<span className="flex items-center gap-2 justify-center"><HiOutlinePlus /> Create</span>)}
              </button>
              <button onClick={onClose} className="px-4 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-2xl font-bold">Cancel</button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateCollection;
