import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';// Ensure this matches your api.js file
import { 
  HiOutlineLockClosed, 
  HiOutlineUserCircle, 
  HiOutlineShieldCheck, 
  HiOutlineEye, 
  HiOutlineEyeSlash,
  HiOutlineExclamationTriangle 
} from 'react-icons/hi2';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('admin'); // Default to receptionist for easier testing
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await login(formData);
    
    // Log this to your console to see EXACTLY what your backend returns
    console.log("Backend Response:", response.data);

    // 1. Get tokens - handling potential nesting
    const accessToken = response.data.access || response.data.token;
    const refreshToken = response.data.refresh;
    // Use the backend role if available, otherwise fallback to the UI state
    const backendRole = response.data.role || role; 

    if (!accessToken) {
      throw new Error("No access token received from server");
    }

    // 2. Save to localStorage (MATCH THESE KEYS TO YOUR api.js)
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_role', backendRole.toLowerCase());

    console.log("Login successful! Role:", backendRole);
    
    // 3. Navigate
    if (backendRole.toLowerCase() === 'admin') {
      navigate('/admin');
    } else {
      navigate('/reception');
    }

  } catch (err) {
    console.error("Login Error:", err);
    setError(err.response?.data?.detail || "Access Denied: Invalid Credentials");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      
      {/* 1. CINEMATIC BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover grayscale brightness-[0.2]"
          alt="Luxury Fashion Background"
        />
        <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay" />
      </div>

      {/* 2. FLOATING LOGIN CARD */}
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
            <div className="h-[2px] w-12 bg-red-600 mx-auto mt-4" />
            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.4em] mt-6">
              Authorized Personnel Terminal
            </p>
          </div>

          {/* ERROR DISPLAY */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg"
              >
                <HiOutlineExclamationTriangle size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}
          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {/* EMAIL (Personnel ID) */}
            <div className="relative group">
              <label className="absolute -top-6 left-0 text-[8px] font-black uppercase tracking-widest text-gray-500 group-focus-within:text-red-600 transition-colors">
                Personnel Email
              </label>
              <HiOutlineUserCircle className="absolute left-0 bottom-3 text-gray-500 group-focus-within:text-red-600 transition-colors" size={18} />
              <input 
                required
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="admin@example.com"
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
                required
                name="password"
                type={showPassword ? "text" : "password"} 
                value={formData.password}
                onChange={handleInputChange}
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
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 20px rgba(220, 38, 38, 0.4)" } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={`w-full bg-red-600 text-white py-5 font-black uppercase tracking-[0.5em] text-[10px] flex items-center justify-center gap-3 transition-all mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="animate-pulse">Verifying...</span>
              ) : (
                <>Verify Identity <HiOutlineShieldCheck size={18} /></>
              )}
            </motion.button>
          </form>

          {/* FOOTER LINKS */}
          <div className="mt-10 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <a href="#" className="text-[10px] font-black text-white uppercase tracking-widest hover:text-red-600 transition-colors">System Recovery</a>
            <p className="text-[8px] font-bold text-gray-400 uppercase">Secure Node: AD-1</p>
          </div>
        </div>
      </motion.div>

      {/* Mood Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full z-0" />
    </div>
  );
};

// Helper for animations
import { AnimatePresence } from 'framer-motion';

export default Login;