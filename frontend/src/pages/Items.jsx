import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineXMark,
  HiOutlineQueueList,
  HiOutlineScale,
  HiOutlineInboxStack,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineSquares2X2,
  HiOutlineCube,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineSwatch,
  HiOutlineCheckBadge,
  HiOutlineClipboardDocumentCheck,
  HiOutlineTag
} from 'react-icons/hi2';
import ItemCard from '../components/ItemCard';
import { createOrder, getMaterials, getSuitTypes } from '../api/api';
import { getHexColor, isLightColor } from '../utils/colors';
import { useParams, useNavigate } from 'react-router-dom';

const Items = () => {
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('All');
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [categories, setCategories] = useState(['All']);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [copied, setCopied] = useState(false);
  const [suitTypes, setSuitTypes] = useState([]);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    suit_type: "Full Suit",
    material: "",
    selected_color: "",
    quantity: 1,
    measurements: {
      height: "", chest: "", shoulder: "", waist: "", hips: "", arm_length: ""
    }
  });

  useEffect(() => {
    if (urlCategory) {
      const formatted = urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1);
      setFilter(formatted);
    } else {
      setFilter('All');
    }
    setActiveIdx(0);
  }, [urlCategory]);

  useEffect(() => {
    const fetchBackendMaterials = async () => {
      try {
        setLoading(true);
        const response = await getMaterials();
        // Handle both array and paginated responses
        let materialsData = response.data;
        if (materialsData && typeof materialsData === 'object' && !Array.isArray(materialsData)) {
          // Check for common pagination patterns
          materialsData = materialsData.results || materialsData.data || materialsData.items || [];
        }
        if (!Array.isArray(materialsData)) {
          materialsData = [];
        }
        const normalizeCategory = (cat) => {
          if (!cat) return null;
          const lower = cat.toLowerCase();
          if (lower === 'men' || lower === 'male') return 'Men';
          if (lower === 'women' || lower === 'woman' || lower === 'female') return 'Women';
          if (lower === 'children' || lower === 'child' || lower === 'kids') return 'Children';
          return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
        };

        const mappedData = materialsData.map(m => ({
          ...m,
          category: normalizeCategory(m.category),
          img: m.image_url || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1480',
          desc: m.description || `A premium ${m.texture} fabric in a sophisticated ${m.color || m.colors?.[0]?.name || 'varied'} finish.`,
          price: m.inventory ? `${m.inventory.quantity_meters}m Available` : "Check Stock",
          colors: m.colors && m.colors.length > 0 ? m.colors : m.color ? [{ name: m.color }] : [
            { name: 'Black' },
            { name: 'White' },
            { name: 'Navy' },
            { name: 'Brown' },
            { name: 'Gray' },
            { name: 'Blue' }
          ]
        }));

        setMaterials(mappedData);
        const uniqueCategories = [...new Set(mappedData.map(m => m.category).filter(Boolean))];
        const orderedCategories = [];
        if (uniqueCategories.includes('Men')) orderedCategories.push('Men');
        if (uniqueCategories.includes('Women')) orderedCategories.push('Women');
        if (uniqueCategories.includes('Children')) orderedCategories.push('Children');
        uniqueCategories.forEach(cat => { if (!orderedCategories.includes(cat)) orderedCategories.push(cat); });

        setCategories(['All', ...orderedCategories]);
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

    // Fetch suit types
    const fetchSuitTypes = async () => {
      try {
        const response = await getSuitTypes();
        let suitTypesData = response.data;
        if (suitTypesData && typeof suitTypesData === 'object' && !Array.isArray(suitTypesData)) {
          suitTypesData = suitTypesData.results || suitTypesData.data || suitTypesData.items || [];
        }
        if (!Array.isArray(suitTypesData)) {
          suitTypesData = [];
        }
        setSuitTypes(suitTypesData);
        // Set default suit type
        if (suitTypesData.length > 0) {
          setFormData(prev => ({ ...prev, suit_type: suitTypesData[0].id }));
        }
      } catch (error) {
        console.error("Failed to load suit types:", error);
      }
    };
    fetchSuitTypes();
  }, []);

  const filteredProducts = filter === 'All'
    ? materials
    : materials.filter(p => p.category && p.category === filter);

  const activeItem = filteredProducts[activeIdx] || filteredProducts[0];

  useEffect(() => {
    if (isPaused || selectedItem || orderSuccess || filteredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % filteredProducts.length);
      setSelectedColor(null);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, selectedItem, orderSuccess, filteredProducts]);

  // Pause autoplay when a color is selected; resume when cleared
  useEffect(() => {
    if (selectedColor !== null) {
      setIsPaused(true);
    } else {
      // Only resume autoplay if not configuring an item and no order success
      if (!selectedItem && !orderSuccess) setIsPaused(false);
    }
  }, [selectedColor, selectedItem, orderSuccess]);

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

  const updateQuantity = (val) => {
    setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity + val) }));
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openConfigurator = (item) => {
    // Pre-fill selection when opening tailoring modal from the items list
    const selColorName = (selectedColor !== null && item?.colors && item.colors[selectedColor])
      ? (typeof item.colors[selectedColor] === 'object' ? item.colors[selectedColor].name : item.colors[selectedColor])
      : formData.selected_color || '';
    setSelectedItem(item);
    setFormData(prev => ({ ...prev, material: item.id, selected_color: selColorName }));
    setActiveTab('details');
  };

  const handleSubmit = async () => {
       // REQUIRE COLOR SELECTION
    if (!formData.selected_color) {
      alert('Order color required. Please select a color before proceeding.');
      setActiveTab('bespoke'); // Move to tailoring tab where colors are
      return;
    }
    if (!formData.customer_name || !formData.customer_phone) {
      alert('Please complete contact information');
      return;
    }

    // Validate measurements – backend requires all > 0
    const requiredMeasurementFields = ['height', 'chest', 'shoulder', 'waist', 'hips', 'arm_length'];
    const numericMeasurements = {};

    for (const field of requiredMeasurementFields) {
      const raw = formData.measurements[field];
      const value = parseFloat(raw);
      if (!raw || Number.isNaN(value) || value <= 0) {
        alert(`Please enter a valid ${field.replace('_', ' ')} (must be greater than 0).`);
        return;
      }
      numericMeasurements[field] = value;
    }

    // Build payload with validated measurements
    const payload = {
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      suit_type: parseInt(formData.suit_type) || formData.suit_type,
      material: parseInt(selectedItem?.id) || selectedItem?.id,
      quantity: parseInt(formData.quantity) || 1,
      measurements: numericMeasurements
    };

    // Make selected_color required - get first color from material if available
    let defaultColor = formData.selected_color;

    // Ensure the color exists in the material's colors
    const availableColors = activeItem?.colors?.map(c => typeof c === 'object' ? c.name : c) || [];

    if (!defaultColor && availableColors.length > 0) {
      defaultColor = availableColors[0];
    }

    // Validate that the selected color is in the available colors
    if (defaultColor && availableColors.length > 0) {
      const colorMatch = availableColors.find(c =>
        c.toLowerCase() === defaultColor.toLowerCase()
      );
      if (!colorMatch) {
        // Use first available color if selected color is not valid
        defaultColor = availableColors[0];
      } else {
        defaultColor = colorMatch; // Use the exact case from available colors
      }
    }

    if (!defaultColor) {
      alert('Please select a color for your order.');
      return;
    }

    payload.selected_color = defaultColor;

    try {
      const response = await createOrder(payload);
      if (response.status === 201 || response.status === 200) {
        setOrderSuccess(response.data.order_code || "ORDER-SUCCESS");
        setSelectedItem(null);
      }
    } catch (error) {
      const errorData = error.response?.data;
      let errorMsg = 'Failed to place order. Please try again.';
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (typeof errorData === 'object') {
          // Format validation errors nicely
          const errors = Object.entries(errorData).map(([k, v]) => {
            const keyName = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const value = Array.isArray(v) ? v.join(', ') : v;
            return `${keyName}: ${value}`;
          }).join('\n');
          errorMsg = errors || 'Validation error occurred';
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      alert(errorMsg);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#080808]">
      <div className="text-red-600 font-black uppercase tracking-[0.5em] animate-pulse">LOADING...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] pt-20 md:pt-28 pb-20 px-4 md:px-16 transition-colors duration-500 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto">

        {/* TOP NAVIGATION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <header>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] mb-2">
              Bespoke Material Archive
            </motion.p>
            <h2 className="text-4xl md:text-7xl font-black text-black dark:text-white uppercase tracking-tighter leading-none">
              {filter === 'All' ? 'Full Archive' : `${filter} Edition`}
            </h2>
          </header>

          <div className="flex gap-6 overflow-x-auto no-scrollbar w-full md:w-auto py-2 border-b md:border-none dark:border-white/5">
            {categories.map((cat) => (
              <button key={cat} onClick={() => navigate(cat === 'All' ? '/items' : `/items/${cat.toLowerCase()}`)} className={`group flex flex-col items-center gap-2 transition-all ${filter === cat ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg border transition-all ${filter === cat ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xl' : 'border-gray-200 dark:border-white/10 dark:text-white'}`}>
                  {cat === 'All' && <HiOutlineSquares2X2 />}
                  {cat === 'Men' && <HiOutlineUser />}
                  {cat === 'Women' && <HiOutlineSparkles />}
                  {cat === 'Children' && <HiOutlineUserGroup />}
                  {!['All', 'Men', 'Women', 'Children'].includes(cat) && <HiOutlineCube />}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] dark:text-white">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* MAIN DISPLAY */}
          <div className="flex-[2] flex flex-col gap-6">
            <div className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-900 rounded-sm border dark:border-white/5 aspect-[4/5] lg:h-[65vh]" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeItem?.id}-${selectedColor}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 p-4 md:p-12 flex items-center justify-center"
                >
                  <div className="relative w-full h-full">
                    <img
                      src={activeItem?.img}
                      className={`w-full h-full object-contain transition-all duration-1000 ${!activeItem?.inventory?.is_available ? 'grayscale blur-sm' : ''}`}
                      alt=""
                    />
                    {selectedColor !== null && (
                      <div
                        className="absolute inset-0 mix-blend-color pointer-events-none opacity-60"
                        style={{ backgroundColor: activeItem.colors[selectedColor].hex }}
                      />
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-t from-black/60 to-transparent">
                <div className="max-w-xl text-left">
                  {/* <span className="bg-red-600 text-white text-[8px] font-bold px-3 py-1 uppercase tracking-widest mb-4 inline-block">Ref: {activeItem?.id}</span> */}
                  <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">{activeItem?.name}</h3>
                </div>
                {activeItem?.inventory?.is_available && (
                  <button onClick={() => openConfigurator(activeItem)} className="w-full md:w-auto bg-white text-black px-10 py-5 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-2xl">
                    Configure Order
                  </button>
                )}
              </div>
            </div>

            {/* COLOR GRID */}
            <div className="bg-zinc-50 dark:bg-white/5 p-4 md:p-6 rounded-sm border dark:border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 dark:text-white">
                  <HiOutlineSwatch className="text-red-600" /> Color Variations
                </h5>
                <button onClick={() => setSelectedColor(null)} className="text-[8px] font-black uppercase text-red-600 underline">Reset to True Color</button>
              </div>
              <div className="flex flex-nowrap md:grid md:grid-cols-4 lg:grid-cols-6 gap-3 overflow-x-auto no-scrollbar">
                {activeItem?.colors?.map((clr, idx) => {
                  const hexColor = clr.hex || getHexColor(clr.name);
                  const isLight = isLightColor(hexColor);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(idx)}
                      className={`flex-shrink-0 group relative p-3 rounded-sm border transition-all duration-300 ${selectedColor === idx ? 'bg-white dark:bg-white/10 border-red-600' : 'bg-transparent border-gray-200 dark:border-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full shadow-inner ${isLight ? 'border border-gray-300' : ''}`}
                          style={{ backgroundColor: hexColor }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SIDE LIST */}
          <div className="flex-1 w-full lg:max-w-[420px] flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">
              <HiOutlineQueueList size={16} className="inline mr-2 text-red-600" /> {filter} Queue
            </h4>
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:h-[75vh]">
              {filteredProducts.map((item, idx) => (
                <div key={item.id} className="min-w-[280px] lg:min-w-full">
                  <ItemCard item={item} isActive={activeIdx === idx} onClick={() => { setActiveIdx(idx); setSelectedColor(null); }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TAILORING MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: 'spring', damping: 30 }} className="relative w-full max-w-2xl h-full bg-white dark:bg-[#0c0c0c] flex flex-col shadow-2xl">

              <div className="p-6 md:p-8 border-b dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex gap-4">
                  <TabBtn active={activeTab === 'details'} onClick={() => setActiveTab('details')} label="Profile" icon={<HiOutlineInboxStack />} />
                  <TabBtn active={activeTab === 'bespoke'} onClick={() => setActiveTab('bespoke')} label="Tailoring" icon={<HiOutlineScale />} />
                </div>
                <button onClick={() => setSelectedItem(null)} className="dark:text-white hover:text-red-600 transition-colors"><HiOutlineXMark size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                {activeTab === 'details' ? (
                  <div className="space-y-8">
                    <div className="aspect-square bg-zinc-50 dark:bg-white/5 flex items-center justify-center p-6 border dark:border-white/10">
                      <img src={selectedItem.img} className="w-full h-full object-contain" alt="" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{selectedItem.category}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Premium Selection</span>
                      </div>
                      <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">{selectedItem.name}</h2>
                      <p className="text-gray-500 mt-6 italic leading-relaxed">"{selectedItem.desc}"</p>
                    </div>
                    {formData.selected_color ? (
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: getHexColor(formData.selected_color) }} />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Selected Color</p>
                            <p className="text-sm font-bold">{formData.selected_color}</p>
                          </div>
                        </div>
                        {/* <button onClick={() => { setSelectedItem(null); setIsPaused(false); }} className="text-[9px] font-black uppercase tracking-widest underline text-red-600">Change Color</button> */}
                      </div>
                    ) : null}

                    <button onClick={() => setActiveTab('bespoke')} className="w-full py-6 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all">Setup Custom Measurements</button>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 py-3 px-4 bg-zinc-50 dark:bg-white/5 border dark:border-white/5 rounded-sm">
                      <HiOutlineTag className="text-red-600" />
                      <span className="text-[9px] font-black dark:text-white uppercase tracking-widest">
                        Configuring: {selectedItem.category} / {selectedItem.name}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Select Crafting Type</p>
                      <div>
                        <select value={formData.suit_type} onChange={(e) => handleInputChange('suit_type', e.target.value)} className="w-full py-3 px-4 bg-transparent border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest">
                          {suitTypes && suitTypes.length > 0 ? (
                            suitTypes.map((st) => (
                              <option key={st.id || st} value={st.id || st}>{st.name || st}</option>
                            ))
                          ) : (
                            ['Full Suit', 'Single Piece'].map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Color Selection */}
                    {/* {activeItem?.colors && activeItem.colors.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Select Color</p>
                        <div className="grid grid-cols-4 gap-3">
                          {activeItem.colors.map((color) => {
                            // Get hex color from utility
                            const hexColor = color.hex_color || getHexColor(color.name);
                            const isSelected = formData.selected_color === color.name;
                            const isLight = isLightColor(hexColor);

                            return (
                              <button
                                key={color.id || color.name}
                                onClick={() => handleInputChange('selected_color', color.name)}
                                className={`py-3 border text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2 ${isSelected ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'border-gray-200 dark:border-white/10 dark:text-white hover:border-gray-400'}`}
                              >
                                <div
                                  className="w-6 h-6 rounded-full border-2 shadow-inner"
                                  style={{
                                    backgroundColor: hexColor,
                                    borderColor: isSelected ? '#fff' : (isLight ? '#ccc' : hexColor)
                                  }}
                                />
                                <span>{color.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )} */}

                    <div className="flex items-center justify-between bg-zinc-100 dark:bg-white/5 p-6 rounded-sm border dark:border-white/5">
                      <div>
                        <p className="text-black dark:text-white font-black uppercase text-xs">Quantity</p>
                        <p className="text-[9px] text-gray-500 uppercase mt-1 tracking-widest">How many units?</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <button onClick={() => updateQuantity(-1)} className="w-10 h-10 flex items-center justify-center rounded-full border dark:border-white/10 dark:text-white hover:bg-red-600 transition-all"><HiOutlineMinus /></button>
                        <span className="text-2xl font-black dark:text-white w-8 text-center">{formData.quantity}</span>
                        <button onClick={() => updateQuantity(1)} className="w-10 h-10 flex items-center justify-center rounded-full border dark:border-white/10 dark:text-white hover:bg-red-600 transition-all"><HiOutlinePlus /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-100 dark:bg-white/5 p-6 rounded-sm">
                      <Input label="Full Name" type="text" placeholder="Your Full Name" value={formData.customer_name} onChange={(e) => handleInputChange('customer_name', e.target.value)} />
                      <Input label="Phone Number" type="text" placeholder="09..." value={formData.customer_phone} onChange={(e) => handleInputChange('customer_phone', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {Object.keys(formData.measurements).map((key) => (
                        <Input key={key} label={key.replace('_', ' ').toUpperCase() + ' (CM)'} placeholder="0.0" value={formData.measurements[key]} onChange={(e) => handleInputChange(key, e.target.value, true)} />
                      ))}
                    </div>

                    <button onClick={handleSubmit} className="w-full py-6 bg-red-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-black transition-all">Submit Order</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{/* ORDER SUCCESS OVERLAY - Handles Copy to Paste */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOrderSuccess(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white dark:bg-[#111] max-w-md w-full p-8 text-center shadow-2xl border dark:border-white/10">
              <HiOutlineCheckBadge className="mx-auto text-green-500 mb-6" size={60} />
              
              <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Order Successfully Created</h3>
              
              <div className="my-6 space-y-2">
                <p className="text-red-600 text-[11px] font-black uppercase tracking-widest leading-relaxed">
                  Our reception will call you within 2 hours once they check your order.
                </p>
                <p className="text-gray-400 text-[9px] uppercase tracking-widest">
                  Please copy your order ID using the button below for your records.
                </p>
              </div>

              {/* Copy Section */}
              <div
                onClick={() => handleCopy(orderSuccess)}
                className="bg-zinc-100 dark:bg-white/5 p-6 border-2 border-dashed border-zinc-200 dark:border-white/10 cursor-pointer group active:scale-95 transition-all"
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Identification Code</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl font-black dark:text-white tracking-[0.2em]">{orderSuccess}</span>
                  <HiOutlineClipboardDocumentCheck className={copied ? "text-green-500" : "text-red-600"} size={24} />
                </div>
                <p className={`text-[8px] font-black uppercase tracking-widest mt-4 ${copied ? "text-green-500" : "text-gray-400"}`}>
                  {copied ? "Copied to Clipboard!" : "Click to Copy Code"}
                </p>
              </div>

              <button
                onClick={() => setOrderSuccess(null)}
                className="mt-8 w-full py-5 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-lg"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabBtn = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2 rounded-full text-[9px] font-black uppercase transition-all ${active ? 'bg-red-600 text-white shadow-lg' : 'dark:text-white hover:bg-white/10'}`}>
    {icon} {label}
  </button>
);

const Input = ({ label, placeholder, type = "number", value, onChange }) => (
  <div className="flex flex-col gap-2 text-left">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="bg-transparent border-b border-gray-200 dark:border-white/10 py-3 text-lg font-bold dark:text-white outline-none focus:border-red-600 transition-all" />
  </div>
);

export default Items;
