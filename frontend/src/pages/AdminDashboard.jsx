import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineUserCircle, HiOutlineUserPlus, HiOutlineTrash, 
  HiOutlineEnvelope, HiOutlinePhone, HiOutlineShieldCheck, 
  HiOutlineXMark, HiOutlineSquares2X2, HiOutlineKey, HiOutlineMagnifyingGlass 
} from 'react-icons/hi2';
// import { addStaff, listStaff, deleteStaff } from '../api/api';
import { listStaff, addStaff, deleteStaff } from '../api/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('staff'); 
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [tempPassword, setTempPassword] = useState(null); // To show after creation
  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    role: 'RECEPTIONIST' // Matches your API requirement
  });

  useEffect(() => {
    if (activeTab === 'staff') fetchStaff();
  }, [activeTab]);

  const fetchStaff = async () => {
    setLoading(true);
    console.log("Fetching staff list..."); // Debug log
    try {
      // Endpoint: POST /api/accounts/admin/staff/ (per your spec)
      const res = await listStaff(); 
      setStaffList(res.data || []);
      console.log("Staff list fetched:", res.data); // Debug log
    } catch (err) {
      console.error("Staff fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Endpoint: POST /api/accounts/admin/staff/
      const res = await addStaff(newStaff);
      setTempPassword(res.data.temporary_password); // Store for the "Success" view
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed. Check if email exists.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if(!window.confirm("ARE YOU SURE? This will permanently revoke terminal access for this staff member.")) return;
    try {
      // Endpoint: DELETE /api/accounts/admin/staff/{id}/
      await deleteStaff(id);
      fetchStaff();
    } catch (err) {
      alert("Revoke failed. Ensure you have Master Admin privileges.");
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-black dark:text-white uppercase italic tracking-tighter">
            Staff Management <span className="text-red-600">.</span>
          </h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">Hachalu Terminal / Admin Controls</p>
        </div>

        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border dark:border-white/5">
          <button onClick={() => setActiveTab('staff')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-white dark:bg-red-600 shadow-xl text-black dark:text-white' : 'text-gray-500'}`}>
            Directory
          </button>
          <button onClick={() => setActiveTab('system')} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? 'bg-white dark:bg-red-600 shadow-xl text-black dark:text-white' : 'text-gray-500'}`}>
            Security
          </button>
        </div>
      </div>

      {/* SEARCH & ACTIONS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="FILTER BY NAME OR EMAIL..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4 pl-14 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-red-600 transition-all dark:text-white"
          />
        </div>
        <button 
          onClick={() => { setTempPassword(null); setShowAddStaff(true); }}
          className="bg-black dark:bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-red-600/20"
        >
          <HiOutlineUserPlus size={18}/> Add New Receptionist
        </button>
      </div>

      {/* STAFF CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(n => <div key={n} className="h-48 bg-gray-200 dark:bg-white/5 animate-pulse rounded-[2.5rem]" />)
        ) : (
          filteredStaff.map((person) => (
            <motion.div 
              layout
              key={person.id}
              className="bg-white dark:bg-zinc-900 border dark:border-white/5 p-8 rounded-[2.5rem] group relative overflow-hidden shadow-sm hover:shadow-2xl transition-all"
            >
              <div className="flex items-center gap-5 mb-8">
                <div className="size-14 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-[1.2rem] flex items-center justify-center font-black text-2xl italic shadow-lg shadow-red-600/20">
                  {person.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black dark:text-white uppercase truncate tracking-tight">{person.full_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`size-1.5 rounded-full ${person.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">
                      {person.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold">
                  <HiOutlineEnvelope size={16} className="text-red-600" /> {person.email}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold">
                  <HiOutlinePhone size={16} className="text-red-600" /> {person.phone_number || "NO PHONE"}
                </div>
              </div>

              {person.role !== 'ADMIN' && (
                <button 
                  onClick={() => handleDeleteStaff(person.id)}
                  className="w-full py-4 bg-red-50 dark:bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <HiOutlineTrash size={16}/> Terminate Access
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* MODAL: CREATE RECEPTIONIST */}
      <AnimatePresence>
        {showAddStaff && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border dark:border-white/10"
            >
              <button onClick={() => setShowAddStaff(false)} className="absolute top-10 right-10 text-gray-400 hover:text-red-600 transition-colors">
                <HiOutlineXMark size={32}/>
              </button>

              {!tempPassword ? (
                <>
                  <h3 className="text-2xl font-black dark:text-white uppercase italic mb-2">New Staff Access</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-10">Generate unique credentials</p>
                  
                  <form onSubmit={handleAddStaff} className="space-y-5">
                    <InputField label="Staff Full Name" type="text" placeholder="e.g. Abebe Kebede" 
                      value={newStaff.full_name} onChange={(val) => setNewStaff({...newStaff, full_name: val})} />
                    
                    <InputField label="Official Email" type="email" placeholder="staff@hachalu.com" 
                      value={newStaff.email} onChange={(val) => setNewStaff({...newStaff, email: val})} />
                    
                    <InputField label="Mobile Number" type="text" placeholder="+251..." 
                      value={newStaff.phone_number} onChange={(val) => setNewStaff({...newStaff, phone_number: val})} />
                    
                    <button disabled={loading} className="w-full py-5 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-red-600/30 hover:bg-black transition-all">
                      {loading ? "COMMUNICATING WITH SERVER..." : "AUTHORIZE NEW USER"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="size-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineKey size={40} />
                  </div>
                  <h3 className="text-xl font-black dark:text-white uppercase mb-2">User Created!</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase mb-8">Share this temporary password safely:</p>
                  <div className="bg-gray-100 dark:bg-white/5 p-6 rounded-2xl border-2 border-dashed border-red-600 mb-8">
                    <span className="text-3xl font-mono font-black tracking-widest text-red-600">{tempPassword}</span>
                  </div>
                  <button onClick={() => setShowAddStaff(false)} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl">
                    Dismiss
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

// Reusable Input Sub-component
const InputField = ({ label, type, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">{label}</label>
    <input 
      required type={type} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border-2 border-transparent focus:border-red-600 dark:text-white transition-all"
    />
  </div>
);

export default AdminDashboard;