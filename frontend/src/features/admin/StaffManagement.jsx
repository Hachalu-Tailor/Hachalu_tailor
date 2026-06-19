import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineUserPlus, HiOutlineTrash, HiOutlineEnvelope,
  HiOutlinePhone, HiOutlineShieldCheck, HiOutlineXMark,
  HiOutlineClipboardDocumentCheck, HiOutlineMagnifyingGlass,
  HiOutlineIdentification, HiOutlineEllipsisVertical,
  HiOutlineEnvelopeOpen, HiOutlineChatBubbleBottomCenterText,
  HiOutlineBriefcase, HiOutlineFingerPrint, HiOutlineCalendarDays, HiOutlineChevronDown,
  HiOutlineSignal, HiOutlineClipboard
} from 'react-icons/hi2';
import { listStaff, addStaff, deleteStaff } from '../../api/api';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyText, setCopyText] = useState('COPY');

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
    } catch (err) {
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
      setCopied(false);
      setCopyText('COPY');
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

  const filteredStaff = staff.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] p-4 md:p-8 lg:p-12 transition-colors duration-500">

      {/* --- HUD HEADER --- */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-[#0a0a0a] p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-black/5">
          <div>
            <h1 className="text-3xl font-black dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
              Personnel <span className="text-red-600">Terminal</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Active System Nodes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:min-w-[350px]">
              <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="SEARCH STAFF IDENTITY..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-red-600/30 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none transition-all dark:text-white"
              />
            </div>
            <button
              onClick={() => { setCreatedUser(null); setShowAddModal(true); }}
              className="bg-red-600 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-red-600/30 flex items-center gap-3"
            >
              <HiOutlineUserPlus size={20} /> Authorize New
            </button>
          </div>
        </div>
      </div>

      {/* --- STAFF LISTING --- */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                <th className="px-10 py-7">Member Profile</th>
                <th className="px-10 py-7 hidden md:table-cell">Privilege</th>
                <th className="px-10 py-7 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {filteredStaff.map((person) => (
                <tr
                  key={person.id}
                  onClick={() => setSelectedStaff(person)}
                  className="group cursor-pointer hover:bg-red-600/5 transition-all"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-red-600 italic group-hover:scale-110 transition-transform">
                        {person.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black dark:text-white uppercase tracking-tight">{person.full_name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{person.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 hidden md:table-cell">
                    <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${person.role === 'ADMIN' ? 'bg-red-600/10 text-red-600' :
                      person.role === 'GARMENT' ? 'bg-blue-600/10 text-blue-600' :
                        'bg-gray-100 dark:bg-white/5 text-gray-400'
                      }`}>
                      {person.role}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-[9px] font-black text-red-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase italic tracking-widest">
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
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0c] rounded-[4rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden border dark:border-white/10"
            >
              <div className="p-10 md:p-14 text-center">
                {/* Close Button */}
                <button onClick={() => setSelectedStaff(null)} className="absolute top-8 right-8 p-3 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400 hover:text-red-600 transition-all">
                  <HiOutlineXMark size={24} />
                </button>

                <div className="mb-10">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-red-600 to-red-900 mx-auto mb-6 flex items-center justify-center text-white text-5xl font-black italic shadow-2xl shadow-red-600/40">
                    {selectedStaff.full_name.charAt(0)}
                  </div>
                  <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter">{selectedStaff.full_name}</h2>
                  <p className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em] mt-2">{selectedStaff.role} Access Protocol</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <DetailCard icon={<HiOutlineEnvelopeOpen />} label="Network Email" value={selectedStaff.email} />
                  <DetailCard icon={<HiOutlinePhone />} label="Voice Terminal" value={selectedStaff.phone_number || 'OFFLINE'} />
                  <DetailCard icon={<HiOutlineFingerPrint />} label="Unique System ID" value={`ID-${selectedStaff.id}00X`} />
                  <DetailCard icon={<HiOutlineSignal />} label="Signal Status" value="ENCRYPTED" />
                </div>

                <div className="mt-12 flex flex-col md:flex-row gap-4">
                  <button className="flex-1 py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all flex items-center justify-center gap-3">
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
                    className="flex-1 py-5 text-red-600 border-2 border-dashed border-red-600/20 rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-solid transition-all flex items-center justify-center gap-3"
                  >
                    <HiOutlineTrash size={20} /> Revoke Node
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD STAFF MODAL (Already exists in your flow) --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop & Content for Add Modal - Keeping your logic here */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!loading) setShowAddModal(false); }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#080808] rounded-[4rem] p-10 md:p-14 border dark:border-white/10"
            >
              {!createdUser ? (
                <form onSubmit={handleCreate} className="space-y-8">
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter">Authorize <span className="text-red-600">Personnel</span></h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Generate new security credentials</p>
                  </div>
                  <div className="space-y-5">
                    <Input label="Full Identity" type="text" placeholder="RECEP NAME" value={formData.full_name} onChange={(v) => setFormData({ ...formData, full_name: v })} />
                    <Input label="System Node Email" type="email" placeholder="STAFF@SYSTEM.COM" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                    <Input label="Terminal Phone" type="text" placeholder="+251..." value={formData.phone_number} onChange={(v) => setFormData({ ...formData, phone_number: v })} />
                    {/* Select button from admin or receptionist */}
                    {/* --- ROLE DROP SELECT --- */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Access Level</label>
                      <div className="relative">
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full bg-gray-50 dark:bg-[#111] border border-transparent focus:border-red-600 p-5 rounded-2xl text-xs font-bold tracking-widest outline-none appearance-none cursor-pointer dark:text-white transition-all uppercase"
                        >
                          <option value="RECEPTIONIST">Receptionist (Standard)</option>
                          <option value="GARMENT">Garment (Tailor)</option>
                          <option value="ADMIN">Admin (Root Access)</option>
                        </select>
                        <HiOutlineChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#BA181B]" size={18} />
                      </div>
                    </div>
                  </div>
                  <button disabled={loading} className="w-full py-6 bg-red-600 text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all">
                    {loading ? 'SYNCING...' : 'INITIATE AUTHORIZATION'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><HiOutlineShieldCheck size={40} /></div>
                  <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic mb-8">{createdUser.message}</h3>
                  <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-red-600/30 p-10 rounded-[2.5rem] mb-10">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">One-Time Security Token</p>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-4xl font-mono font-black text-red-600 tracking-widest select-all break-all">{createdUser.temporary_password}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdUser.temporary_password);
                          setCopied(true);
                          setCopyText('COPIED!');
                          setTimeout(() => { setCopied(false); setCopyText('COPY'); }, 3000);
                        }}
                        className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-white dark:bg-black text-red-600 border border-red-600/30 hover:bg-red-600 hover:text-white'}`}
                      >
                        <HiOutlineClipboard size={18} /> {copyText}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { setShowAddModal(false); setCreatedUser(null); }} className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl text-[11px] font-black uppercase tracking-widest">CLOSE TERMINAL</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* --- MINI COMPONENTS --- */

const DetailCard = ({ icon, label, value }) => (
  <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-red-600/10 transition-all">
    <div className="flex items-center gap-4">
      <div className="text-red-600 opacity-60">{React.cloneElement(icon, { size: 22 })}</div>
      <div>
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-[11px] font-bold dark:text-white uppercase truncate">{value}</p>
      </div>
    </div>
  </div>
);

const Input = ({ label, type, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">{label}</label>
    <input
      required type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 dark:bg-[#111] border border-transparent focus:border-red-600 p-5 rounded-2xl text-[11px] font-bold tracking-widest outline-none dark:text-white dark:placeholder-gray-500 transition-all"
    />
  </div>
);

export default StaffManagement;