import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineXMark, 
  HiOutlineQueueList, 
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineScale,
  HiOutlineInboxStack,
  HiOutlineClock
} from 'react-icons/hi2';
import ItemCard from '../components/ItemCard';
import { createOrder, getMaterials } from '../api/api';

const Items = ({ isHomePage = true }) => {
  const [filter, setFilter] = useState('All');
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Backend Materials State
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    suit_type: 1, 
    material: "",  
    quantity: 1,
    measurements: {
      height: "",
      chest: "",
      shoulder: "",
      waist: "",
      hips: "",
      arm_length: ""
    }
  });

  // Fetch Materials from Backend
  useEffect(() => {
    const fetchBackendMaterials = async () => {
      try {
        setLoading(true);
        const response = await getMaterials();
        
        // Mapping backend data to match UI component requirements
        const mappedData = response.data.map(m => ({
          ...m,
          // Use API category if provided, else default to 'Men' for filtering
          category: m.category || 'Men', 
          // Fallback image if null
          img: m.image_url || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1480',
          // Generate description from texture/color if description is null
          desc: m.description || `A premium ${m.texture} fabric in a sophisticated ${m.color} finish.`,
          price: m.inventory ? `${m.inventory.quantity_meters}m Available` : "Check Stock"
        }));
        
        setMaterials(mappedData);
        if (mappedData.length > 0) {
           const firstAvailable = mappedData.find(m => m.inventory?.is_available);
           setFormData(prev => ({ ...prev, material: firstAvailable?.id || mappedData[0].id }));
        }
      } catch (error) {
        console.error("Failed to load inventory:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBackendMaterials();
  }, []);

  const filteredProducts = filter === 'All' 
    ? materials 
    : materials.filter(p => p.category === filter);

  const activeItem = filteredProducts[activeIdx] || filteredProducts[0];

  // Auto-play Logic
  useEffect(() => {
    if (isPaused || selectedItem || filteredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % filteredProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, selectedItem, filteredProducts]);

  const handleInputChange = (field, value, isMeasurement = false) => {
    if (isMeasurement) {
      setFormData(prev => ({
        ...prev,
        measurements: { ...prev.measurements, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.customer_phone) {
      alert("Please complete contact details.");
      return;
    }

    const payload = {
      ...formData,
      suit_type: 1, 
      material: activeItem?.id,
      quantity: parseInt(formData.quantity),
      measurements: Object.fromEntries(
        Object.entries(formData.measurements).map(([k, v]) => [k, parseFloat(v) || 0])
      )
    };

    try {
      const response = await createOrder(payload);
      if (response.status === 201 || response.status === 200) {
        alert(`Order Placed! Code: ${response.data.order_code}`);
        setSelectedItem(null); 
      }
    } catch (error) {
      alert(error.response?.data?.message || "Order failed.");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#080808]">
      <div className="text-red-600 font-black uppercase tracking-[0.5em] animate-pulse">Loading Inventory...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] pt-20 md:pt-28 pb-20 px-4 md:px-16 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <header>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] mb-2">
              Hachalu Atelier • Fabric Inventory
            </motion.p>
            <h2 className="text-4xl md:text-7xl font-black text-black dark:text-white uppercase tracking-tighter leading-none">
              Material Gallery
            </h2>
          </header>

          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-2">
            {['All', 'Men', 'Women', 'Children'].map((cat) => (
              <button
                key={cat}
                onClick={() => { setFilter(cat); setActiveIdx(0); }}
                className={`text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-full border transition-all shrink-0 ${
                  filter === cat 
                  ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xl' 
                  : 'border-gray-200 dark:border-white/10 dark:text-white hover:border-red-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN INTERACTIVE LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-auto lg:h-[75vh]">
          <div className="flex-[2] relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-sm aspect-[4/5] lg:aspect-auto" 
            onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            
            <AnimatePresence mode="wait">
              <motion.div key={activeItem?.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} className="absolute inset-0">
                <img src={activeItem?.img} className={`w-full h-full object-cover transition-all duration-1000 ${!activeItem?.inventory?.is_available ? 'grayscale blur-sm' : ''}`} alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Restocking Soon Overlay */}
            {!activeItem?.inventory?.is_available && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-black/40 backdrop-blur-xl p-10 border border-white/10 mx-4">
                  <HiOutlineClock className="mx-auto text-red-600 mb-4" size={48} />
                  <h3 className="text-white text-3xl font-black uppercase tracking-tighter">Coming Soon</h3>
                  <p className="text-white/70 text-[10px] uppercase tracking-[0.2em] mt-2">This {activeItem?.name} fabric is being restocked.</p>
                </motion.div>
              </div>
            )}

            <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 md:right-12 flex flex-col md:flex-row justify-between items-end gap-6 z-10">
              <div className="max-w-xl">
                <span className="bg-red-600 text-white text-[8px] font-bold px-3 py-1 uppercase tracking-widest mb-4 inline-block">
                  SKU: {activeItem?.id}
                </span>
                <h3 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight">
                  {activeItem?.name}
                </h3>
                <p className="text-white/60 text-xs md:text-sm mt-4 uppercase tracking-widest font-bold">
                  {activeItem?.color} — {activeItem?.texture}
                </p>
              </div>
              
              {activeItem?.inventory?.is_available && (
                <button 
                  onClick={() => setSelectedItem(activeItem)}
                  className="w-full md:w-auto bg-white text-black px-10 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-2xl"
                >
                  Request Bespoke Build
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 w-full lg:max-w-[420px] flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2 px-1">
               <HiOutlineQueueList size={16} className="text-red-600"/> Available Inventory
            </h4>
            
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:pr-2 h-full">
              {filteredProducts.map((item, idx) => (
                <div key={item.id} className="min-w-[280px] lg:min-w-full">
                  <ItemCard 
                    item={item} 
                    isActive={activeIdx === idx} 
                    onClick={() => setActiveIdx(idx)} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 30, stiffness: 200 }} className="relative w-full max-w-2xl h-full bg-white dark:bg-[#0c0c0c] flex flex-col shadow-2xl">
              <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex gap-4">
                  <TabBtn active={activeTab === 'details'} onClick={() => setActiveTab('details')} label="Fabric Overview" icon={<HiOutlineInboxStack/>} />
                  <TabBtn active={activeTab === 'bespoke'} onClick={() => setActiveTab('bespoke')} label="Measurements" icon={<HiOutlineScale/>} />
                </div>
                <button onClick={() => setSelectedItem(null)} className="dark:text-white hover:text-red-600 transition-colors">
                  <HiOutlineXMark size={28}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <AnimatePresence mode="wait">
                  {activeTab === 'details' ? (
                    <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                       <div className="aspect-[16/9] rounded overflow-hidden">
                          <img src={selectedItem.img} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                          <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">{selectedItem.name}</h2>
                          <p className="text-red-600 font-bold text-lg mt-2 uppercase tracking-widest">{selectedItem.color} • {selectedItem.texture}</p>
                          <p className="text-gray-500 dark:text-gray-400 mt-6 leading-relaxed text-lg italic">{selectedItem.desc}</p>
                       </div>
                       <button onClick={() => setActiveTab('bespoke')} className="w-full py-6 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all">
                         Enter Measurements
                       </button>
                    </motion.div>
                  ) : (
                    <motion.div key="bespoke" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                       <header className="border-b dark:border-white/10 pb-6">
                          <h3 className="text-2xl font-black dark:text-white uppercase">Client Brief</h3>
                          <p className="text-gray-500 text-xs uppercase tracking-widest mt-2">Custom order for material: {selectedItem.name}</p>
                       </header>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-white/5 p-6 rounded-sm">
                          <Input label="Full Name" type="text" placeholder="John Doe" value={formData.customer_name} onChange={(e) => handleInputChange('customer_name', e.target.value)} />
                          <Input label="Phone Number" type="text" placeholder="+251..." value={formData.customer_phone} onChange={(e) => handleInputChange('customer_phone', e.target.value)} />
                       </div>

                       <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          {Object.keys(formData.measurements).map((key) => (
                            <Input key={key} label={key.replace('_', ' ')} placeholder="0.0" value={formData.measurements[key]} onChange={(e) => handleInputChange(key, e.target.value, true)} />
                          ))}
                       </div>

                       <button onClick={handleSubmit} className="w-full py-6 bg-red-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-black transition-all">
                         Submit Custom Order
                       </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabBtn = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-red-600 text-white shadow-lg' : 'dark:text-white hover:bg-white/10'}`}>
    {icon} {label}
  </button>
);

const Input = ({ label, placeholder, type = "number", value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="bg-transparent border-b border-gray-200 dark:border-white/10 py-3 text-lg font-bold dark:text-white outline-none focus:border-red-600 transition-all" />
  </div>
);

export default Items;