import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Code,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { apiService } from '../../services/apiService';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await apiService.getAdminAuditLogs({
        page,
        limit: 15,
        action: actionFilter,
        status: statusFilter
      });
      setLogs(data.logs || []);
      setPagination(data.pagination || { currentPage: page, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, statusFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-brand-purple" />
            Security Audit Trail & Operation Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all administrative actions, policy adjustments, and system mutations.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchLogs(pagination.currentPage)}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Action Types</option>
              <option value="ADMIN_USER_UPDATED">ADMIN_USER_UPDATED</option>
              <option value="ADMIN_FORCE_CANCEL_JOB">ADMIN_FORCE_CANCEL_JOB</option>
              <option value="ADMIN_PLATFORM_CONFIG_UPDATED">ADMIN_PLATFORM_CONFIG_UPDATED</option>
              <option value="ADMIN_SETTINGS_UPDATED">ADMIN_SETTINGS_UPDATED</option>
              <option value="ADMIN_MANUAL_GC_TRIGGERED">ADMIN_MANUAL_GC_TRIGGERED</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Execution Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/50 text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Admin User</th>
                <th className="py-3.5 px-4 font-semibold">Resource</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-purple" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-brand-cyan">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                          {log.user?.username || log.user?.email || 'System'}
                        </td>
                        <td className="py-3.5 px-4 capitalize text-slate-300">{log.resource}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={log.status === 'success' ? 'success' : 'error'}
                            size="sm"
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => toggleExpand(log._id)}
                            className="p-1 rounded hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
                            title="Inspect Details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON details */}
                      {isExpanded && (
                        <tr className="bg-dark-950/60">
                          <td colSpan="6" className="p-4 border-b border-white/5 font-mono text-[11px]">
                            <div className="bg-dark-900 p-3 rounded-xl border border-white/5 overflow-x-auto text-emerald-400">
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total logs)
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => fetchLogs(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                onClick={() => fetchLogs(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
