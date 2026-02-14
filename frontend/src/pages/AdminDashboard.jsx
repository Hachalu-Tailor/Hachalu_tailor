import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineAdjustmentsHorizontal, HiOutlinePaperAirplane, 
  HiOutlineUserCircle, HiOutlineChevronRight, HiOutlineHashtag,
  HiOutlineUserPlus, HiOutlineTrash, HiOutlineEnvelope, HiOutlinePhone,
  HiOutlineShieldCheck, HiOutlineXMark
} from 'react-icons/hi2';
import { addStaff, listStaff, deleteStaff } from '../api/api';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, staff, messages
  const [darkMode, setDarkMode] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Staff Modal State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    role: 'RECEPTIONIST'
  });

  // Fetch staff when tab changes
  useEffect(() => {
    if (activeTab === 'staff') fetchStaff();
  }, [activeTab]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await listStaff();
      setStaffList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addStaff(newStaff);
      alert(`Staff Created! Temp Password: ${res.data.temporary_password}`);
      setShowAddStaff(false);
      setNewStaff({ email: '', full_name: '', phone_number: '', role: 'RECEPTIONIST' });
      fetchStaff();
    } catch (err) {
      alert("Failed to create personnel.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if(!window.confirm("Revoke access for this personnel?")) return;
    try {
      await deleteStaff(id);
      fetchStaff();
    } catch (err) {
      alert("Revoke protocol failed.");
    }
  };

  const ActionBtn = ({ icon, label, onClick, color = "text-gray-400" }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 rounded-lg hover:bg-red-600 hover:text-white transition-all group">
      <span className={`${color} group-hover:text-white mb-2`}>{icon}</span>
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-[#F3F4F6] dark:bg-[#050505] transition-colors duration-500 font-sans">
        
        {/* SIDEBAR NAVIGATION (Integrated into Main for this demo) */}
        <aside className="hidden lg:flex w-24 flex-col items-center py-8 bg-white dark:bg-[#0a0a0a] border-r dark:border-white/5">
           <div className="size-12 bg-red-600 rounded-xl mb-12 flex items-center justify-center text-white font-black italic">HP</div>
           <nav className="flex flex-col gap-8">
             <NavIcon active={activeTab === 'inventory'} icon={<HiOutlineHashtag size={24}/>} onClick={() => setActiveTab('inventory')} />
             <NavIcon active={activeTab === 'staff'} icon={<HiOutlineUserCircle size={24}/>} onClick={() => setActiveTab('staff')} />
             <NavIcon active={activeTab === 'messages'} icon={<HiOutlinePaperAirplane size={24} className="rotate-45"/>} onClick={() => setActiveTab('messages')} />
           </nav>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* HEADER */}
          <header className="p-6 bg-white dark:bg-[#0a0a0a] flex justify-between items-center border-b dark:border-white/5">
            <div>
               <h1 className="text-xl font-black dark:text-white uppercase tracking-tighter">
                {activeTab} <span className="text-red-600">Protocol</span>
               </h1>
               <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em]">Authorized Terminal AD-1</p>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="size-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full dark:text-white">
              {darkMode ? '🌙' : '☀️'}
            </button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <section className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-5xl mx-auto">
                
                {/* --- STAFF MANAGEMENT VIEW --- */}
                {activeTab === 'staff' && (
                  <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-black dark:text-white uppercase tracking-widest">Active Personnel</h2>
                      <button 
                        onClick={() => setShowAddStaff(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all"
                      >
                        <HiOutlineUserPlus size={14}/> Add Staff
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {staffList.map((person) => (
                        <motion.div 
                          key={person.id}
                          whileHover={{ y: -5 }}
                          className="bg-white dark:bg-[#0d0d0d] p-6 rounded-2xl border border-gray-100 dark:border-white/5 relative group"
                        >
                          <div className={`absolute top-4 right-4 size-2 rounded-full ${person.is_active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`} />
                          <div className="flex items-center gap-4 mb-4">
                            <div className="size-12 bg-red-600/10 text-red-600 rounded-full flex items-center justify-center font-black">
                              {person.full_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-xs font-black dark:text-white uppercase">{person.full_name}</h3>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{person.role}</p>
                            </div>
                          </div>
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                              <HiOutlineEnvelope /> {person.email}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                              <HiOutlinePhone /> {person.phone_number || 'N/A'}
                            </div>
                          </div>
                          {person.role !== 'ADMIN' && (
                            <button 
                              onClick={() => handleDeleteStaff(person.id)}
                              className="w-full py-2 bg-gray-50 dark:bg-white/5 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            >
                              Revoke Access
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* --- INVENTORY VIEW (AS PREVIOUS) --- */}
                {activeTab === 'inventory' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* ... Existing Inventory Logic ... */}
                    <div className="text-gray-500 text-[10px] uppercase font-bold p-8 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                      Inventory Protocol Loaded. Select item for detail.
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ADD STAFF OVERLAY */}
          <AnimatePresence>
            {showAddStaff && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                  className="bg-white dark:bg-[#0d0d0d] w-full max-w-md rounded-[2rem] p-8 border dark:border-white/10 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black dark:text-white uppercase italic">Add <span className="text-red-600">Personnel</span></h2>
                    <button onClick={() => setShowAddStaff(false)} className="dark:text-white"><HiOutlineXMark size={24}/></button>
                  </div>
                  <form onSubmit={handleAddStaff} className="space-y-5">
                    <InputGroup label="Full Name" type="text" placeholder="John Doe" value={newStaff.full_name} 
                      onChange={(e) => setNewStaff({...newStaff, full_name: e.target.value})} />
                    <InputGroup label="Official Email" type="email" placeholder="john@protocol.com" value={newStaff.email} 
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} />
                    <InputGroup label="Phone (Include +251)" type="text" placeholder="+251..." value={newStaff.phone_number} 
                      onChange={(e) => setNewStaff({...newStaff, phone_number: e.target.value})} />
                    <button 
                      disabled={loading}
                      className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all rounded-xl mt-4"
                    >
                      {loading ? "Initializing..." : "Register Staff"}
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const NavIcon = ({ active, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-gray-500 hover:text-red-600'}`}
  >
    {icon}
  </button>
);

const InputGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-2">{label}</label>
    <input 
      {...props}
      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-red-600 transition-all"
    />
  </div>
);

export default AdminDashboard;