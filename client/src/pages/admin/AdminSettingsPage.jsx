import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Zap,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Lock
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

import { apiService } from '../../services/apiService';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: 'System is undergoing scheduled maintenance.',
    maxConcurrentDownloadsPerUser: 2,
    globalRateLimitPerMinute: 60,
    maxDownloadFileSizeMB: 500,
    tempFileTtlMinutes: 60,
    allowRegistration: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gcLoading, setGcLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminSettings();
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await apiService.updateAdminSettings(settings);
      if (updated) {
        setSettings((prev) => ({ ...prev, ...updated }));
      }
      setFeedback({ type: 'success', message: 'Global system settings persisted successfully.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerGC = async () => {
    setGcLoading(true);
    setFeedback(null);
    try {
      const res = await apiService.triggerAdminGC();
      setFeedback({
        type: 'success',
        message: res.message || 'Scratch storage cleaned successfully.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to trigger GC'
      });
    } finally {
      setGcLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-brand-purple" />
            Global Operational Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure system concurrency ceilings, storage retention, maintenance mode, and security boundaries.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchSettings}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      {/* Feedback Banner */}
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

      {loading ? (
        <Card className="py-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-purple" />
          Loading settings...
        </Card>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Concurrency & Quota Settings */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-cyan" />
              Resource Ceilings & Concurrency
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Concurrent Downloads Per User
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxConcurrentDownloadsPerUser}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxConcurrentDownloadsPerUser: Number(e.target.value)
                    })
                  }
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ceiling of concurrent active download pipelines per single user session.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Global Rate Limit (requests / min / IP)
                </label>
                <Input
                  type="number"
                  min="10"
                  max="300"
                  value={settings.globalRateLimitPerMinute}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      globalRateLimitPerMinute: Number(e.target.value)
                    })
                  }
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  IP-level burst threshold applied to public API endpoints.
                </span>
              </div>
            </div>
          </Card>

          {/* Storage & Retention */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400" />
                Storage & Temporary Retention Policy
              </h3>
              <button
                type="button"
                onClick={handleTriggerGC}
                disabled={gcLoading}
                className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1.5"
              >
                <Zap className={`w-3.5 h-3.5 ${gcLoading ? 'animate-spin' : ''}`} />
                {gcLoading ? 'Purging...' : 'Trigger Immediate GC'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Download File Size (MB)
                </label>
                <Input
                  type="number"
                  min="10"
                  max="2048"
                  value={settings.maxDownloadFileSizeMB}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxDownloadFileSizeMB: Number(e.target.value)
                    })
                  }
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Maximum permitted content length for video/audio downloads.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Scratch File TTL (minutes)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.tempFileTtlMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tempFileTtlMinutes: Number(e.target.value)
                    })
                  }
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Time-to-live before temporary media chunks and downloads are purged from disk.
                </span>
              </div>
            </div>
          </Card>

          {/* Maintenance Mode & Registration */}
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              Access & Maintenance Controls
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Enable Maintenance Mode</p>
                  <p className="text-[11px] text-slate-400">
                    Temporarily blocks new non-admin downloads with custom message.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.isMaintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, isMaintenanceMode: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-600 text-brand-purple focus:ring-brand-purple"
                />
              </div>

              {settings.isMaintenanceMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Maintenance Banner Message
                  </label>
                  <Input
                    type="text"
                    value={settings.maintenanceMessage}
                    onChange={(e) =>
                      setSettings({ ...settings, maintenanceMessage: e.target.value })
                    }
                    placeholder="System is undergoing scheduled maintenance."
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-white/5">
                <div>
                  <p className="text-xs font-semibold text-white">Allow Public User Signups</p>
                  <p className="text-[11px] text-slate-400">
                    If disabled, only administrators can register or invite accounts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowRegistration}
                  onChange={(e) =>
                    setSettings({ ...settings, allowRegistration: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-600 text-brand-purple focus:ring-brand-purple"
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="px-6"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Global Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
