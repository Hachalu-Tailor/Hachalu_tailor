import React, { useState, useEffect, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineUserPlus, HiOutlineTrash,
  HiOutlinePhone, HiOutlineShieldCheck, HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineEllipsisVertical,
  HiOutlineEnvelopeOpen, HiOutlineChatBubbleBottomCenterText,
  HiOutlineFingerPrint, HiOutlineChevronDown,
  HiOutlineSignal
} from 'react-icons/hi2';
import { listStaff, addStaff, deleteStaff } from '../../api/api';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    role: 'RECEPTIONIST'
  });

  useEffect(() => { loadStaff(); }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await listStaff();
      // Handle both array and paginated responses
      let staffData = res.data;
      if (staffData && typeof staffData === 'object' && !Array.isArray(staffData)) {
        staffData = staffData.results || staffData.data || staffData.items || [];
      }
      setStaff(staffData || []);
    } catch {
      console.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form data first
    if (!formData.email || !formData.full_name || !formData.phone_number) {
      alert("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // Check if email already exists in staff list
    const emailExists = staff.some(s => s.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
      alert("A staff member with this email already exists. Please use a different email.");
      setLoading(false);
      return;
    }

    // Check if phone number already exists in staff list
    const phoneExists = staff.some(s => s.phone_number === formData.phone_number);
    if (phoneExists) {
      alert("A staff member with this phone number already exists. Please use a different phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await addStaff(formData);
      setCreatedUser({ ...res.data, email: formData.email });
      setFormData({ email: '', full_name: '', phone_number: '', role: 'RECEPTIONIST' });
      loadStaff();
    } catch (err) {
      // Show more specific error message based on the error response
      const errorData = err.response?.data;
      let errorMsg = "Creation failed. Please try again.";

      if (errorData) {
        if (errorData.error) {
          errorMsg = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (typeof errorData === 'object') {
          // Check for specific field errors
          if (errorData.email) {
            errorMsg = `Email error: ${Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email}`;
          } else if (errorData.phone_number) {
            errorMsg = `Phone error: ${Array.isArray(errorData.phone_number) ? errorData.phone_number.join(', ') : errorData.phone_number}`;
          } else {
            // Format all field errors
            errorMsg = Object.entries(errorData).map(([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
            ).join('\n');
          }
        }
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) =>
      (s?.full_name || '').toLowerCase().includes(q)
      || (s?.email || '').toLowerCase().includes(q)
      || (s?.phone_number || '').toLowerCase().includes(q)
      || (s?.role || '').toLowerCase().includes(q)
    );
  }, [staff, searchTerm]);

  const roleSummary = useMemo(() => {
    return staff.reduce((acc, s) => {
      const role = s?.role || 'UNKNOWN';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  }, [staff]);

  const getRoleBadgeClass = (role) => {
    if (role === 'ADMIN') return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
    if (role === 'GARMENT') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
    if (role === 'RECEPTIONIST') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    return 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-3 md:p-5 transition-colors duration-500">

      {/* --- HUD HEADER --- */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-[#0a0a0a] p-5 md:p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-xl shadow-black/5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic flex items-center gap-2">
              Staff <span className="text-red-600">Management</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:min-w-[300px]">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search name, email, phone, role"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-red-600/40 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold outline-none transition-all text-gray-800 dark:text-white placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => { setCreatedUser(null); setShowAddModal(true); }}
              className="bg-red-600 text-white px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] hover:bg-red-700 transition-all shadow-lg shadow-red-600/25 flex items-center gap-2"
            >
              <HiOutlineUserPlus size={18} /> Add Staff
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <SummaryTile label="Total" value={staff.length} tone="slate" />
          <SummaryTile label="Admin" value={roleSummary.ADMIN || 0} tone="red" />
          <SummaryTile label="Reception" value={roleSummary.RECEPTIONIST || 0} tone="emerald" />
          <SummaryTile label="Garment" value={roleSummary.GARMENT || 0} tone="blue" />
        </div>
      </div>

      {/* --- STAFF LISTING --- */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-5 md:px-6 py-4">Member</th>
                <th className="px-5 md:px-6 py-4 hidden md:table-cell">Role</th>
                <th className="px-5 md:px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading staff...</td>
                </tr>
              )}
              {!loading && filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No staff found for this search.</td>
                </tr>
              )}
              {filteredStaff.map((person) => (
                <tr
                  key={person.id}
                  onClick={() => setSelectedStaff(person)}
                  className="group cursor-pointer hover:bg-red-600/5 transition-colors"
                >
                  <td className="px-5 md:px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-red-600 italic group-hover:scale-105 transition-transform">
                        {(person.full_name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{person.full_name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{person.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 md:px-6 py-4 hidden md:table-cell">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${getRoleBadgeClass(person.role)}`}>
                      {person.role}
                    </span>
                  </td>
                  <td className="px-5 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-[10px] font-black text-red-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wide">
                      View Profile <HiOutlineEllipsisVertical size={18} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- STAFF DETAILS OVERLAY MODAL --- */}
      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <Motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0c] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.35)] overflow-hidden border border-gray-200 dark:border-white/10"
            >
              <div className="p-6 md:p-8 text-center">
                {/* Close Button */}
                <button onClick={() => setSelectedStaff(null)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400 hover:text-red-600 transition-all">
                  <HiOutlineXMark size={20} />
                </button>

                <div className="mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-red-900 mx-auto mb-4 flex items-center justify-center text-white text-4xl font-black italic shadow-xl shadow-red-600/40">
                    {(selectedStaff.full_name || '?').charAt(0)}
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">{selectedStaff.full_name}</h2>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mt-1">{selectedStaff.role} Access</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <DetailCard icon={<HiOutlineEnvelopeOpen />} label="Network Email" value={selectedStaff.email} />
                  <DetailCard icon={<HiOutlinePhone />} label="Voice Terminal" value={selectedStaff.phone_number || 'OFFLINE'} />
                  <DetailCard icon={<HiOutlineFingerPrint />} label="Unique System ID" value={`ID-${selectedStaff.id}00X`} />
                  <DetailCard icon={<HiOutlineSignal />} label="Signal Status" value="ENCRYPTED" />
                </div>

                <div className="mt-8 flex flex-col md:flex-row gap-3">
                  <button className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all flex items-center justify-center gap-2">
                    <HiOutlineChatBubbleBottomCenterText size={20} /> Establish Comms
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`REVOKE ALL ACCESS FOR ${selectedStaff.full_name}?`)) {
                        deleteStaff(selectedStaff.id).then(() => {
                          setSelectedStaff(null);
                          loadStaff();
                        });
                      }
                    }}
                    className="flex-1 py-4 text-red-600 border-2 border-dashed border-red-600/30 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-red-600 hover:text-white hover:border-solid transition-all flex items-center justify-center gap-2"
                  >
                    <HiOutlineTrash size={20} /> Revoke Node
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD STAFF MODAL (Already exists in your flow) --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop & Content for Add Modal - Keeping your logic here */}
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!loading) setShowAddModal(false); }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <Motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#080808] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-white/10"
            >
              {!createdUser ? (
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">Add <span className="text-red-600">Staff</span></h2>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Generate temporary credentials</p>
                  </div>
                  <div className="space-y-4">
                    <Input label="Full Identity" type="text" placeholder="RECEP NAME" value={formData.full_name} onChange={(v) => setFormData({ ...formData, full_name: v })} />
                    <Input label="System Node Email" type="email" placeholder="STAFF@SYSTEM.COM" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                    <Input label="Terminal Phone" type="text" placeholder="+251..." value={formData.phone_number} onChange={(v) => setFormData({ ...formData, phone_number: v })} />
                    {/* Select button from admin or receptionist */}
                    {/* --- ROLE DROP SELECT --- */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Access Level</label>
                      <div className="relative">
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl text-xs font-bold tracking-wide outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-[#BA181B] uppercase text-gray-800 dark:text-white"
                        >
                          <option value="RECEPTIONIST">Receptionist (Standard)</option>
                          <option value="GARMENT">Garment (Tailor)</option>
                          <option value="ADMIN">Admin (Root Access)</option>
                        </select>
                        <HiOutlineChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#BA181B]" size={18} />
                      </div>
                    </div>
                  </div>
                  <button disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-red-700 transition-all">
                    {loading ? 'SYNCING...' : 'INITIATE AUTHORIZATION'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><HiOutlineShieldCheck size={40} /></div>
                  <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic mb-8">{createdUser.message}</h3>
                  <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-red-600/30 p-10 rounded-[2.5rem] mb-10">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">One-Time Security Token</p>
                    <span className="text-4xl font-mono font-black text-red-600 tracking-widest select-all">{createdUser.temporary_password}</span>
                  </div>
                  <button onClick={() => { setShowAddModal(false); setCreatedUser(null); }} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-wider">CLOSE TERMINAL</button>
                </div>
              )}
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* --- MINI COMPONENTS --- */

const DetailCard = ({ icon, label, value }) => (
  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-red-600/10 transition-all">
    <div className="flex items-center gap-4">
      <div className="text-red-600 opacity-60">{React.cloneElement(icon, { size: 22 })}</div>
      <div>
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-[11px] font-bold text-gray-800 dark:text-white uppercase truncate">{value}</p>
      </div>
    </div>
  </div>
);

const Input = ({ label, type, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">{label}</label>
    <input
      required type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 focus:border-red-600 p-4 rounded-xl text-[11px] font-bold tracking-wide outline-none text-gray-800 dark:text-white transition-all"
    />
  </div>
);

const SummaryTile = ({ label, value, tone }) => {
  const toneClass = {
    slate: 'bg-white border-gray-200 text-gray-800 dark:bg-white/5 dark:border-white/10 dark:text-gray-100',
    red: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300',
    blue: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300',
  };

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass[tone] || toneClass.slate}`}>
      <p className="text-[9px] font-black uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-xl font-black leading-tight">{value}</p>
    </div>
  );
};

export default StaffManagement;