import React, { useState, useEffect } from 'react';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import api from '../../api/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Get unique customers from orders
      const response = await api.get('/orders/list/');
      const orders = response.data || [];

      // Group orders by customer phone
      const clientMap = new Map();
      orders.forEach(order => {
        const phone = order.customer_phone;
        if (!clientMap.has(phone)) {
          clientMap.set(phone, {
            name: order.customer_name,
            phone: phone,
            orders: [],
            firstOrder: order.created_at,
          });
        }
        const client = clientMap.get(phone);
        client.orders.push(order);
        // Update first order date if this one is earlier
        if (new Date(order.created_at) < new Date(client.firstOrder)) {
          client.firstOrder = order.created_at;
        }
      });

      setClients(Array.from(clientMap.values()));
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.phone.includes(search)
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  const getClientStatus = (orderCount) => {
    if (orderCount >= 5) return { label: 'VIP Client', color: 'bg-yellow-500/10 text-yellow-600' };
    if (orderCount >= 3) return { label: 'Regular', color: 'bg-blue-500/10 text-blue-500' };
    return { label: 'New', color: 'bg-green-500/10 text-green-500' };
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-red-600/20"
          />
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {filteredClients.length} Clients
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredClients.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="p-6">Client Name</th>
                <th className="p-6">Phone</th>
                <th className="p-6">Join Date</th>
                <th className="p-6">Orders</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredClients.map((client, index) => {
                const status = getClientStatus(client.orders.length);
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                          <HiOutlineUser className="text-red-600" size={18} />
                        </div>
                        <span className="font-bold dark:text-white text-sm uppercase">{client.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-xs text-gray-500 font-bold">{client.phone}</td>
                    <td className="p-6 text-xs text-gray-500 font-bold">{formatDate(client.firstOrder)}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <HiOutlineShoppingBag className="text-gray-400" size={16} />
                        <span className="text-xs font-black dark:text-white">{client.orders.length}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <HiOutlineUser size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No clients found</p>
            <p className="text-[10px] text-gray-500 mt-2">Clients will appear here once orders are created</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
