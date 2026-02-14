import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineUserPlus, HiOutlineTrash, HiOutlineEnvelope, 
  HiOutlinePhone, HiOutlineShieldCheck, HiOutlineXMark, 
  HiOutlineClipboardDocumentCheck, HiOutlineMagnifyingGlass,
  HiOutlineIdentification, HiOutlineEllipsisVertical,
  HiOutlineEnvelopeOpen, HiOutlineChatBubbleBottomCenterText
} from 'react-icons/hi2';
import { listStaff, addStaff, deleteStaff } from '../../api/api'; 

const AdminReception = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
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
      setStaff(res.data);
      if (res.data.length > 0) setSelectedStaff(res.data[0]);
    } catch (err) {
      console.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addStaff(formData);
      setCreatedUser({ ...res.data, email: formData.email });
      setFormData({ email: '', full_name: '', phone_number: '', role: 'RECEPTIONIST' });
      loadStaff();
    } catch (err) {
      alert("Creation failed. Ensure email is unique.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* --- TOP HUD --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tight uppercase italic">
            Management <span className="text-red-600">Hub</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Personnel & Infrastructure Control</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="SEARCH..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-red-600/20 dark:text-white" 
            />
          </div>
          <button 
            onClick={() => { setCreatedUser(null); setShowModal(true); }}
            className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 shrink-0"
          >
            <HiOutlineUserPlus size={18} /> Add New
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-0">
        
        {/* --- MAIN DATA TABLE --- */}
        <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> Registered Staff
            </h3>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{filteredStaff.length} TOTAL NODES</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-10">
                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 dark:border-white/5">
                  <th className="px-8 py-5">Personnel</th>
                  <th className="px-8 py-5">Access Level</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {filteredStaff.map((person) => (
                  <motion.tr 
                    key={person.id}
                    onClick={() => setSelectedStaff(person)}
                    className={`group cursor-pointer transition-colors ${selectedStaff?.id === person.id ? 'bg-red-600/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-red-600 italic">
                          {person.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[11px] font-black dark:text-white uppercase tracking-tight">{person.full_name}</p>
                          <p className="text-[9px] text-gray-400 font-medium">{person.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${person.role === 'ADMIN' ? 'bg-red-600/10 text-red-600' : 'bg-blue-600/10 text-blue-600'}`}>
                        {person.role}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[9px] font-black dark:text-gray-300 uppercase tracking-widest italic">Encrypted</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <HiOutlineEllipsisVertical size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- DETAIL SIDE PANEL --- */}
        <div className="w-full xl:w-96 space-y-6">
          <AnimatePresence mode="wait">
            {selectedStaff && (
              <motion.div 
                key={selectedStaff.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm flex flex-col h-full"
              >
                <div className="text-center mb-8">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-red-600 to-red-900 mx-auto mb-4 flex items-center justify-center text-white text-4xl font-black italic shadow-xl shadow-red-600/20">
                    {selectedStaff.full_name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter italic">{selectedStaff.full_name}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{selectedStaff.role}</p>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-4">
                    <HiOutlineEnvelopeOpen className="text-red-600" size={20} />
                    <div className="overflow-hidden">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Network Email</p>
                      <p className="text-[10px] font-bold dark:text-white truncate uppercase">{selectedStaff.email}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-4">
                    <HiOutlinePhone className="text-red-600" size={20} />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Voice Terminal</p>
                      <p className="text-[10px] font-bold dark:text-white uppercase">{selectedStaff.phone_number || 'OFFLINE'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5 space-y-3">
                  <button className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                    <HiOutlineChatBubbleBottomCenterText size={18} /> Send Message
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm(`REVOKE ACCESS FOR ${selectedStaff.full_name}?`)) {
                        deleteStaff(selectedStaff.id).then(() => loadStaff());
                      }
                    }}
                    className="w-full py-4 text-red-600 border border-red-600/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <HiOutlineTrash size={18} /> Deactivate Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
{/* --- ADD RECEPTIONIST MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => {
                if (!loading) setShowModal(false);
              }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.9, y: 30, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#080808] rounded-[3.5rem] p-12 shadow-2xl overflow-hidden border dark:border-white/10"
            >
              {!createdUser ? (
                <form onSubmit={handleCreate} className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black dark:text-white uppercase italic tracking-tighter">
                        Authorize <span className="text-red-600">Staff</span>
                      </h2>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Create new system node</p>
                    </div>
                    <div className="h-10 w-10 bg-red-600/10 rounded-full flex items-center justify-center text-red-600">
                       <HiOutlineIdentification size={24} />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <Input 
                      label="Full Identity Name" 
                      type="text" 
                      placeholder="e.g. Recep Recep1" 
                      value={formData.full_name} 
                      onChange={(v) => setFormData({...formData, full_name: v})} 
                    />
                    <Input 
                      label="Communications Email" 
                      type="email" 
                      placeholder="recep1@gmail.com" 
                      value={formData.email} 
                      onChange={(v) => setFormData({...formData, email: v})} 
                    />
                    <Input 
                      label="Direct Phone Terminal" 
                      type="text" 
                      placeholder="+251 911 234 567" 
                      value={formData.phone_number} 
                      onChange={(v) => setFormData({...formData, phone_number: v})} 
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full py-6 bg-red-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] shadow-xl shadow-red-600/30 hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'INITIALIZING PROTOCOL...' : 'CONFIRM AUTHORIZATION'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-full mt-4 py-2 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-red-600 transition-colors"
                    >
                      Abort Mission
                    </button>
                  </div>
                </form>
              ) : (
                /* --- SUCCESS STATE (Matching your Response Body) --- */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <HiOutlineShieldCheck size={56} />
                  </div>
                  
                  <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter italic">
                    {createdUser.message || 'Success'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 mb-10">
                    User ID: {createdUser.user_id}
                  </p>

                  <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-red-600/40 p-10 rounded-[2.5rem] mb-10 relative group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Temporary Access Key</p>
                    <span className="text-4xl font-mono font-black text-red-600 tracking-[0.2em] select-all">
                      {createdUser.temporary_password}
                    </span>
                    
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(createdUser.temporary_password);
                        // Optional: show a small toast or change icon
                      }}
                      className="absolute top-4 right-4 p-3 bg-white dark:bg-black rounded-xl shadow-sm text-gray-400 hover:text-red-600 transition-all border border-gray-100 dark:border-white/10"
                      title="Copy Token"
                    >
                      <HiOutlineClipboardDocumentCheck size={24} />
                    </button>
                  </div>

                  <div className="bg-orange-500/5 p-4 rounded-2xl mb-8 flex items-center gap-4 border border-orange-500/10">
                    <div className="text-orange-500 shrink-0">
                       <HiOutlineChatBubbleBottomCenterText size={20} />
                    </div>
                    <p className="text-[9px] font-bold text-orange-600/80 uppercase text-left leading-relaxed">
                      Provide this key to the staff member. They will be required to update their credentials upon first terminal entry.
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      setShowModal(false);
                      setCreatedUser(null);
                    }} 
                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all"
                  >
                    CLOSE TERMINAL
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Input = ({ label, type, placeholder, value, onChange }) => (
  <div className="space-y-1.5 text-left">
    {/* Label stays uppercase for the "Protocol" look */}
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">
      {label}
    </label>
    
    <input 
      required 
      type={type} 
      placeholder={placeholder} 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 p-5 rounded-2xl text-[11px] font-bold tracking-wider outline-none dark:text-white transition-all placeholder:text-gray-500"
    />
  </div>
);

export default AdminReception;