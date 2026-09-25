import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft, LogIn, RefreshCw } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';





/**
 * Route guard for /admin paths.
 * If user is not logged in or not an admin, prompts with a sleek admin login modal / access denied.
 */
export default function AdminRouteGuard({ children }) {
  const { user, isAdmin, loading, login, error: authError } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-purple animate-spin" />
          <p className="text-slate-400 text-sm">Authenticating administrative session...</p>
        </div>
      </div>
    );
  }

  // If already logged in and is admin, render children
  if (user && isAdmin) {
    return children;
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError('Please provide administrative credentials.');
      return;
    }

    setSubmitting(true);
    setLoginError('');
    try {
      const data = await login(email.trim(), password);
      if (data.user.role !== 'admin') {
        setLoginError('Access denied: Account does not have administrative privileges.');
      }
    } catch (err) {
      setLoginError(err.message || 'Administrative login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full glassmorphism-card p-8 rounded-2xl border border-red-500/20 shadow-2xl space-y-6">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-glow-purple">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-heading font-bold text-white tracking-wide">
            Administrative Access Restricted
          </h2>
          <p className="text-xs text-slate-400 max-w-xs">
            The endpoint <code className="text-brand-purple px-1 py-0.5 rounded bg-dark-800">{location.pathname}</code> requires verified administrator credentials.
          </p>
        </div>

        {/* Error message */}
        {(loginError || authError) && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{loginError || authError}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Email
            </label>
            <Input
              type="email"
              placeholder="admin@socialstream.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center bg-gradient-to-r from-red-600 to-brand-purple hover:from-red-500 hover:to-brand-purple"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In as Administrator
              </>
            )}
          </Button>
        </form>

        {/* Back Link */}
        <div className="pt-2 text-center border-t border-white/[0.08]">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Public Downloader
          </a>
        </div>
      </div>
    </div>
  );
}
