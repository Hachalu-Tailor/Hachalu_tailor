import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineUser, 
  HiOutlineEnvelope, 
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlinePencilSquare
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
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) => `
    w-full bg-white/5 border ${errors[fieldName] ? 'border-red-500' : 'border-white/10'} 
    rounded-lg px-4 py-3 pl-11 text-white text-sm font-medium
    focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500
    placeholder:text-gray-500 transition-all
  `;

  const tabs = [
    { id: 'profile', label: t('profile'), icon: HiOutlineUser },
    { id: 'security', label: t('security'), icon: HiOutlineLockClosed },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          {t('profile')} {t('settings') || 'Settings'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {t('welcome')} {user?.name}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-full ${getAvatarColor(user?.name)} flex items-center justify-center`}>
            <span className="text-white font-bold text-xl">
              {getInitials(user?.name)}
            </span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{user?.name}</h2>
            <p className="text-gray-400 text-sm capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all
                ${activeTab === tab.id 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleProfileSubmit}
            className="space-y-6"
          >
            <div className="relative">
              <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                placeholder={t('profile')}
                className={inputClass('name')}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="relative">
              <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder={t('email') || 'Email'}
                className={inputClass('email')}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                placeholder={t('phone') || 'Phone'}
                className={inputClass('phone')}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={`
                w-full py-3 bg-red-600 text-white font-bold uppercase tracking-wider text-sm rounded-lg
                flex items-center justify-center gap-2 transition-all
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}
              `}
            >
                {loading ? (
                <span className="animate-pulse">{t('loading')}</span>
              ) : (
                <>
                  <HiOutlineCheck size={18} />
                  {t('save')}
                </>
              )}
            </motion.button>
          </motion.form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handlePasswordSubmit}
            className="space-y-6"
          >
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                placeholder={t('currentPassword') || 'Current Password'}
                className={inputClass('current_password')}
              />
              {errors.current_password && <p className="text-red-500 text-xs mt-1">{errors.current_password}</p>}
            </div>

            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                placeholder={t('newPassword') || 'New Password'}
                className={inputClass('new_password')}
              />
              {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password}</p>}
            </div>

            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                placeholder={t('confirmPassword') || 'Confirm New Password'}
                className={inputClass('confirm_password')}
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={`
                w-full py-3 bg-red-600 text-white font-bold uppercase tracking-wider text-sm rounded-lg
                flex items-center justify-center gap-2 transition-all
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}
              `}
            >
              {loading ? (
                <span className="animate-pulse">{t('loading')}</span>
              ) : (
                <>
                  <HiOutlinePencilSquare size={18} />
                  {t('changePassword') || 'Change Password'}
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </div>
    </div>
  );
};

export default Profile;
