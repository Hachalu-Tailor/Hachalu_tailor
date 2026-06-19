import React, { useState, useEffect, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
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
  HiOutlinePencil,
  HiOutlineSwatch
} from "react-icons/hi2";
import api, { getMaterials, createMaterial, adjustStock, updateMaterial, createColor, getColors, deleteMaterial } from "../../api/api";
import ColorCreateCollection from './ColorCreateCollection';
// import { STORAGE_KEYS } from "../../utils/constants";

const normalizeColorInputValue = (value) => {
  if (!value) return "";
  return value
    .toString()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeHexValue = (value) => {
  const raw = value.toString().trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split("").map((c) => `${c}${c}`).join("").toUpperCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }
  return value;
};

const toDisplayColorNameValue = (value) => {
  const normalized = normalizeColorInputValue(value);
  if (!normalized) return "";

  const colorWithHex = normalized.match(/^color\s+#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (colorWithHex) {
    return `#${normalizeHexValue(colorWithHex[1]).replace("#", "")}`;
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const extractHexFromColorValue = (value) => {
  if (!value) return null;
  const raw = value.toString().trim();

  const directHex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (directHex) return normalizeHexValue(raw);

  const namedHex = raw.match(/^color\s+#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (namedHex) return normalizeHexValue(namedHex[1]);

  return null;
};

const toColorCssValue = (value) => {
  const parsedHex = extractHexFromColorValue(value);
  if (parsedHex) return parsedHex;

  const normalized = normalizeColorInputValue(value);
  if (!normalized) return "#6b7280";

  // Use browser named-color parser by collapsing spaces (e.g., light blue -> lightblue)
  return normalized.replace(/\s+/g, "").toLowerCase();
};

const toColorPickerValue = (value) => extractHexFromColorValue(value) || "#6B7280";

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
    material_image_file: null,
    suit_sample_image_file: null,
    category: "",
    description: ""
  });
  const [materialImagePreview, setMaterialImagePreview] = useState(null);
  const [suitSamplePreview, setSuitSamplePreview] = useState(null);
  const [stockUpdate, setStockUpdate] = useState({ action_type: "add", quantity_meters: 0 });
  const [editingImage, setEditingImage] = useState(false); // false, 'url', or 'upload'
  const [editingField, setEditingField] = useState(null); // 'category', 'description', or null
  const [editingColors, setEditingColors] = useState(false);
  const [materialColors, setMaterialColors] = useState([]);
  const [materialColorInput, setMaterialColorInput] = useState("");
  const [showCreateColorModal, setShowCreateColorModal] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [colorsLoading, setColorsLoading] = useState(false);

  const colorKey = (value) => normalizeColorInputValue(value).toLowerCase();

  const fetchAvailableColors = useCallback(async () => {
    try {
      setColorsLoading(true);
      const response = await getColors();
      let colorsData = response.data;
      if (colorsData && typeof colorsData === "object" && !Array.isArray(colorsData)) {
        colorsData = colorsData.results || colorsData.data || colorsData.items || [];
      }

      const unique = new Map();
      (colorsData || []).forEach((color) => {
        const rawName = color?.name || "";
        const displayName = toDisplayColorNameValue(rawName);
        if (!displayName) return;
        const key = colorKey(displayName);
        if (!unique.has(key)) {
          unique.set(key, {
            id: color?.id,
            name: displayName,
          });
        }
      });

      setAvailableColors(Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching available colors:", error);
    } finally {
      setColorsLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchAvailableColors();
  }, [fetchInventory, fetchAvailableColors]);

  const upsertAvailableColor = (name, id = null) => {
    const displayName = toDisplayColorNameValue(name);
    if (!displayName) return;

    setAvailableColors((prev) => {
      const key = colorKey(displayName);
      const exists = prev.some((c) => colorKey(c.name) === key);
      if (exists) return prev;
      return [...prev, { id, name: displayName }].sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const findExistingColor = (value) => {
    const key = colorKey(value);
    return availableColors.find((c) => colorKey(c.name) === key) || null;
  };

  const getFilteredAvailableColors = (query) => {
    const text = normalizeColorInputValue(query).toLowerCase();
    if (!text) return availableColors;

    return availableColors.filter((color) => {
      const colorName = color.name.toLowerCase();
      const colorHex = toColorCssValue(color.name).toLowerCase();
      return colorName.includes(text) || colorHex.includes(text);
    });
  };

  const normalizeCategory = (cat) => {
    if (!cat) return null;
    const lower = cat.toString().trim().toLowerCase();
    if (lower === 'men' || lower === 'male' || lower === "man's" || lower === 'mens') return 'Men';
    // if (lower === 'women' || lower === 'woman' || lower === 'female' || lower === "women's") return 'Women';
    if (lower === 'children' || lower === 'child' || lower === 'kids') return 'Children';
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  const BACKEND_BASE = import.meta.env.PROD
    ? 'https://hachalu-tailor.onrender.com'
    : 'http://127.0.0.1:8000';

  const getAbsoluteUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const path = url.startsWith("/") ? url.substring(1) : url;
    return `${BACKEND_BASE}/${path}`;
  };

  useEffect(() => {
    if (selectedItem) {
      // Normalize colors into simple name array
      const colors = selectedItem.colors && Array.isArray(selectedItem.colors)
        ? selectedItem.colors.map(c => c.name || c).filter(Boolean)
        : selectedItem.color ? [selectedItem.color] : [];
      setMaterialColors(colors.map(toDisplayColorNameValue));
      setMaterialColorInput("");
    } else {
      setMaterialColors([]);
      setMaterialColorInput("");
    }
  }, [selectedItem]);

  // Resolve an input (hex or name) to a proper color name.
  // Supports #hex, lowercase/UPPERCASE names, and camelCase names.
  // Missing colors are created in backend before returning.
  const resolveOrCreateColor = async (input) => {
    if (!input) return null;
    const val = input.trim();

    // hex pattern (#rgb or #rrggbb)
    const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val);
    if (hexMatch) {
      const normalizedHex = normalizeHexValue(val);
      const preferredName = `${normalizedHex}`;
      const existing = findExistingColor(preferredName);
      if (existing) return existing.name;

      try {
        const res = await createColor({ name: preferredName });
        const createdName = toDisplayColorNameValue(res.data?.name || res.name || preferredName);
        upsertAvailableColor(createdName, res.data?.id || res.id || null);
        return createdName;
      } catch (err) {
        console.error("Failed to create color for hex", err);
        return preferredName;
      }
    }

    // Otherwise treat as a name.
    const normalizedName = toDisplayColorNameValue(val);
    const existing = findExistingColor(normalizedName) || findExistingColor(val);
    if (existing) return existing.name;

    try {
      const res = await createColor({ name: normalizedName });
      const createdName = toDisplayColorNameValue(res.data?.name || res.name || normalizedName);
      upsertAvailableColor(createdName, res.data?.id || res.id || null);
      return createdName;
    } catch (err) {
      console.error("Failed to create color by name", err);
      return normalizedName;
    }
  };

  const handleAddMaterial = async (e) => {
  e.preventDefault();
  try {
    if (!newMaterial.material_image_file || !newMaterial.suit_sample_image_file) {
      alert("Please upload both images: material sample and suit sample.");
      return;
    }

    // 1. Ensure colors is ONLY an array of strings (e.g., ["Red", "Blue"])
    const cleanColors = Array.isArray(newMaterial.colors) 
      ? newMaterial.colors.map(c => typeof c === 'object' ? c.value : c).map(name => toDisplayColorNameValue(name)) 
      : [];

    const materialPayload = {
      name: newMaterial.name,
      colors: cleanColors,
      texture: newMaterial.texture,
      image_url: newMaterial.image_url || null,
      category: newMaterial.category || null,
      description: newMaterial.description || null
    };

    const formData = new FormData();
    formData.append("material", JSON.stringify(materialPayload));
    formData.append("quantity_meters", (parseFloat(newMaterial.quantity_meters) || 0).toString());
    formData.append("material_image", newMaterial.material_image_file);
    formData.append("suit_sample_image", newMaterial.suit_sample_image_file);

    await createMaterial(formData);

    setShowAddModal(false);
    setNewMaterial({
      name: "",
      colors: [],
      colorInput: "",
      texture: "",
      quantity_meters: "",
      image_url: "",
      material_image_file: null,
      suit_sample_image_file: null,
      category: "",
      description: ""
    });
    setMaterialImagePreview(null);
    setSuitSamplePreview(null);
    fetchInventory();
  } catch (error) {
    // console.error("Backend Error:", error.response?.data);
    alert(`Error: ${error.response?.data?.error || "Check console"}`);
  }
};

  const handleStockUpdate = async () => {
    if (!selectedItem) return;
    const qty = stockUpdate.quantity_meters;
    if (stockUpdate.action_type === "add" && (!qty || qty <= 0)) {
      alert("Quantity must be greater than 0 when adding stock.");
      return;
    }
    try {
      await adjustStock(selectedItem.id, stockUpdate);
      setSelectedItem(null);
      fetchInventory();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Stock update failed. Please try again.");
    }
  };

  const handleDeleteMaterial = async () => {
    if (!selectedItem) return;
    const confirmed = window.confirm(`Are you sure you want to delete "${selectedItem.name}"? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteMaterial(selectedItem.id);
      setSelectedItem(null);
      fetchInventory();
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Failed to delete material. Please try again.");
    }
  };

  const handleUpdateMaterialMedia = async (field, file) => {
    if (!selectedItem || !file) return;

    try {
      const formData = new FormData();
      formData.append(field, file);
      const response = await updateMaterial(selectedItem.id, formData);
      setSelectedItem(response.data || selectedItem);
      fetchInventory();
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      alert(error?.response?.data?.error || `Failed to update ${field}`);
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
  const addColorOptions = getFilteredAvailableColors(newMaterial.colorInput);
  const editColorOptions = getFilteredAvailableColors(materialColorInput);

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
              onClick={() => setShowCreateColorModal(true)}
              className="px-6 py-4 bg-zinc-800 dark:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 dark:hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <HiOutlineSwatch /> Add Color
            </button>
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
                              {(item.material_image || item.image_url) ? (
                                <img src={getAbsoluteUrl(item.material_image || item.image_url)} className="w-full h-full object-cover" alt={item.name} />
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
                                          style={{ backgroundColor: toColorCssValue(c.name || c) }}
                                          title={c.name || c}
                                        />
                                      ))
                                    ) : (
                                      <div
                                        className="w-3 h-3 rounded-full border border-zinc-300"
                                        style={{ backgroundColor: toColorCssValue(item.color) }}
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
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-black text-zinc-500 uppercase">Material</span>
                                  {(item.material_image || item.image_url) && (
                                    <img
                                      src={getAbsoluteUrl(item.material_image || item.image_url)}
                                      alt="Material sample"
                                      className="w-8 h-8 rounded-md object-cover border border-zinc-300 dark:border-zinc-700"
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-black text-zinc-500 uppercase">Suit</span>
                                  {item.suit_sample_image && (
                                    <img
                                      src={getAbsoluteUrl(item.suit_sample_image)}
                                      alt="Suit sample"
                                      className="w-8 h-8 rounded-md object-cover border border-zinc-300 dark:border-zinc-700"
                                    />
                                  )}
                                </div>
                              </div>
                              {item.category && <p className="text-[9px] text-red-500 uppercase font-bold mt-1">{item.category}</p>}
                              {item.description && <p className="text-[9px] text-zinc-500 mt-1 max-w-xs truncate">{item.description}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="p-6 hidden md:table-cell w-1/3">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                              <Motion.div
                                initial={{ width: 0 }} animate={{ width: `${Math.min(qty, 100)}%` }}
                                className={`h-full rounded-full ${qty === 0 ? 'bg-zinc-300' : qty < 15 ? 'bg-orange-500' : 'bg-red-600'}`}
                              />
                            </div>
                            <span className="text-xs font-black italic">{qty}m</span>
                          </div>
                        </td>

                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setTimeout(() => setEditingColors(true), 100); }}
                              className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-600/10 transition-all"
                              title="Edit Colors"
                            >
                              <HiOutlineSwatch size={16} />
                            </button>
                            <StatusBadge qty={qty} />
                          </div>
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
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden">
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedItem(null); setEditingImage(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <Motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="relative w-full max-w-full sm:max-w-2xl md:max-w-3xl bg-white dark:bg-[#0c0c0c] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/10 p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
            >
              <button onClick={() => { setSelectedItem(null); setEditingImage(false); }} className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all">
                <HiOutlineXMark size={20} />
              </button>

              {/* Material Image Display */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-200/60 dark:bg-zinc-900/60">Material Sample</div>
                  <div className="h-40">
                    {(selectedItem.material_image || selectedItem.image_url) ? (
                      <img src={getAbsoluteUrl(selectedItem.material_image || selectedItem.image_url)} alt={`${selectedItem.name} material sample`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No material sample image</div>
                    )}
                  </div>
                  <div className="p-2 border-t border-zinc-200 dark:border-zinc-700">
                    <input
                      id={`material-image-update-${selectedItem.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUpdateMaterialMedia("material_image", e.target.files?.[0])}
                    />
                    <label
                      htmlFor={`material-image-update-${selectedItem.id}`}
                      className="w-full inline-flex items-center justify-center py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-red-700 transition-all"
                    >
                      Update Material Image
                    </label>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-200/60 dark:bg-zinc-900/60">Suit Sample</div>
                  <div className="h-40">
                    {selectedItem.suit_sample_image ? (
                      <img src={getAbsoluteUrl(selectedItem.suit_sample_image)} alt={`${selectedItem.name} suit sample`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No suit sample image</div>
                    )}
                  </div>
                  <div className="p-2 border-t border-zinc-200 dark:border-zinc-700">
                    <input
                      id={`suit-image-update-${selectedItem.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUpdateMaterialMedia("suit_sample_image", e.target.files?.[0])}
                    />
                    <label
                      htmlFor={`suit-image-update-${selectedItem.id}`}
                      className="w-full inline-flex items-center justify-center py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-red-700 transition-all"
                    >
                      Update Suit Image
                    </label>
                  </div>
                </div>
              </div>

              {/* Legacy Image Display */}
              <div className="mb-6">
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-4">
                  {selectedItem.image_url ? (
                    <img src={getAbsoluteUrl(selectedItem.image_url)} alt={selectedItem.name} className="w-full h-full object-cover" />
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

                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    {editingField === 'name' ? (
                      <div className="space-y-2">
                        <input
                          id={`edit-name-${selectedItem.id}`}
                          defaultValue={selectedItem.name}
                          className="w-full bg-white dark:bg-black rounded-xl px-3 py-2 text-lg font-bold outline-none border border-zinc-200 dark:border-zinc-700"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const newValue = document.getElementById(`edit-name-${selectedItem.id}`).value;
                              try {
                                await api.patch(`/invetory/materials/${selectedItem.id}/`, { name: newValue || null });
                                setSelectedItem({ ...selectedItem, name: newValue });
                                setEditingField(null);
                                fetchInventory();
                              } catch (error) {
                                console.error('Error updating name:', error);
                                alert('Failed to update name');
                              }
                            }}
                            className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm"
                          >Save</button>
                          <button onClick={() => setEditingField(null)} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedItem.name}</h2>
                        <button onClick={() => setEditingField('name')} className="p-2 bg-white/5 rounded-md">
                          <HiOutlinePencil size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingColors(!editingColors)}
                      className="flex items-center gap-2 group"
                    >
                      {materialColors.length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {materialColors.map((c, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-800 group-hover:ring-2 ring-red-600/40 transition-all cursor-pointer"
                                style={{ backgroundColor: toColorCssValue(c), zIndex: materialColors.length - idx }}
                                title={c}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-zinc-400 uppercase font-bold">
                            {materialColors.join(', ')}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-zinc-400 uppercase font-bold italic">No colors set</span>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingColors(!editingColors)}
                      className="ml-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                      title={editingColors ? 'Close color editor' : 'Edit colors'}
                    >
                      {editingColors ? <HiOutlineXMark size={14} /> : <HiOutlinePencil size={14} />}
                    </button>
                  </div>
                </div>
                {editingField === 'texture' ? (
                  <div className="mt-2 space-y-2 w-full">
                    <input
                      id={`edit-texture-${selectedItem.id}`}
                      defaultValue={selectedItem.texture}
                      className="w-full bg-white dark:bg-black rounded-xl px-3 py-2 text-sm font-bold outline-none border border-zinc-200 dark:border-zinc-700"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const newValue = document.getElementById(`edit-texture-${selectedItem.id}`).value;
                          try {
                            await api.patch(`/invetory/materials/${selectedItem.id}/`, { texture: newValue || null });
                            setSelectedItem({ ...selectedItem, texture: newValue });
                            setEditingField(null);
                            fetchInventory();
                          } catch (error) {
                            console.error('Error updating texture:', error);
                            alert('Failed to update texture');
                          }
                        }}
                        className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm"
                      >Save</button>
                      <button onClick={() => setEditingField(null)} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">{selectedItem.texture}</p>
                    <button onClick={() => setEditingField('texture')} className="p-1 bg-white/5 rounded-md">
                      <HiOutlinePencil size={14} />
                    </button>
                  </div>
                )}

                {/* Category and Description Section - Improved Design */}
                <div className="mt-4 space-y-3">
                  {/* Colors Editor */}
                  {editingColors && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded-lg">Colors</span>
                        </div>
                        <div className="text-xs text-zinc-400">You can add hex or name</div>
                      </div>
                      <div className="mt-3">
                        <div className="max-h-36 overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-700 p-2 bg-white dark:bg-zinc-900 mb-3">
                          {colorsLoading ? (
                            <div className="text-xs text-zinc-400 px-2 py-2">Loading colors...</div>
                          ) : editColorOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {editColorOptions.map((color) => {
                                const selected = materialColors.some((c) => colorKey(c) === colorKey(color.name));
                                return (
                                  <button
                                    key={color.id || color.name}
                                    type="button"
                                    onClick={() => {
                                      if (!selected) {
                                        setMaterialColors([...materialColors, color.name]);
                                      }
                                    }}
                                    className={`flex items-center gap-2 rounded-lg border text-xs font-bold transition-all ${
                                      selected
                                        ? "bg-red-600/10 border-red-600 text-red-600"
                                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                    }`}
                                  >
                                    <span className="w-8 h-6 border border-zinc-300 rounded-l" style={{ backgroundColor: toColorCssValue(color.name) }} />
                                    <span className="px-2">{color.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-400 px-2 py-2">No matching color in backend list.</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={toColorPickerValue(materialColorInput)}
                            onChange={(e) => setMaterialColorInput(e.target.value)}
                            className="w-10 h-10 rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Color name or hex (#rrggbb)"
                            value={materialColorInput}
                            onChange={(e) => setMaterialColorInput(e.target.value)}
                            className="flex-1 bg-white dark:bg-black rounded-xl px-3 py-2 text-sm outline-none border border-zinc-200 dark:border-zinc-700"
                          />
                          <button
                            onClick={() => setShowCreateColorModal(true)}
                            className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-sm"
                          >Create Color</button>
                          <button
                            onClick={async () => {
                              const val = (materialColorInput || '').trim();
                              if (!val) return;
                              const resolved = await resolveOrCreateColor(val);
                              if (!resolved) return;
                              if (!materialColors.some((c) => colorKey(c) === colorKey(resolved))) {
                                setMaterialColors([...materialColors, resolved]);
                              }
                              upsertAvailableColor(resolved);
                              setMaterialColorInput("");
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-xl text-sm"
                          >Add</button>
                        </div>

                        {materialColors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {materialColors.map((c, idx) => (
                              <span key={idx} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border">
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: toColorCssValue(c) }} />
                                <span className="text-xs font-bold">{c}</span>
                                <button
                                  onClick={() => setMaterialColors(materialColors.filter((m, i) => i !== idx))}
                                  className="text-red-600 ml-1"
                                >&times;</button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={async () => {
                              try {
                                const resolvedColors = await Promise.all(
                                  materialColors.map(async (c) => {
                                    const resolved = await resolveOrCreateColor(c);
                                    return resolved || c;
                                  })
                                );
                                await updateMaterial(selectedItem.id, { colors: resolvedColors });
                                setSelectedItem({ ...selectedItem, colors: resolvedColors.map(c => ({ name: c })) });
                                setEditingColors(false);
                                fetchInventory();
                              } catch (error) {
                                console.error('Failed to update colors', error);
                                alert('Failed to save colors');
                              }
                            }}
                            className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm"
                          >Save Colors</button>
                          <button onClick={() => { setEditingColors(false); setMaterialColors(selectedItem.colors ? selectedItem.colors.map(c => c.name || c) : (selectedItem.color ? [selectedItem.color] : [])); }} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-xl text-sm">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}
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
                          <option value="Men">Men</option>
                          <option value="Women">Women</option>
                          <option value="Children">Children</option>
                          <option value="Cloth">Cloth</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                                let newValue = document.getElementById(`edit-category-${selectedItem.id}`).value;
                                try {
                                  const normalized = normalizeCategory(newValue || null);
                                  await api.patch(`/invetory/materials/${selectedItem.id}/`, { category: normalized || null });
                                  setSelectedItem({ ...selectedItem, category: normalized, category_slug: (normalized || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-') });
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

                <button
                  onClick={handleDeleteMaterial}
                  className="w-full py-4 mt-3 bg-red-600/10 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-red-600/20 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <HiOutlineTrash size={16} /> Delete Material
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3 p-4 bg-orange-500/5 dark:bg-red-600/5 rounded-2xl border border-orange-500/10 dark:border-red-600/10">
                <HiOutlineExclamationTriangle className="text-orange-500 shrink-0" size={20} />
                <p className="text-[9px] font-black text-orange-600/80 uppercase leading-relaxed tracking-wider">Note: All stock modifications are logged with user timestamp for audit security.</p>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Create Color Modal */}
      <ColorCreateCollection
        isOpen={showCreateColorModal}
        onClose={() => setShowCreateColorModal(false)}
        onCreated={(created) => {
          // created may be { id, name }
          const raw = created?.name || (created && created.data && created.data.name) || '';
          if (!raw) return;
          const name = toDisplayColorNameValue(raw);
          upsertAvailableColor(name, created?.id || created?.data?.id || null);

          // If editing an existing material, add to its colors list
          if (selectedItem) {
            const existing = selectedItem.colors ? selectedItem.colors.map(c => c.name || c) : (selectedItem.color ? [selectedItem.color] : []);
            if (!existing.some((c) => colorKey(c) === colorKey(name))) {
              setMaterialColors([...materialColors, name]);
              setSelectedItem({ ...selectedItem, colors: [...(selectedItem.colors || []), { name }] });
            }
          }

          // Also add to newMaterial when in Add Material modal
          if (showAddModal) {
            if (!newMaterial.colors.some((c) => colorKey(c) === colorKey(name))) {
              setNewMaterial({ ...newMaterial, colors: [...newMaterial.colors, name] });
            }
          }

          // Refresh inventory so created colors appear in backend-driven lists
          fetchInventory();
          fetchAvailableColors();
        }}
      />

      {/* ADD MATERIAL MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <Motion.div
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
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Available Colors From Backend
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-700 p-2 bg-white dark:bg-zinc-900">
                      {colorsLoading ? (
                        <div className="text-xs text-zinc-400 px-2 py-3">Loading colors...</div>
                      ) : addColorOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {addColorOptions.map((color) => {
                            const selected = newMaterial.colors.some((c) => colorKey(c) === colorKey(color.name));
                            return (
                              <button
                                key={color.id || color.name}
                                type="button"
                                onClick={() => {
                                  if (!selected) {
                                    setNewMaterial({ ...newMaterial, colors: [...newMaterial.colors, color.name] });
                                  }
                                }}
                                className={`flex items-center gap-2 rounded-lg border text-xs font-bold transition-all ${
                                  selected
                                    ? "bg-red-600/10 border-red-600 text-red-600"
                                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                                }`}
                              >
                                <span className="w-8 h-6 border border-zinc-300 rounded-l" style={{ backgroundColor: toColorCssValue(color.name) }} />
                                <span className="px-2">{color.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-400 px-2 py-3">No matching backend color. Type a name or hex, then click Add to create it.</div>
                      )}
                    </div>

                    {/* Custom Color Input */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={toColorPickerValue(newMaterial.colorInput)}
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
                            onClick={() => setShowCreateColorModal(true)}
                            className="px-3 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase ml-2"
                          >Create Color</button>
                      <button
                        type="button"
                        className="px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase"
                        onClick={async () => {
                          const val = newMaterial.colorInput.trim();
                          if (!val) return;
                          const resolved = await resolveOrCreateColor(val);
                          if (!resolved) return;
                          if (!newMaterial.colors.some((c) => colorKey(c) === colorKey(resolved))) {
                            setNewMaterial({ ...newMaterial, colors: [...newMaterial.colors, resolved], colorInput: "" });
                          }
                          upsertAvailableColor(resolved);
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
                            <span style={{ backgroundColor: toColorCssValue(color) }} className="w-4 h-4 rounded-full border border-zinc-300 inline-block mr-1" />
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

                {/* Image Upload Section (two file uploads required) */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Material Sample Image *</label>
                  <div className="relative mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setMaterialImagePreview(reader.result);
                          setNewMaterial({ ...newMaterial, material_image_file: file });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                      id="material-image-upload"
                    />
                    <label
                      htmlFor="material-image-upload"
                      className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-600/5 transition-all"
                    >
                      <HiOutlineCloudArrowUp className="text-zinc-400 mb-2" size={28} />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Upload Material Sample</span>
                    </label>
                  </div>
                  {materialImagePreview && (
                    <div className="mt-2 relative">
                      <img src={materialImagePreview} alt="Material sample preview" className="w-full h-28 rounded-2xl object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setMaterialImagePreview(null);
                          setNewMaterial({ ...newMaterial, material_image_file: null });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                      >
                        <HiOutlineTrash size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Suit Sample Image *</label>
                  <div className="relative mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSuitSamplePreview(reader.result);
                          setNewMaterial({ ...newMaterial, suit_sample_image_file: file });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                      id="suit-sample-image-upload"
                    />
                    <label
                      htmlFor="suit-sample-image-upload"
                      className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-600/5 transition-all"
                    >
                      <HiOutlineCloudArrowUp className="text-zinc-400 mb-2" size={28} />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Upload Suit Sample</span>
                    </label>
                  </div>
                  {suitSamplePreview && (
                    <div className="mt-2 relative">
                      <img src={suitSamplePreview} alt="Suit sample preview" className="w-full h-28 rounded-2xl object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSuitSamplePreview(null);
                          setNewMaterial({ ...newMaterial, suit_sample_image_file: null });
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
            </Motion.div>
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
