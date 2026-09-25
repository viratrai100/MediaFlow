import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Clock,
  Zap,
  Globe
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { apiService } from '../../services/apiService';

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchPlatforms = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAdminPlatforms();
      setPlatforms(data || []);
    } catch (err) {
      console.error('Failed to load platforms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleUpdate = async (platformName, updates) => {
    setSavingPlatform(platformName);
    setFeedback(null);
    try {
      const updated = await apiService.updateAdminPlatform(platformName, updates);
      setFeedback({
        type: 'success',
        message: `Platform '${platformName.toUpperCase()}' configuration updated.`
      });
      // Update local state
      setPlatforms((prev) =>
        prev.map((p) => (p.platform === platformName ? { ...p, ...updates } : p))
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update platform'
      });
    } finally {
      setSavingPlatform(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-brand-purple" />
            Platform Ingest Adapters & Rules
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enable or disable specific platform extractors, define per-platform rate limits and duration caps.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchPlatforms}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Adapters
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
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading && platforms.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-purple" />
            Loading platform adapter matrix...
          </div>
        ) : (
          platforms.map((p) => {
            const isSaving = savingPlatform === p.platform;

            return (
              <Card key={p.platform} className="space-y-4 flex flex-col justify-between">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-brand-cyan">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">
                          {p.name || p.platform.toUpperCase()}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono">
                          adapter: {p.platform}
                        </span>
                      </div>
                    </div>
                    <Badge variant={p.isEnabled ? 'success' : 'error'} size="sm">
                      {p.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  {/* Config Inputs */}
                  <div className="mt-5 space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center justify-between text-[11px]">
                        <span>Rate Limit (requests / min)</span>
                        <Zap className="w-3 h-3 text-amber-400" />
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        defaultValue={p.rateLimitPerMinute || 20}
                        onBlur={(e) =>
                          handleUpdate(p.platform, {
                            rateLimitPerMinute: Number(e.target.value)
                          })
                        }
                        className="w-full px-3 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-white font-mono focus:border-brand-purple focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center justify-between text-[11px]">
                        <span>Max Duration (seconds)</span>
                        <Clock className="w-3 h-3 text-brand-purple" />
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="7200"
                        defaultValue={p.maxDurationSeconds || 1800}
                        onBlur={(e) =>
                          handleUpdate(p.platform, {
                            maxDurationSeconds: Number(e.target.value)
                          })
                        }
                        className="w-full px-3 py-1.5 bg-dark-900 border border-white/10 rounded-lg text-white font-mono focus:border-brand-purple focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Toggle Button */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Adapter Status</span>
                  <button
                    disabled={isSaving}
                    onClick={() =>
                      handleUpdate(p.platform, { isEnabled: !p.isEnabled })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      p.isEnabled
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : p.isEnabled ? (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Disable Adapter
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Enable Adapter
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
