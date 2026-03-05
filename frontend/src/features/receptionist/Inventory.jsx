import React, { useState, useEffect, useRef } from "react";
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
  HiOutlineCheckBadge,
  HiOutlineCloudArrowUp,
  HiOutlineTrash,
  HiOutlinePencil
} from "react-icons/hi2";
import api, { getMaterials, createMaterial, adjustStock, getColorsFromMaterials } from "../../api/api";
import { getHexColor, isLightColor, getAvailableColors } from "../../utils/colors";
import { STORAGE_KEYS } from "../../utils/constants";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockStatus, setStockStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    colors: [], // Array of color names
    colorInput: "", // For input field
    texture: "",
    quantity_meters: "",
    image_url: "",
    imageFile: null,
    category: "",
    description: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageInput, setShowImageInput] = useState("url"); // 'url' or 'upload'
  const fileInputRef = useRef(null);
  const [stockUpdate, setStockUpdate] = useState({ action_type: "add", quantity_meters: 0 });
  const [editingImage, setEditingImage] = useState(false); // false, 'url', or 'upload'
  const [editingField, setEditingField] = useState(null); // 'category', 'description', or null

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await getMaterials();
      // Handle both array and paginated responses
      let materialsData = response.data;
      if (materialsData && typeof materialsData === 'object' && !Array.isArray(materialsData)) {
        materialsData = materialsData.results || materialsData.data || materialsData.items || [];
      }
      setInventory(materialsData || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e) => {
  e.preventDefault();
  try {
    // 1. Ensure colors is ONLY an array of strings (e.g., ["Red", "Blue"])
    const cleanColors = Array.isArray(newMaterial.colors) 
      ? newMaterial.colors.map(c => typeof c === 'object' ? c.value : c) 
      : [];

    const materialData = {
      material: {
        name: newMaterial.name,
        colors: cleanColors, // Send the clean array
        texture: newMaterial.texture,   
        image_url: newMaterial.image_url || null,
        category: newMaterial.category || null,
        description: newMaterial.description || null
      },
      quantity_meters: parseFloat(newMaterial.quantity_meters) || 0
    };

    console.log("POSTING TO BACKEND:", JSON.stringify(materialData, null, 2));
    await createMaterial(materialData);

    setShowAddModal(false);
    setNewMaterial({
      name: "",
      colors: [],
      colorInput: "",
      texture: "",
      quantity_meters: "",
      image_url: "",
      category: "",
      description: ""
    });
    fetchInventory();
  } catch (error) {
    console.error("Backend Error:", error.response?.data);
    alert(`Error: ${error.response?.data?.error || "Check console"}`);
  }
};

  const handleStockUpdate = async () => {
    if (!selectedItem) return;
    try {
      await adjustStock(selectedItem.id, stockUpdate);
      setSelectedItem(null);
      fetchInventory();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Stock update failed. Please try again.");
    }
  };

  const filteredData = inventory.filter((item) => {
    // Handle both old format (color string) and new format (colors array)
    const materialColors = item.colors && Array.isArray(item.colors)
      ? item.colors.map(c => c.name || c).join(' ').toLowerCase()
      : (item.color || '').toLowerCase();

    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase()) ||
      materialColors.includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase());
    const qty = parseFloat(item.inventory?.quantity_meters || 0);
    const matchStatus =
      stockStatus === "all" ? true :
        stockStatus === "in-stock" ? qty > 0 :
          qty === 0;
    return matchSearch && matchStatus;
  });

  const depletedCount = inventory.filter(i => parseFloat(i.inventory?.quantity_meters || 0) === 0).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2 md:py-10">
        {/* HEADER & KPI HUD */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase flex items-center gap-2">
              <HiOutlineCube className="text-red-600" /> Stock <span className="text-red-600">Matrix</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-1">Material Asset Management Protocol</p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <KPICard label="Active Units" value={inventory.length} />
            <KPICard label="Depleted" value={depletedCount} highlight />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <HiOutlinePlus /> Add Material
            </button>
          </div>
        </header>

        {/* CONTROLS AREA */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-6 lg:col-span-7 relative">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="SEARCH BY MATERIAL NAME OR COLOR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-red-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none transition-all"
            />
          </div>

          <div className="md:col-span-6 lg:col-span-5 flex gap-2">
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                    <th className="p-6">Material Profile</th>
                    <th className="p-6 hidden md:table-cell">Inventory Health</th>
                    <th className="p-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-800">
                  {filteredData.map((item) => {
                    const qty = parseFloat(item.inventory?.quantity_meters || 0);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-all"
                      >
                        <td className="p-4 md:p-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 ${qty === 0 ? 'grayscale' : ''}`}>
                              {item.image_url ? (
                                <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                                  <span className="text-2xl font-black text-zinc-400 italic">{item.name?.charAt(0) || '?'}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm md:text-base font-black uppercase italic tracking-tight">{item.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {/* Color swatch */}
                                {(item.color || (item.colors && item.colors.length > 0)) && (
                                  <div className="flex items-center gap-1">
                                    {item.colors && item.colors.length > 0 ? (
                                      item.colors.slice(0, 3).map((c, idx) => (
                                        <div
                                          key={idx}
                                          className="w-3 h-3 rounded-full border border-zinc-300"
                                          style={{ backgroundColor: getHexColor(c.name || c) }}
                                          title={c.name || c}
                                        />
                                      ))
                                    ) : (
                                      <div
                                        className="w-3 h-3 rounded-full border border-zinc-300"
                                        style={{ backgroundColor: getHexColor(item.color) }}
                                        title={item.color}
                                      />
                                    )}
                                    <span className="text-[10px] text-zinc-400 uppercase font-bold">
                                      {item.color || (item.colors && item.colors[0]?.name) || ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 uppercase font-bold">{item.texture}</p>
                              {item.category && <p className="text-[9px] text-red-500 uppercase font-bold mt-1">{item.category}</p>}
                              {item.description && <p className="text-[9px] text-zinc-500 mt-1 max-w-xs truncate">{item.description}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="p-6 hidden md:table-cell w-1/3">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${Math.min(qty, 100)}%` }}
                                className={`h-full rounded-full ${qty === 0 ? 'bg-zinc-300' : qty < 15 ? 'bg-orange-500' : 'bg-red-600'}`}
                              />
                            </div>
                            <span className="text-xs font-black italic">{qty}m</span>
                          </div>
                        </td>

                        <td className="p-6 text-right">
                          <StatusBadge qty={qty} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredData.length === 0 && (
            <div className="p-12 text-center">
              <HiOutlineCube size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">No materials found</p>
            </div>
          )}
        </main>
      </div>

      {/* STOCK MANAGEMENT MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedItem(null); setEditingImage(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0c0c0c] rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10 p-8"
            >
              <button onClick={() => { setSelectedItem(null); setEditingImage(false); }} className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all">
                <HiOutlineXMark size={20} />
              </button>

              {/* Material Image Display */}
              <div className="mb-6">
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-4">
                  {selectedItem.image_url ? (
                    <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                      <span className="text-6xl font-black text-zinc-300 dark:text-zinc-600 italic">{selectedItem.name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setEditingImage(!editingImage)}
                    className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-all"
                  >
                    {editingImage ? <HiOutlineXMark size={16} /> : <HiOutlinePencil size={16} />}
                  </button>
                </div>

                {/* Inline Image Edit */}
                {editingImage && (
                  <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl mb-4">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-2">Choose Image Source</p>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setEditingImage('url')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${editingImage === 'url' ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
                          }`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingImage('upload')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${editingImage === 'upload' ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700'
                          }`}
                      >
                        Upload
                      </button>
                    </div>

                    {editingImage === 'url' ? (
                      <>
                        <input
                          type="url"
                          placeholder="Enter image URL..."
                          defaultValue={selectedItem.image_url || ''}
                          id={`edit-image-${selectedItem.id}`}
                          className="w-full bg-white dark:bg-black rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const newUrl = document.getElementById(`edit-image-${selectedItem.id}`).value;
                              try {
                                await api.patch(`/invetory/materials/${selectedItem.id}/`, { image_url: newUrl });
                                setSelectedItem({ ...selectedItem, image_url: newUrl });
                                setEditingImage(false);
                                fetchInventory();
                              } catch (error) {
                                console.error("Error updating image:", error);
                                alert("Failed to update image");
                              }
                            }}
                            className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase"
                          >
                            Save URL
                          </button>
                          <button
                            onClick={() => setEditingImage(false)}
                            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl text-[10px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id={`edit-image-file-${selectedItem.id}`}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                // Read file as data URL and save as image_url
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const dataUrl = reader.result;
                                  const response = await api.patch(`/invetory/materials/${selectedItem.id}/`, { image_url: dataUrl });
                                  setSelectedItem({ ...selectedItem, image_url: response.data.image_url });
                                  setEditingImage(false);
                                  fetchInventory();
                                };
                                reader.readAsDataURL(file);
                              } catch (error) {
                                console.error("Error uploading image:", error);
                                alert("Failed to upload image");
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor={`edit-image-file-${selectedItem.id}`}
                          className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl cursor-pointer hover:border-red-600 transition-all"
                        >
                          <HiOutlineCloudArrowUp className="text-zinc-400 mb-1" size={20} />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Click to select file</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedItem.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {/* Color display with visual swatches */}
                  {(selectedItem.color || (selectedItem.colors && selectedItem.colors.length > 0)) && (
                    <div className="flex items-center gap-2">
                      {selectedItem.colors && selectedItem.colors.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-2">
                            {selectedItem.colors.map((c, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-800"
                                style={{ backgroundColor: getHexColor(c.name || c), zIndex: selectedItem.colors.length - idx }}
                                title={c.name || c}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-zinc-400 uppercase font-bold">
                            {selectedItem.colors.map(c => c.name || c).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded-full border border-zinc-300"
                            style={{ backgroundColor: getHexColor(selectedItem.color) }}
                          />
                          <span className="text-[10px] text-zinc-400 uppercase font-bold">
                            {selectedItem.color}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 uppercase font-bold mt-1">{selectedItem.texture}</p>

                {/* Category and Description Section - Improved Design */}
                <div className="mt-4 space-y-3">
                  {/* Category Edit */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded-lg">Category</span>
                      </div>
                      {editingField !== 'category' && (
                        <button
                          onClick={() => setEditingField('category')}
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                        >
                          <HiOutlinePencil size={12} />
                        </button>
                      )}
                    </div>
                    {editingField === 'category' ? (
                      <div className="mt-3 space-y-2">
                        <select
                          id={`edit-category-${selectedItem.id}`}
                          defaultValue={selectedItem.category || ''}
                          className="w-full bg-white dark:bg-black rounded-xl px-3 py-2 text-sm font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 ring-red-600/20"
                        >
                          <option value="">Select Category</option>
                          <option value="Child">Child</option>
                          <option value="Men">Men</option>
                          {/* <option value="Woman">Woman</option> */}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const newValue = document.getElementById(`edit-category-${selectedItem.id}`).value;
                              try {
                                await api.patch(`/invetory/materials/${selectedItem.id}/`, { category: newValue || null });
                                setSelectedItem({ ...selectedItem, category: newValue });
                                setEditingField(null);
                                fetchInventory();
                              } catch (error) {
                                console.error('Error updating category:', error);
                                alert('Failed to update category');
                              }
                            }}
                            className="flex-1 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl text-[10px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="mt-2 text-sm font-bold text-zinc-700 dark:text-zinc-300"
                      >
                        {selectedItem.category || <span className="text-zinc-400 italic">Not set</span>}
                      </p>
                    )}
                  </div>

                  {/* Description Edit */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded-lg">Description</span>
                      </div>
                      {editingField !== 'description' && (
                        <button
                          onClick={() => setEditingField('description')}
                          className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                        >
                          <HiOutlinePencil size={12} />
                        </button>
                      )}
                    </div>
                    {editingField === 'description' ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          defaultValue={selectedItem.description || ''}
                          id={`edit-description-${selectedItem.id}`}
                          placeholder="Enter material description..."
                          rows={3}
                          className="w-full bg-white dark:bg-black rounded-xl px-3 py-2 text-sm font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 ring-red-600/20 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const newValue = document.getElementById(`edit-description-${selectedItem.id}`).value;
                              try {
                                await api.patch(`/invetory/materials/${selectedItem.id}/`, { description: newValue || null });
                                setSelectedItem({ ...selectedItem, description: newValue });
                                setEditingField(null);
                                fetchInventory();
                              } catch (error) {
                                console.error('Error updating description:', error);
                                alert('Failed to update description');
                              }
                            }}
                            className="flex-1 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingField(null)}
                            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl text-[10px] font-black uppercase"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
                      >
                        {selectedItem.description || <span className="text-zinc-400 italic">No description provided</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-white/5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Current Stock</span>
                <StatusBadge qty={parseFloat(selectedItem.inventory?.quantity_meters || 0)} />
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Update Stock</label>
                  <div className="flex items-center gap-4 mt-3">
                    <select
                      value={stockUpdate.action_type}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, action_type: e.target.value })}
                      className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="add">Add</option>
                      <option value="set">Set (Override)</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      value={stockUpdate.quantity_meters}
                      onChange={(e) => setStockUpdate({ ...stockUpdate, quantity_meters: parseFloat(e.target.value) || 0 })}
                      className="flex-1 bg-zinc-50 dark:bg-black text-center text-2xl font-black italic rounded-2xl py-3 border-none outline-none focus:ring-2 ring-red-600/20 dark:text-white"
                    />
                    <span className="text-sm font-bold">meters</span>
                  </div>
                </div>

                <button
                  onClick={handleStockUpdate}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-xl shadow-red-600/20 hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all"
                >
                  Commit Update
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3 p-4 bg-orange-500/5 dark:bg-red-600/5 rounded-2xl border border-orange-500/10 dark:border-red-600/10">
                <HiOutlineExclamationTriangle className="text-orange-500 shrink-0" size={20} />
                <p className="text-[9px] font-black text-orange-600/80 uppercase leading-relaxed tracking-wider">Note: All stock modifications are logged with user timestamp for audit security.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD MATERIAL MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-8 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                <HiOutlineXMark size={20} />
              </button>

              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6">New Material</h2>

              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Name *</label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Colors *</label>
                  {/* Multi-Color Picker */}
                  <div className="mt-2 space-y-2">
                    {/* Predefined Colors Grid */}
                    <div className="grid grid-cols-5 gap-2">
                      {getAvailableColors().slice(0, 15).map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            if (!newMaterial.colors.includes(color.name)) {
                              setNewMaterial({ ...newMaterial, colors: [...newMaterial.colors, color.name] });
                            }
                          }}
                          className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                            newMaterial.colors.includes(color.name)
                              ? 'border-red-600 ring-2 ring-red-600/30'
                              : 'border-zinc-200 dark:border-zinc-700'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    {/* Custom Color Input */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={getHexColor(newMaterial.colorInput) || '#6b7280'}
                        onChange={(e) => setNewMaterial({ ...newMaterial, colorInput: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-zinc-200 dark:border-zinc-700"
                      />
                      <input
                        type="text"
                        value={newMaterial.colorInput}
                        onChange={(e) => setNewMaterial({ ...newMaterial, colorInput: e.target.value })}
                        placeholder="Or type color name..."
                        className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase"
                        onClick={() => {
                          const val = newMaterial.colorInput.trim();
                          if (val && !newMaterial.colors.includes(val)) {
                            setNewMaterial({ ...newMaterial, colors: [...newMaterial.colors, val], colorInput: "" });
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {/* Selected Colors List */}
                    {newMaterial.colors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newMaterial.colors.map((color, idx) => (
                          <span key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-xs font-bold">
                            <span style={{ backgroundColor: getHexColor(color) }} className="w-4 h-4 rounded-full border border-zinc-300 inline-block mr-1" />
                            {color}
                            <button
                              type="button"
                              className="ml-1 text-red-600 hover:text-red-800"
                              onClick={() => setNewMaterial({ ...newMaterial, colors: newMaterial.colors.filter((c, i) => i !== idx) })}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Texture *</label>
                  <input
                    type="text"
                    value={newMaterial.texture}
                    onChange={(e) => setNewMaterial({ ...newMaterial, texture: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                  <select
                    value={newMaterial.category}
                    onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    <option value="Child">Child</option>
                    <option value="Men">Men</option>
                    <option value="Woman">Woman</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    placeholder="Enter material description..."
                    rows={3}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quantity (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMaterial.quantity_meters}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantity_meters: e.target.value })}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Material Image</label>

                  {/* Toggle between URL and File upload */}
                  <div className="flex gap-2 mt-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setShowImageInput("url")}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${showImageInput === "url"
                        ? "bg-red-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImageInput("upload")}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${showImageInput === "upload"
                        ? "bg-red-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        }`}
                    >
                      Upload File
                    </button>
                  </div>

                  {showImageInput === "url" ? (
                    <input
                      type="url"
                      placeholder="https://example.com/material-image.jpg"
                      value={newMaterial.image_url}
                      onChange={(e) => setNewMaterial({ ...newMaterial, image_url: e.target.value })}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20"
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Create preview URL
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImagePreview(reader.result);
                              setNewMaterial({ ...newMaterial, image_url: reader.result, imageFile: file });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="material-image-upload"
                      />
                      <label
                        htmlFor="material-image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-600/5 transition-all"
                      >
                        <HiOutlineCloudArrowUp className="text-zinc-400 mb-2" size={32} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Click to upload image</span>
                        <span className="text-[8px] text-zinc-500 mt-1">PNG, JPG, WEBP up to 5MB</span>
                      </label>
                    </div>
                  )}

                  {/* Image Preview */}
                  {(imagePreview || newMaterial.image_url) && (
                    <div className="mt-3 relative">
                      <div className="w-full h-32 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={imagePreview || newMaterial.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setNewMaterial({ ...newMaterial, image_url: "", imageFile: null });
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-700 transition-all mt-4"
                >
                  Create Material
                </button>
              </form>
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
