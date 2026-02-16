import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineCube,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineArrowPath,
  HiOutlineTruck,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineExclamationTriangle,
  HiOutlinePhoto,
  HiOutlineCheckBadge
} from "react-icons/hi2";

/* ---------------- MOCK DATA (Synced with your Django Model) ---------------- */
const MOCK_INVENTORY = [
  {
    id: 1,
    category: "Men",
    sku: "MT-RED-001",
    material: {
      name: "Italian Wool",
      color: "Charcoal",
      texture: "Fine Grain",
      image_url: "https://images.unsplash.com/photo-1594932224828-b4b057b69b03?q=80&w=400",
    },
    quantity_meters: 45.00,
  },
  {
    id: 2,
    category: "Women",
    sku: "MT-SILK-002",
    material: {
      name: "Premium Silk",
      color: "Deep Navy",
      texture: "Glossy",
      image_url: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=400",
    },
    quantity_meters: 8.50,
  },
  {
    id: 3,
    category: "Children",
    sku: "MT-DNM-003",
    material: {
      name: "Raw Denim",
      color: "Indigo",
      texture: "Rugged",
      image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400",
    },
    quantity_meters: 0.00,
  },
];

const Inventory = () => {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [category, setCategory] = useState("All");
  const [stockStatus, setStockStatus] = useState("all");

  const categories = ["All", "Men", "Women", "Children"];

  const filteredData = MOCK_INVENTORY.filter((item) => {
    const matchSearch = item.material.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || item.category === category;
    const matchStatus = 
        stockStatus === "all" ? true :
        stockStatus === "in-stock" ? item.quantity_meters > 0 :
        item.quantity_meters === 0;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* --- RESPONSIVE CONTAINER --- */}
      <div className="max-w-7xl mx-auto py-6 md:py-10">
        
        {/* HEADER & KPI HUD */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase flex items-center gap-2">
              <HiOutlineCube className="text-red-600" /> Stock <span className="text-red-600">Matrix</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-1">Material Asset Management Protocol</p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
             <KPICard label="Active Units" value={MOCK_INVENTORY.length} />
             <KPICard label="Depleted" value={MOCK_INVENTORY.filter(i => i.quantity_meters === 0).length} highlight />
          </div>
        </header>

        {/* CONTROLS AREA */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-6 lg:col-span-7 relative">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text"
              placeholder="SEARCH BY SKU OR MATERIAL NAME..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none transition-all"
            />
          </div>

          <div className="md:col-span-6 lg:col-span-5 flex gap-2">
             <div className="relative flex-1">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none px-6 py-4 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c} Suite</option>)}
                </select>
                <HiOutlineChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
             </div>
             
             <button 
                onClick={() => setStockStatus(stockStatus === 'all' ? 'out-of-stock' : 'all')}
                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${stockStatus === 'out-of-stock' ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'}`}
             >
                {stockStatus === 'out-of-stock' ? 'VIEW ALL' : 'OUT ONLY'}
             </button>
          </div>
        </section>

        {/* DATA LISTING */}
        <main className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden shadow-xl">
           <div className="overflow-x-auto no-scrollbar">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-zinc-50 dark:bg-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                   <th className="p-6">Material Profile</th>
                   <th className="p-6 hidden md:table-cell">Inventory Health</th>
                   <th className="p-6 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y dark:divide-zinc-800">
                 {filteredData.map((item) => (
                   <tr 
                     key={item.id}
                     onClick={() => setSelectedItem(item)}
                     className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all"
                   >
                     <td className="p-4 md:p-6">
                       <div className="flex items-center gap-4">
                          <img 
                            src={item.material.image_url} 
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover shadow-lg ${item.quantity_meters === 0 ? 'grayscale' : ''}`} 
                            alt={item.material.name} 
                          />
                          <div>
                            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">{item.sku}</span>
                            <h3 className="text-sm md:text-base font-black uppercase italic tracking-tight">{item.material.name}</h3>
                            <p className="text-[10px] text-zinc-400 uppercase font-bold">{item.material.color} • {item.category}</p>
                          </div>
                       </div>
                     </td>
                     
                     <td className="p-6 hidden md:table-cell w-1/3">
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${Math.min(item.quantity_meters, 100)}%` }}
                                className={`h-full rounded-full ${item.quantity_meters === 0 ? 'bg-zinc-300' : item.quantity_meters < 15 ? 'bg-orange-500' : 'bg-red-600'}`}
                              />
                           </div>
                           <span className="text-xs font-black italic">{item.quantity_meters}m</span>
                        </div>
                     </td>

                     <td className="p-6 text-right">
                        <StatusBadge qty={item.quantity_meters} />
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </main>
      </div>

      {/* --- MANAGEMENT MODAL --- */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl bg-white dark:bg-[#0c0c0c] rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10"
            >
              <div className="flex flex-col md:flex-row">
                {/* Visual Section */}
                <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-zinc-100 dark:bg-white/5 overflow-hidden">
                   <img src={selectedItem.material.image_url} className="w-full h-full object-cover" alt="" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-10">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-2">Selected Asset</span>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedItem.material.name}</h2>
                      <p className="text-xs text-white/60 uppercase font-bold mt-2 tracking-widest">{selectedItem.material.texture} texture / {selectedItem.material.color}</p>
                   </div>
                   <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all">
                      <HiOutlineXMark size={20} />
                   </button>
                </div>

                {/* Control Section */}
                <div className="w-full md:w-1/2 p-8 md:p-12">
                   <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-white/5">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Management Console</span>
                      <StatusBadge qty={selectedItem.quantity_meters} />
                   </div>

                   <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Current Inventory (Meters)</label>
                        <div className="flex items-center gap-4 mt-3">
                           <button className="h-14 w-14 flex items-center justify-center bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><HiOutlineMinus/></button>
                           <input 
                              type="number" 
                              defaultValue={selectedItem.quantity_meters}
                              className="flex-1 bg-zinc-50 dark:bg-black text-center text-3xl font-black italic rounded-2xl py-3 border-none outline-none focus:ring-2 ring-red-600/20 dark:text-white"
                           />
                           <button className="h-14 w-14 flex items-center justify-center bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><HiOutlinePlus/></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                         <button className="w-full py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-xl shadow-red-600/20 hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all">Commit Update</button>
                         <div className="grid grid-cols-2 gap-3">
                            <ActionButton icon={<HiOutlineTruck />} label="Relocate" />
                            <ActionButton icon={<HiOutlineArrowPath />} label="Log History" />
                         </div>
                      </div>
                   </div>

                   <div className="mt-8 flex items-center gap-3 p-4 bg-orange-500/5 dark:bg-red-600/5 rounded-2xl border border-orange-500/10 dark:border-red-600/10">
                      <HiOutlineExclamationTriangle className="text-orange-500 shrink-0" size={20} />
                      <p className="text-[9px] font-black text-orange-600/80 uppercase leading-relaxed tracking-wider">Note: All stock modifications are logged with user timestamp for audit security.</p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const KPICard = ({ label, value, highlight }) => (
  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-4 md:p-6 rounded-[2rem] flex flex-col items-center min-w-[130px] shrink-0">
    <span className={`text-2xl md:text-3xl font-black italic tracking-tighter ${highlight ? 'text-red-600' : 'dark:text-white'}`}>{value}</span>
    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{label}</span>
  </div>
);

const ActionButton = ({ icon, label }) => (
  <button className="flex items-center justify-center gap-3 p-4 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/5 hover:border-red-600/40 hover:text-red-600 transition-all group">
      <span className="text-zinc-400 group-hover:text-red-600 transition-colors">{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const StatusBadge = ({ qty }) => {
  const styles = qty === 0 
    ? "bg-red-600/10 text-red-600 border-red-600/20" 
    : qty < 15 
    ? "bg-orange-500/10 text-orange-500 border-orange-500/20" 
    : "bg-green-500/10 text-green-500 border-green-500/20";

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic border ${styles}`}>
      {qty === 0 ? <HiOutlineExclamationTriangle /> : qty < 15 ? <HiOutlineArrowPath /> : <HiOutlineCheckBadge />}
      {qty === 0 ? "Depleted" : qty < 15 ? "Low Stock" : "Healthy"}
    </div>
  );
};

export default Inventory;