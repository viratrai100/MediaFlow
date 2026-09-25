import React, { useState } from 'react';
import {
  User,
  Shield,
  HardDrive,
  Zap,
  Award,
  Sparkles,
  Sliders,
  CheckCircle2,
  LogIn,
  LogOut,
  Mail,
  Calendar,
  Layers,
  Key
} from 'lucide-react';
import { useDownload } from '../../context/DownloadContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import AuthModal from '../../components/auth/AuthModal';

export default function ProfilePage() {
  const { history } = useDownload();
  const { user, isAdmin, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const totalDownloads = history.length;
  const estimatedMB = history
    .reduce((acc, curr) => acc + (parseFloat(curr.size) || 20), 0)
    .toFixed(0);

  const dailyLimit = user?.quota?.dailyLimit ?? 15;
  const usedToday = user?.quota?.usedToday ?? 0;
  const remainingToday = Math.max(0, dailyLimit - usedToday);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Profile Header Card */}
      <Card variant="gradient" className="p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-purple via-brand-blue to-brand-cyan flex items-center justify-center text-white text-2xl font-bold shadow-glow-purple shrink-0">
              {user ? user.username.slice(0, 2).toUpperCase() : 'GU'}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-white">
                  {user ? user.username : 'Guest Streaming Session'}
                </h1>
                <Badge variant={user ? (isAdmin ? 'purple' : 'success') : 'cyan'} size="sm">
                  {user ? (isAdmin ? 'Administrator' : 'Registered User') : 'Guest Session'}
                </Badge>
              </div>

              {user ? (
                <p className="text-xs text-slate-400 flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="font-mono text-slate-300">{user.email}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Anonymous Mode • Connect your account to sync cloud download history
                </p>
              )}

              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="px-2.5 py-1 rounded-lg bg-dark-900/60 text-emerald-400 text-xs font-medium border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Quota: {remainingToday} / {dailyLimit} Remaining Today
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            {user ? (
              <Button
                variant="danger"
                size="sm"
                onClick={logout}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                >
                  Create Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Usage Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Streams Downloaded</span>
            <HardDrive className="w-4 h-4 text-brand-purple" />
          </div>
          <p className="text-2xl font-bold text-white">{totalDownloads}</p>
          <p className="text-[11px] text-slate-500">
            {user ? 'Synced across session' : 'Stored in browser cache'}
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Bandwidth Streamed</span>
            <Zap className="w-4 h-4 text-brand-cyan" />
          </div>
          <p className="text-2xl font-bold text-white">{estimatedMB} MB</p>
          <p className="text-[11px] text-slate-500">Direct chunked pipeline</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Access Tier</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {user ? (isAdmin ? 'Admin Master' : 'Registered Pro') : 'Guest Standard'}
          </p>
          <p className="text-[11px] text-slate-500">
            {user ? 'Priority processing pipeline' : 'Standard 1080p & 320k Audio'}
          </p>
        </Card>
      </div>

      {/* Account Details / Guest Promotion */}
      {user ? (
        <Card className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-purple" />
            Account Security & Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 space-y-1">
              <span className="text-slate-400">Account Username</span>
              <p className="font-semibold text-white">{user.username}</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 space-y-1">
              <span className="text-slate-400">Account Email</span>
              <p className="font-semibold text-white font-mono">{user.email}</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 space-y-1">
              <span className="text-slate-400">Daily Download Quota</span>
              <p className="font-semibold text-white">{dailyLimit} requests/day</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 space-y-1">
              <span className="text-slate-400">Account Registered</span>
              <p className="font-semibold text-white">
                {new Date(user.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="space-y-4 border-brand-purple/20">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
              Unlock Registered Member Benefits
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setAuthMode('signup');
                setAuthModalOpen(true);
              }}
            >
              Sign Up Free
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 space-y-1">
              <span className="font-semibold text-white">Higher Daily Quota</span>
              <p className="text-slate-400">50 downloads/day vs 15 for guests</p>
            </div>
            <div className="p-3 rounded-xl bg-dark-900/60 border border-white/5 space-y-1">
              <span className="font-semibold text-white">Cloud Sync</span>
              <p className="text-slate-400">Access download records across devices</p>
            </div>
          </div>
        </Card>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
