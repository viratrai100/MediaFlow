import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { apiService } from '../../services/apiService';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [cancellingId, setCancellingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await apiService.getAdminJobs({
        page,
        limit: 10,
        search,
        status: statusFilter,
        platform: platformFilter
      });
      setJobs(data.jobs || []);
      setPagination(data.pagination || { currentPage: page, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error('Failed to list system jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, platformFilter]);

  useEffect(() => {
    fetchJobs(1);
    const interval = setInterval(() => {
      fetchJobs(pagination.currentPage);
    }, 10000); // 10s auto-refresh for active job monitor
    return () => clearInterval(interval);
  }, [fetchJobs, pagination.currentPage]);

  const handleForceCancel = async (jobId) => {
    setCancellingId(jobId);
    setFeedback(null);
    try {
      await apiService.cancelAdminJob(jobId);
      setFeedback({ type: 'success', message: 'Job force-cancelled successfully.' });
      fetchJobs(pagination.currentPage);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to cancel job'
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'cyan';
      case 'queued':
        return 'purple';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Download className="w-6 h-6 text-brand-purple" />
            System Download Job Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline monitoring, queue inspection, and administrative force-cancellation.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchJobs(pagination.currentPage)}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Pipeline
        </Button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by media title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Job Statuses</option>
              <option value="queued">Queued</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">X / Twitter</option>
              <option value="vimeo">Vimeo</option>
              <option value="direct">Direct Stream</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Jobs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/50 text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Job ID / Media</th>
                <th className="py-3.5 px-4 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Platform</th>
                <th className="py-3.5 px-4 font-semibold">Format</th>
                <th className="py-3.5 px-4 font-semibold">Status & Progress</th>
                <th className="py-3.5 px-4 font-semibold">Created</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-purple" />
                    Loading system jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No download jobs matching criteria.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => {
                  const isCancelable = ['queued', 'processing'].includes(j.status);
                  const isBusy = cancellingId === j._id;

                  return (
                    <tr key={j._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Media & ID */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-white truncate" title={j.mediaTitle}>
                            {j.mediaTitle || 'Untitled Video'}
                          </span>
                          <span className="text-slate-500 text-[10px] font-mono">{j._id}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-mono text-[11px]">
                          {j.user?.username || j.user?.email || 'Guest / Unlinked'}
                        </span>
                      </td>

                      {/* Platform */}
                      <td className="py-3.5 px-4 uppercase font-semibold text-slate-300">
                        {j.platform}
                      </td>

                      {/* Format */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {j.selectedFormat?.qualityLabel || j.selectedFormat?.formatId || 'Default'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <Badge variant={getStatusBadgeVariant(j.status)} size="sm">
                            {j.status} ({j.progress || 0}%)
                          </Badge>
                          {j.status === 'processing' && (
                            <div className="w-24 h-1 bg-dark-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-cyan"
                                style={{ width: `${j.progress || 0}%` }}
                              />
                            </div>
                          )}
                          {j.errorMessage && (
                            <p className="text-[10px] text-red-400 truncate max-w-xs" title={j.errorMessage}>
                              {j.errorMessage}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(j.createdAt).toLocaleTimeString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isCancelable ? (
                          <button
                            disabled={isBusy}
                            onClick={() => handleForceCancel(j._id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors inline-flex items-center gap-1"
                            title="Force cancel active worker pipeline"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isBusy ? 'Cancelling...' : 'Force Stop'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total jobs)
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => fetchJobs(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                onClick={() => fetchJobs(pagination.currentPage + 1)}
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
