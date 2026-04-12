import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineXMark,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import { getAuditLogs, getAuditLogDetail } from '../../api/api';
import { formatDateTime, formatRelativeTime } from '../../utils/helpers';

const DEFAULT_PAGE_SIZE = 25;
const QUICK_ACTIONS = [
  { label: 'All', value: '' },
  { label: 'Users', value: 'USER' },
  { label: 'Orders', value: 'ORDER' },
  { label: 'Payments', value: 'PAYMENT' },
  { label: 'Inventory', value: 'INVENTORY' },
  { label: 'Auth', value: 'LOGIN' }
];

const EXCLUDED_ACTIONS = new Set(['ORDER_LISTED']);

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParams, setFilterParams] = useState({
    actor: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [queryParams, setQueryParams] = useState({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetail, setLogDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const inFlightRequestKeyRef = useRef('');
  const lastCompletedRequestRef = useRef({ key: '', at: 0 });

  const normalizeLogsResponse = (payload) => {
    if (Array.isArray(payload)) {
      return {
        items: payload,
        count: payload.length
      };
    }

    if (payload && typeof payload === 'object') {
      const items = payload.results || payload.data || payload.items || [];
      return {
        items,
        count: typeof payload.count === 'number' ? payload.count : items.length
      };
    }

    return {
      items: [],
      count: 0
    };
  };

  const fetchLogs = useCallback(async (params, showLoader = true) => {
    const requestKey = JSON.stringify(params || {});
    const now = Date.now();

    // Prevent duplicate calls for the exact same query in rapid succession.
    if (inFlightRequestKeyRef.current === requestKey) {
      return;
    }

    if (
      lastCompletedRequestRef.current.key === requestKey
      && now - lastCompletedRequestRef.current.at < 1200
    ) {
      return;
    }

    try {
      inFlightRequestKeyRef.current = requestKey;

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await getAuditLogs(params);
      const { items, count } = normalizeLogsResponse(response.data);
      const safeItems = Array.isArray(items) ? items : [];
      const visibleItems = safeItems.filter((log) => !EXCLUDED_ACTIONS.has(log?.action));
      const removedCount = safeItems.length - visibleItems.length;

      setLogs(visibleItems);
      setTotalCount(Math.max(0, count - removedCount));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      lastCompletedRequestRef.current = {
        key: requestKey,
        at: Date.now()
      };
      inFlightRequestKeyRef.current = '';
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(queryParams, true);
  }, [queryParams, fetchLogs]);

  const buildQueryParams = useCallback((overrides = {}) => {
    const effectiveFilters = {
      ...filterParams,
      ...overrides
    };

    const nextParams = {
      page: 1,
      page_size: DEFAULT_PAGE_SIZE
    };

    const trimmedSearch = searchTerm.trim();
    const trimmedActor = effectiveFilters.actor.trim();
    const trimmedAction = effectiveFilters.action.trim();

    if (trimmedSearch) {
      nextParams.search = trimmedSearch;
    }

    // Backend actor filter expects id, so non-id actor input falls back to text search.
    if (trimmedActor) {
      if (/^\d+$/.test(trimmedActor)) {
        nextParams.actor = trimmedActor;
      } else {
        nextParams.search = nextParams.search
          ? `${nextParams.search} ${trimmedActor}`
          : trimmedActor;
      }
    }

    if (trimmedAction) {
      nextParams.action = trimmedAction;
    }

    if (effectiveFilters.startDate && effectiveFilters.endDate) {
      nextParams.start_date = effectiveFilters.startDate;
      nextParams.end_date = effectiveFilters.endDate;
    }

    return nextParams;
  }, [filterParams, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setQueryParams(buildQueryParams());
  };

  const handleQuickAction = (actionValue) => {
    const nextFilters = {
      ...filterParams,
      action: actionValue
    };

    setFilterParams(nextFilters);
  };


  useEffect(() => {
    const timeout = setTimeout(() => {
      setQueryParams(buildQueryParams());
    }, 450);

    return () => clearTimeout(timeout);
  }, [buildQueryParams]);

  // Fetch single log detail
  const fetchLogDetail = async (logId) => {
    try {
      setLoadingDetail(true);
      const response = await getAuditLogDetail(logId);
      setLogDetail(response.data);
    } catch (error) {
      console.error('Error fetching log detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle clicking on a log to see details
  const handleLogClick = (log) => {
    setSelectedLog(log);
    setLogDetail(null);
    fetchLogDetail(log.id);
  };

  const closeDetail = () => {
    setSelectedLog(null);
    setLogDetail(null);
  };

  const getActorDisplay = (log) => {
    if (!log) return 'System';
    return log.actor_name || log.actor_email || log.actor || 'System';
  };

  const currentPage = Number(queryParams.page) || 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  const getVisiblePages = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
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
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-white to-gray-50 dark:from-[#0c0c0c] dark:to-[#111] border border-gray-100 dark:border-white/5 rounded-2xl p-4 sm:p-5">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_ACTIONS.map((action) => {
              const isActive = filterParams.action === action.value;

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleQuickAction(action.value)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                    isActive
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : 'bg-white/80 dark:bg-black/40 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-red-300'
                  }`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4">

            {/* Actor Filter */}
            <div className="xl:col-span-2 min-w-0">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Actor
              </label>
              <input
                type="text"
                placeholder="Actor ID or name..."
                value={filterParams.actor}
                onChange={(e) => setFilterParams({ ...filterParams, actor: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
              />
            </div>
            {/* Date Range */}
            <div className="xl:col-span-3 min-w-0">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filterParams.startDate}
                  onChange={(e) => setFilterParams({ ...filterParams, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
                />
                <input
                  type="date"
                  value={filterParams.endDate}
                  onChange={(e) => setFilterParams({ ...filterParams, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-transparent focus:border-red-600 rounded-xl text-sm font-bold outline-none dark:text-white transition-all"
                />
              </div>
            </div>
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
            Showing page {currentPage} of {totalPages} ({totalCount} total records)
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {logs.length > 0 ? logs.map((log) => (
            <div
              key={log.id}
              onClick={() => handleLogClick(log)}
              className="p-6 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
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
                      <span className="font-bold dark:text-white">{getActorDisplay(log)}</span>
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

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
              >
                Prev
              </button>

              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    page === currentPage
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-gray-200 dark:border-white/10 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeDetail}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0c0c0c] rounded-[2rem] p-5 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {getActionIcon(selectedLog.action)}
                  <h3 className="text-lg font-black dark:text-white uppercase">{selectedLog.action}</h3>
                </div>
                <button
                  onClick={closeDetail}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Actor</span>
                      <p className="font-bold dark:text-white break-all">{getActorDisplay(selectedLog)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Timestamp</span>
                      <p className="font-bold dark:text-white">{formatDateTime(selectedLog.created_at)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Target ID</span>
                      <p className="font-bold dark:text-white">{selectedLog.target_id || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-black text-gray-400 uppercase">IP Address</span>
                      <p className="font-bold dark:text-white">{selectedLog.ip_address || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl sm:col-span-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Identifier Used</span>
                      <p className="font-bold dark:text-white break-all">{selectedLog.identifier_used || 'N/A'}</p>
                    </div>
                  </div>

                  {(logDetail?.payload || selectedLog.payload) && (
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                      <span className="text-[9px] font-black text-gray-400 uppercase block mb-3">Full Details</span>
                      <pre className="text-xs dark:text-gray-300 overflow-x-auto">
                        {JSON.stringify(logDetail?.payload || selectedLog.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
