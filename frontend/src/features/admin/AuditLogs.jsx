import React, { useState, useEffect } from 'react';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineEye
} from 'react-icons/hi2';
import { getAuditLogs } from '../../api/api';
import { formatDateTime, formatRelativeTime } from '../../utils/helpers';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({
    actor: '',
    action: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (params = {}) => {
    try {
      setLoading(true);
      const response = await getAuditLogs(params);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (filterParams.actor) params.actor = filterParams.actor;
    if (filterParams.action) params.action = filterParams.action;
    if (filterParams.startDate && filterParams.endDate) {
      params.start_date = filterParams.startDate;
      params.end_date = filterParams.endDate;
    }
    fetchLogs(params);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterParams({
      actor: '',
      action: '',
      startDate: '',
      endDate: ''
    });
    fetchLogs();
  };

  const getActionIcon = (action) => {
    if (action.includes('USER') || action.includes('STAFF')) {
      return <HiOutlineUser className="text-purple-500" size={16} />;
    } else if (action.includes('ORDER')) {
      return <HiOutlineClipboardDocumentList className="text-blue-500" size={16} />;
    } else if (action.includes('PAYMENT')) {
      return <HiOutlineClipboardDocumentList className="text-green-500" size={16} />;
    } else if (action.includes('INVENTORY')) {
      return <HiOutlineClipboardDocumentList className="text-orange-500" size={16} />;
    }
    return <HiOutlineClipboardDocumentList className="text-gray-500" size={16} />;
  };

  const getActionColor = (action) => {
    if (action.includes('CREATED')) return 'text-green-600';
    if (action.includes('UPDATED')) return 'text-blue-600';
    if (action.includes('DELETED')) return 'text-red-600';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-purple-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
            Audit <span className="text-red-600">Logs</span>
          </h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            System activity tracking
          </p>
        </div>
        <button
          onClick={handleReset}
          className="bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-lg text-sm font-bold dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Term */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Search
              </label>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
                />
              </div>
            </div>

            {/* Actor Filter */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Actor
              </label>
              <input
                type="text"
                placeholder="Actor ID or name..."
                value={filterParams.actor}
                onChange={(e) => setFilterParams({ ...filterParams, actor: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
              />
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Action
              </label>
              <input
                type="text"
                placeholder="Action type..."
                value={filterParams.action}
                onChange={(e) => setFilterParams({ ...filterParams, action: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterParams.startDate}
                  onChange={(e) => setFilterParams({ ...filterParams, startDate: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
                />
                <input
                  type="date"
                  value={filterParams.endDate}
                  onChange={(e) => setFilterParams({ ...filterParams, endDate: e.target.value })}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-red-600 text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              Search Logs
            </button>
          </div>
        </form>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            System Activity
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {logs.length} records found
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {logs.length > 0 ? logs.map((log) => (
            <div key={log.id} className="p-6 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  {getActionIcon(log.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={`text-sm font-black ${getActionColor(log.action)} uppercase tracking-wide`}>
                      {log.action}
                    </h4>
                    <span className="text-[9px] text-gray-400">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase tracking-widest mb-1">
                        Actor
                      </span>
                      <span className="font-bold dark:text-white">{log.actor || 'System'}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase tracking-widest mb-1">
                        Target
                      </span>
                      <span className="font-bold dark:text-white">
                        {log.target_id || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[9px] uppercase tracking-widest mb-1">
                        IP Address
                      </span>
                      <span className="font-bold dark:text-white">{log.ip_address || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Payload Details */}
                  {log.payload && Object.keys(log.payload).length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        Details
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {Object.entries(log.payload).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-500">{key.replace('_', ' ')}</span>
                            <span className="font-bold dark:text-white">
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center">
              <HiOutlineClipboardDocumentList size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No audit logs found</p>
              <p className="text-[10px] text-gray-500 mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
