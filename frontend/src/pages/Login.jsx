import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineLockClosed, HiOutlineUserCircle, HiOutlineShieldCheck, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

const Login = () => {
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);


  // handleLogin function:
const handleLogin = (e) => {
  e.preventDefault();
  
  // Fake authentication logic
  const userData = {
    id: "H-PRO-001",
    name: "Abebe",
    role: "receptionist" // or "admin"
  };

  localStorage.setItem('user', JSON.stringify(userData));
  
  // Redirect based on role
  if(userData.role === 'admin') window.location.href = "/admin";
  else if(userData.role === 'receptionist') window.location.href = "/reception";
  else window.location.href = "/";
};

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover grayscale brightness-[0.3]"
          alt="Luxury Fashion Background"
        />
        {/* Subtle red tint overlay for brand identity */}
        <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay" />
      </div>

      {/* 2. FLOATING LOGIN CARD (GLASSMORPHISM) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-[450px] mx-4"
      >
        <div className="bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-10 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          
          {/* HEADER */}
          <div className="text-center mb-10">
            <h1 className="text-white text-3xl font-black uppercase tracking-tighter italic">
              Hachalu<span className="text-red-600"> Protocol</span>
            </h1>
            <div className="h-[2px] w- bg-red-600 mx-auto mt-4" />
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.4em] mt-6">
              Authorized Personnel Terminal
            </p>
          </div>

          {/* ROLE SELECTOR */}
          <div className="flex bg-white/5 p-1 mb-8 rounded-full border border-white/10">
            <button 
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-full ${role === 'admin' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Admin
            </button>
            <button 
              onClick={() => setRole('receptionist')}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-full ${role === 'receptionist' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Staff
            </button>
          </div>

          {/* FORM */}
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            git 
            {/* UNIQUE ID */}
            <div className="relative group">
              <label className="absolute -top-6 left-0 text-[8px] font-black uppercase tracking-widest text-gray-500 group-focus-within:text-red-600 transition-colors">
                Personnel Unique ID
              </label>
              <HiOutlineUserCircle className="absolute left-0 bottom-3 text-gray-500 group-focus-within:text-red-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="H-PRO-XXXX"
                className="w-full bg-transparent border-b border-white/20 py-3 pl-8 text-sm font-bold tracking-widest text-white outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
              />
            </div>

            {/* PASSWORD */}
            <div className="relative group">
              <label className="absolute -top-6 left-0 text-[8px] font-black uppercase tracking-widest text-gray-500 group-focus-within:text-red-600 transition-colors">
                Access Key
              </label>
              <HiOutlineLockClosed className="absolute left-0 bottom-3 text-gray-500 group-focus-within:text-red-600 transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-white/20 py-3 pl-8 text-sm font-bold tracking-widest text-white outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-3 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <HiOutlineEyeSlash size={16}/> : <HiOutlineEye size={16}/>}
              </button>
            </div>

            {/* LOGIN BUTTON */}
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(220, 38, 38, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              className="w-full bg-red-600 text-white py-5 font-black uppercase tracking-[0.5em] text-[10px] flex items-center justify-center gap-3 transition-all mt-4"
            >
              Verify Identity <HiOutlineShieldCheck size={18} />
            </motion.button>
          </form>

          {/* FOOTER LINKS */}
          <div className="mt-10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <a href="#" className="text-[10px] font-black text-white uppercase tracking-widest hover:text-red-600 transition-colors">System Recovery</a>
            <p className="text-[8px] font-bold text-gray-400 uppercase">Secure Node: AD-1</p>
          </div>
        </div>
      </motion.div>

      {/* 3. SUBTLE MESH GRADIENTS (Mood Making) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full z-0" />
    </div>
  );
};

export default Login;