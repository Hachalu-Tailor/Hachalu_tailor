import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineClipboardDocumentList,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import { getOrders } from '../../api/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // Fetch orders and extract unique clients
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrders({});
      const orders = response.data.results || response.data || [];

      // Extract unique clients from orders
      const clientMap = new Map();
      orders.forEach(order => {
        const phone = order.customer_phone;
        if (!clientMap.has(phone)) {
          clientMap.set(phone, {
            phone_number: phone,
            full_name: order.customer_name,
            orders: [],
            total_spent: 0,
            join_date: order.created_at
          });
        }
        const client = clientMap.get(phone);
        client.orders.push(order);
        if (order.status === 'COMPLETED' || order.status === 'CLOSED') {
          client.total_spent += parseFloat(order.total_price) || 0;
        }
        // Keep earliest date as join date
        if (new Date(order.created_at) < new Date(client.join_date)) {
          client.join_date = order.created_at;
        }
      });

      setClients(Array.from(clientMap.values()));
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filter clients by search
  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone_number?.includes(search)
  );

  // Get status badge for client
  const getClientStatus = (client) => {
    const activeOrders = client.orders.filter(o =>
      ['INITIATED', 'AWAITING_PAYMENT', 'PENDING_APPROVAL', 'IN_PROGRESS'].includes(o.status)
    ).length;

    if (activeOrders > 0) {
      return { label: 'Active', color: 'bg-green-500/10 text-green-500' };
    }
    if (client.total_spent > 5000) {
      return { label: 'VIP', color: 'bg-purple-500/10 text-purple-500' };
    }
    return { label: 'Regular', color: 'bg-gray-500/10 text-gray-500' };
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black dark:text-white uppercase italic flex items-center gap-2">
            <HiOutlineUsers className="text-red-600" />
            Client <span className="text-red-600">Registry</span>
          </h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">
            Customer Database Overview
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <p className="text-2xl font-black dark:text-white">{clients.length}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Clients</p>
          </div>
          <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <p className="text-2xl font-black text-green-500">
              {clients.filter(c => getClientStatus(c).label === 'Active').length}
            </p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-medium outline-none focus:border-red-600 transition-all dark:text-white"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-500 text-sm font-bold">{error}</p>
          <button
            onClick={fetchClients}
            className="mt-2 text-red-600 text-xs font-bold flex items-center gap-1"
          >
            <HiOutlineArrowPath /> Try Again
          </button>
        </div>
      )}

      {/* Clients Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="p-6">Client Name</th>
                <th className="p-6">Phone Number</th>
                <th className="p-6 hidden md:table-cell">Join Date</th>
                <th className="p-6 hidden md:table-cell">Orders</th>
                <th className="p-6 hidden lg:table-cell">Total Spent</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => {
                  const status = getClientStatus(client);
                  return (
                    <motion.tr
                      key={client.phone_number}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                            <span className="text-red-600 font-black text-sm">
                              {client.full_name?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                          <span className="font-bold dark:text-white text-sm uppercase">
                            {client.full_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-xs text-gray-500 font-bold">
                        {client.phone_number}
                      </td>
                      <td className="p-6 hidden md:table-cell text-xs text-gray-500 font-bold">
                        {client.join_date ? new Date(client.join_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).toUpperCase() : 'N/A'}
                      </td>
                      <td className="p-6 hidden md:table-cell">
                        <span className="text-xs font-black dark:text-white">
                          {client.orders.length} Order{client.orders.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="p-6 hidden lg:table-cell">
                        <span className="text-xs font-black text-green-500">
                          ${client.total_spent.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 ${status.color} text-[9px] font-black uppercase rounded-full`}>
                          {status.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Client Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0c] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-red-600/10 rounded-2xl flex items-center justify-center">
                    <span className="text-red-600 font-black text-xl">
                      {selectedClient.full_name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black dark:text-white uppercase">
                      {selectedClient.full_name}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold">{selectedClient.phone_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-red-600 hover:text-white transition-all"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              {/* Stats */}
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-center">
                  <HiOutlineClipboardDocumentList className="mx-auto text-blue-500 mb-2" size={24} />
                  <p className="text-2xl font-black dark:text-white">{selectedClient.orders.length}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Orders</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-center">
                  <HiOutlineCurrencyDollar className="mx-auto text-green-500 mb-2" size={24} />
                  <p className="text-2xl font-black text-green-500">${selectedClient.total_spent.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Spent</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-center">
                  <HiOutlineCalendar className="mx-auto text-purple-500 mb-2" size={24} />
                  <p className="text-sm font-black dark:text-white">
                    {new Date(selectedClient.join_date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Client Since</p>
                </div>
              </div>

              {/* Order History */}
              <div className="p-6 border-t border-gray-100 dark:border-white/5">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Recent Orders
                </h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {selectedClient.orders.slice(0, 5).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-bold dark:text-white">
                          Order #{order.id?.toString().slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                            order.status === 'IN_PROGRESS' ? 'bg-purple-500/10 text-purple-500' :
                              order.status === 'PENDING_APPROVAL' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-gray-500/10 text-gray-500'
                          }`}>
                          {order.status?.replace('_', ' ')}
                        </span>
                        <p className="text-xs font-bold dark:text-white mt-1">
                          ${parseFloat(order.total_price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-100 dark:border-white/5">
                <button className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-red-700 transition-all">
                  View Full Client History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
