import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  HardDrive,
  RefreshCw,
  Server,
  ShieldAlert,
  Zap,
  Users,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { apiService } from '../../services/apiService';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gcLoading, setGcLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminStats();
      setStatsData(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleGC = async () => {
    setGcLoading(true);
    setFeedback(null);
    try {
      const res = await apiService.triggerAdminGC();
      setFeedback({ type: 'success', message: res.message || 'Scratch storage cleaned successfully.' });
      fetchStats();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.response?.data?.message || 'Failed to trigger GC' });
    } finally {
      setGcLoading(false);
    }
  };

  const usersCount = statsData?.users?.totalRegistered ?? 0;
  const activeJobs = statsData?.jobs?.active ?? 0;
  const completedJobs = statsData?.jobs?.completed ?? 0;
  const failedJobs = statsData?.jobs?.failed ?? 0;
  const heapUsed = statsData?.system?.memory?.heapUsedMB ?? 0;
  const uptime = statsData?.system?.uptimeSeconds ?? 0;
  const activeWorkers = statsData?.system?.activeWorkerPipes ?? 0;
  const successRate = statsData?.jobs?.successRate ?? '100%';

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-8">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Monitor & Telemetry</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time Node.js stream health, memory telemetry, and download metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGC}
            disabled={gcLoading}
          >
            <Zap className={`w-3.5 h-3.5 mr-1.5 ${gcLoading ? 'animate-spin' : ''}`} />
            Purge Scratch GC
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Queue Pipelines</span>
            <div className="p-2 rounded-xl bg-dark-700 text-brand-purple border border-white/5">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{activeJobs}</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <span>{activeWorkers} worker thread(s) processing</span>
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Completed Jobs</span>
            <div className="p-2 rounded-xl bg-dark-700 text-emerald-400 border border-white/5">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{completedJobs}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <span>Success rate: <b className="text-emerald-400">{successRate}</b></span>
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Registered Users</span>
            <div className="p-2 rounded-xl bg-dark-700 text-brand-cyan border border-white/5">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{usersCount}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <span>{statsData?.users?.adminCount || 1} Admins | {statsData?.users?.blockedCount || 0} Blocked</span>
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Node.js Heap Memory</span>
            <div className="p-2 rounded-xl bg-dark-700 text-amber-400 border border-white/5">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{heapUsed} MB</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <span>Uptime: {formatUptime(uptime)}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Active Pipeline Status & Health Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Workers */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-cyan" />
              Real-time Ingest & Worker Engine
            </h3>
            <Badge variant="cyan" size="sm">{activeWorkers} Processing Units</Badge>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">Stream Pipeline Queue Engine</span>
                <span className="text-emerald-400 font-mono text-[11px]">Ready / Active</span>
              </div>
              <p className="text-xs text-slate-400">
                Node.js Native Stream and FFmpeg pipeline processing media tasks asynchronously with bounded user concurrency and SSRF safety controls.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-white/5">
                <div className="p-2 bg-dark-800 rounded-lg">
                  <p className="text-slate-400 text-[10px]">Active Jobs</p>
                  <p className="text-brand-purple font-bold text-sm">{activeJobs}</p>
                </div>
                <div className="p-2 bg-dark-800 rounded-lg">
                  <p className="text-slate-400 text-[10px]">Completed</p>
                  <p className="text-emerald-400 font-bold text-sm">{completedJobs}</p>
                </div>
                <div className="p-2 bg-dark-800 rounded-lg">
                  <p className="text-slate-400 text-[10px]">Failed</p>
                  <p className="text-red-400 font-bold text-sm">{failedJobs}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Platform Quotas */}
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Security & Policy Status
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">SSRF Filter</span>
              <span className="text-emerald-400 font-medium">Strict DNS/IP Block</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">DRM & Paywalls</span>
              <span className="text-emerald-400 font-medium">Reject Permitted</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Node Runtime</span>
              <span className="text-slate-200 font-mono">{statsData?.system?.nodeVersion || 'v18+'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">CPU Cores</span>
              <span className="text-slate-200 font-medium">{statsData?.system?.cpuCount || 4} Available</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent System Audit Activity */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-purple" />
            Recent Administrative Audit Trail
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="pb-3 font-semibold">Action</th>
                <th className="pb-3 font-semibold">Resource</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {statsData?.recentAudits?.length > 0 ? (
                statsData.recentAudits.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-mono text-brand-cyan">{log.action}</td>
                    <td className="py-3 capitalize">{log.resource}</td>
                    <td className="py-3">
                      <Badge variant={log.status === 'success' ? 'success' : 'error'} size="sm">
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-500">
                    No recent administrative audit events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
