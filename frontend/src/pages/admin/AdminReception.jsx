import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineUserPlus, HiOutlineTrash, HiOutlineEnvelope, 
  HiOutlinePhone, HiOutlineShieldCheck, HiOutlineXMark, 
  HiOutlineClipboardDocumentCheck, HiOutlineMagnifyingGlass,
  HiOutlineUserGroup, HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { listStaff, addStaff, deleteStaff } from '../../api/api'; 
const AdminReception = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createdUser, setCreatedUser] = useState(null); // Stores {temporary_password, email}
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    role: 'RECEPTIONIST'
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await listStaff();
      setStaff(res.data);
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

  const handleDelete = async (id, name) => {
    if (window.confirm(`Permanently revoke terminal access for ${name}?`)) {
      try {
        await deleteStaff(id);
        loadStaff();
      } catch (err) {
        alert("Action restricted.");
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Password copied to clipboard!");
  };

  const filteredStaff = staff.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tighter italic flex items-center gap-3">
            <HiOutlineUserGroup className="text-red-600" />
            STAFF PROTOCOL
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1">
            Authorization & Access Control
          </p>
        </div>

        <button 
          onClick={() => { setCreatedUser(null); setShowModal(true); }}
          className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-xl active:scale-95"
        >
          <HiOutlineUserPlus size={18}/> Add Receptionist
        </button>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="relative mb-8 max-w-xl">
        <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="FILTER BY NAME, EMAIL, OR ROLE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 p-5 pl-14 rounded-[2rem] text-[11px] font-black uppercase tracking-widest outline-none focus:border-red-600 transition-all dark:text-white shadow-sm"
        />
      </div>

      {/* --- DATA GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading && staff.length === 0 ? (
            [1, 2, 3].map(i => <SkeletonLoader key={i} />)
          ) : (
            filteredStaff.map((person) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={person.id}
                className="group bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden hover:shadow-2xl hover:border-red-600/20 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="size-14 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl text-red-600 italic">
                    {person.full_name.charAt(0)}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${person.role === 'ADMIN' ? 'border-red-600 text-red-600' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}>
                    {person.role}
                  </div>
                </div>

                <h3 className="text-sm font-black dark:text-white uppercase tracking-tight mb-1 truncate">
                  {person.full_name}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <HiOutlineEnvelope className="text-red-600" /> {person.email}
                </p>

                <div className="space-y-3 py-4 border-t border-gray-50 dark:border-white/5">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Status</span>
                    <span className={person.is_active ? 'text-green-500' : 'text-gray-500'}>
                      {person.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Phone</span>
                    <span className="dark:text-gray-200">{person.phone_number || "N/A"}</span>
                  </div>
                </div>

                {person.role !== 'ADMIN' && (
                  <button 
                    onClick={() => handleDelete(person.id, person.full_name)}
                    className="mt-6 w-full py-4 bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-red-600 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                  >
                    <HiOutlineTrash size={16} /> Revoke Access
                  </button>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* --- CREATE MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }}
              className="bg-white dark:bg-[#080808] w-full max-w-lg rounded-[3rem] p-10 relative border dark:border-white/10 shadow-2xl"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-600">
                <HiOutlineXMark size={32} />
              </button>

              {!createdUser ? (
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black dark:text-white uppercase italic underline decoration-red-600 decoration-4 underline-offset-8">Generate Access</h2>
                  </div>

                  <div className="space-y-4">
                    <Input label="Staff Full Name" type="text" placeholder="Mag MC" value={formData.full_name} onChange={(v) => setFormData({...formData, full_name: v})} />
                    <Input label="Staff Email" type="email" placeholder="recep@hachalu.com" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                    <Input label="Phone Number" type="text" placeholder="+251..." value={formData.phone_number} onChange={(v) => setFormData({...formData, phone_number: v})} />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-black dark:hover:bg-white dark:hover:text-black transition-all shadow-xl shadow-red-600/20"
                  >
                    {loading ? "COMMUNICATING..." : "CONFIRM & CREATE"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className="size-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineShieldCheck size={40} />
                  </div>
                  <h2 className="text-xl font-black dark:text-white uppercase mb-2">Protocol Successful</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-10 tracking-widest">A temporary password has been generated.</p>
                  
                  <div className="bg-gray-50 dark:bg-white/5 border-2 border-dashed border-red-600 p-8 rounded-3xl mb-8 relative group">
                    <span className="text-3xl font-mono font-black text-red-600 tracking-[0.2em]">
                      {createdUser.temporary_password}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(createdUser.temporary_password)}
                      className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-red-600"
                    >
                      <HiOutlineClipboardDocumentCheck size={20} />
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Close & Finish
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Input = ({ label, type, placeholder, value, onChange }) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">{label}</label>
    <input 
      required type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none dark:text-white transition-all"
    />
  </div>
);

const SkeletonLoader = () => (
  <div className="h-64 bg-gray-100 dark:bg-white/5 animate-pulse rounded-[2.5rem]" />
);

export default AdminReception;