import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const { login } = useAuth();
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
      const result = await login(formData);

      console.log("Login Result:", result);

      if (!result.success) {
        setError(result.error || "Invalid email or password. Please try again.");
        return;
      }

      console.log("Login successful! User:", result.user);

      // Navigate based on role
      const role = result.user?.role?.toUpperCase();
      if (role === 'ADMIN') {
        navigate('/admin');
      } else if (role === 'RECEPTIONIST') {
        navigate('/reception');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.detail || "Login failed. Please check your credentials and try again.");
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
              Authorized Access
            </p>
          </div>

          {/* ROLE SELECTOR */}
          {/* <div className="flex bg-white/5 p-1 mb-8 rounded-full border border-white/10">
            {['admin', 'receptionist'].map((r) => (
              <button 
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-full ${role === r ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                {r === 'admin' ? 'Admin' : 'Staff'}
              </button>
            ))}
          </div> */}

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
                Email / Personnel ID
              </label>
              <HiOutlineUserCircle className="absolute left-0 bottom-3 text-gray-500 group-focus-within:text-red-600 transition-colors" size={18} />
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full bg-transparent border-b border-white/20 py-3 pl-8 text-sm font-bold tracking-widest text-white outline-none focus:border-red-600 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* PASSWORD */}
            <div className="relative group">
              <label className="absolute -top-6 left-0 text-[8px] font-black uppercase tracking-widest text-gray-500 group-focus-within:text-red-600 transition-colors">
                Password
              </label>
              <HiOutlineLockClosed className="absolute left-0 bottom-3 text-gray-500 group-focus-within:text-red-600 transition-colors" size={18} />
              <input
                required
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-white/20 py-3 pl-8 text-sm font-bold tracking-widest text-white outline-none focus:border-red-600 transition-all placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-3 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
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
                <span className="animate-pulse">AUTHENTICATING...</span>
              ) : (
                <><span>Login</span> <HiOutlineShieldCheck size={18} /></>
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

export default Login;