import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlinePencilSquare,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineShieldCheck,
  HiOutlineCamera
} from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { changePassword, updateProfile } from '../api/api';
import { getInitials, getAvatarColor } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.name.trim()) newErrors.name = 'Please enter your full name';
    if (!profileData.email.trim()) newErrors.email = 'Please enter your email address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.current_password) newErrors.current_password = 'Please enter your current password';
    if (!passwordData.new_password) newErrors.new_password = 'Please enter a new password';
    if (passwordData.new_password.length < 8) newErrors.new_password = 'Password must be at least 8 characters long';
    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match. Please try again.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setLoading(true);
    try {
      await updateProfile(user.id, profileData);
      updateUser(profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await changePassword({
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;

    if (strength <= 25) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 50) return { strength, label: 'Fair', color: 'bg-orange-500' };
    if (strength <= 75) return { strength, label: 'Good', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordData.new_password);

  const inputClass = (fieldName) => `
    w-full bg-gray-50 dark:bg-white/5 border ${errors[fieldName] ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} 
    rounded-xl px-4 py-3.5 pl-11 text-gray-900 dark:text-white text-sm font-medium
    focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
    placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all
  `;

  const passwordInputClass = (fieldName) => `
    w-full bg-gray-50 dark:bg-white/5 border ${errors[fieldName] ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} 
    rounded-xl px-4 py-3.5 pl-11 pr-11 text-gray-900 dark:text-white text-sm font-medium
    focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20
    placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all
  `;

  const tabs = [
    { id: 'profile', label: t('profile') || 'My Profile', icon: HiOutlineUser },
    { id: 'security', label: t('security') || 'Security', icon: HiOutlineLockClosed },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-red-800 p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative flex items-center gap-6">
          <div className="relative group">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${getAvatarColor(user?.name)} flex items-center justify-center shadow-2xl`}>
              <span className="text-white font-bold text-2xl sm:text-3xl">
                {getInitials(user?.name)}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <HiOutlineCamera className="text-white w-8 h-8" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {user?.name}
            </h1>
            <p className="text-red-100 text-sm font-medium capitalize mt-1">
              {user?.role} Account
            </p>
            <div className="flex items-center gap-2 mt-2">
              <HiOutlineShieldCheck className="text-white/80 w-4 h-4" />
              <span className="text-white/80 text-xs font-medium">
                Your account is secure
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-xl"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'}
            `}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#0c0c0c] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-gray-100 dark:border-white/5 overflow-hidden"
          >
            <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlineUser className="text-red-600" />
                Personal Information
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Update your personal details and contact information
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Enter your full name"
                      className={inputClass('name')}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-2">{errors.name}</p>}
                </div>

                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      placeholder="Enter your email"
                      className={inputClass('email')}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-2">{errors.email}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="Enter your phone number"
                      className={inputClass('phone')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className={`
                    px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold uppercase tracking-wider text-sm rounded-xl
                    flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/25
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-red-600/40'}
                  `}
                >
                  {loading ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      <HiOutlineCheck size={18} />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#0c0c0c] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-gray-100 dark:border-white/5 overflow-hidden"
          >
            <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlineLockClosed className="text-red-600" />
                Change Password
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Ensure your account stays secure with a strong password
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className={passwordInputClass('current_password')}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPasswords.current ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                    </button>
                  </div>
                  {errors.current_password && <p className="text-red-500 text-xs mt-2">{errors.current_password}</p>}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password"
                      className={passwordInputClass('new_password')}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPasswords.new ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.new_password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Use 8+ characters with a mix of letters, numbers & symbols
                      </p>
                    </div>
                  )}
                  {errors.new_password && <p className="text-red-500 text-xs mt-2">{errors.new_password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                      className={passwordInputClass('confirm_password')}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPasswords.confirm ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-red-500 text-xs mt-2">{errors.confirm_password}</p>}

                  {/* Match indicator */}
                  {passwordData.confirm_password && passwordData.new_password && (
                    <div className="mt-2 flex items-center gap-2">
                      {passwordData.new_password === passwordData.confirm_password ? (
                        <>
                          <HiOutlineCheck className="text-green-500 w-4 h-4" />
                          <span className="text-xs text-green-500 font-medium">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <HiOutlinePencilSquare className="text-red-500 w-4 h-4" />
                          <span className="text-xs text-red-500 font-medium">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className={`
                    px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold uppercase tracking-wider text-sm rounded-xl
                    flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/25
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:shadow-red-600/40'}
                  `}
                >
                  {loading ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      <HiOutlinePencilSquare size={18} />
                      Update Password
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
