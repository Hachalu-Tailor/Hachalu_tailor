import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineUser,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineEnvelope,          // ← Fixed: this is the correct v2 name
} from 'react-icons/hi2';
import api from '../../api/api';

const UserManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    role: 'RECEPTIONIST',
  });
  const [createdPassword, setCreatedPassword] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Use POST for listing staff according to README
      const response = await api.post('/accounts/admin/staff/');
      setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/accounts/admin/staff/', newStaff);
      setCreatedPassword(response.data.temporary_password);
      setNewStaff({ email: '', full_name: '', phone_number: '', role: 'RECEPTIONIST' });
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      alert(error.response?.data?.error || 'Failed to add staff member');
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await api.delete(`/accounts/admin/staff/${id}/`);
      setDeleteConfirm(null);
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert(error.response?.data?.error || 'Failed to delete staff member');
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const response = await api.post(`/accounts/admin/users/${id}/reset-password/`);
      alert(`New temporary password: ${response.data.temporary_password}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      alert(error.response?.data?.error || 'Failed to reset password');
    }
  };

  const getRoleColor = (role) => {
    return role === 'ADMIN'
      ? 'bg-red-500/10 text-red-500'
      : 'bg-blue-500/10 text-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
            Staff Management
          </h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            Manage admin and receptionist accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-700 transition-all"
        >
          <HiOutlinePlus size={18} />
          Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : staff.length > 0 ? (
          staff.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 bg-red-600/10 rounded-2xl flex items-center justify-center">
                  <HiOutlineUser className="text-red-600" size={28} />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getRoleColor(
                    member.role
                  )}`}
                >
                  {member.role}
                </span>
              </div>

              <h3 className="text-lg font-black dark:text-white uppercase mb-1">
                {member.full_name}
              </h3>
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <HiOutlineEnvelope size={14} />   {/* ← Fixed icon */}
                <p className="text-xs font-medium">{member.email}</p>
              </div>
              {member.phone_number && (
                <p className="text-xs text-gray-500 mb-4">{member.phone_number}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}
                />
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleResetPassword(member.id)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                >
                  <HiOutlineKey size={14} />
                  Reset
                </button>
                {member.role !== 'ADMIN' && (
                  <button
                    onClick={() => setDeleteConfirm(member)}
                    className="py-2 px-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-500/20 transition-all"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <HiOutlineShieldCheck size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No staff members found</p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddModal(false);
                setCreatedPassword(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-8"
            >
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCreatedPassword(null);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
              >
                <HiOutlineXMark size={20} />
              </button>

              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6">
                Add New Staff
              </h2>

              {createdPassword ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiOutlineShieldCheck className="text-green-500" size={40} />
                  </div>
                  <h3 className="text-lg font-black dark:text-white mb-2">
                    Staff Member Created!
                  </h3>
                  <p className="text-[10px] text-zinc-400 uppercase mb-4">
                    Temporary Password
                  </p>
                  <p className="text-2xl font-black text-red-600 mb-6 font-mono">
                    {createdPassword}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Please provide this password to the new staff member.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newStaff.full_name}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, full_name: e.target.value })
                      }
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, email: e.target.value })
                      }
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newStaff.phone_number}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, phone_number: e.target.value })
                      }
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                      placeholder="+251911234567"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                      Role *
                    </label>
                    <select
                      value={newStaff.role}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, role: e.target.value })
                      }
                      className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20 mt-2"
                    >
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-700 transition-all mt-4"
                  >
                    Create Staff
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-white/10 p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineTrash className="text-red-500" size={32} />
              </div>
              <h3 className="text-lg font-black dark:text-white mb-2">
                Delete Staff Member?
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-bold text-white">{deleteConfirm.full_name}</span>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteStaff(deleteConfirm.id)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;