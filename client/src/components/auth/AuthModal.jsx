import React, { useState } from 'react';
import { LogIn, UserPlus, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }) {
  const { login, signup, error: authError } = useAuth();
  const [mode, setMode] = useState(defaultMode); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        setSuccessMessage('Logged in successfully!');
      } else {
        await signup(username.trim(), email.trim(), password);
        setSuccessMessage('Account registered successfully!');
      }

      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Sign In to SocialStream' : 'Create an Account'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username
              </label>
              <Input
                type="text"
                placeholder="media_pro"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            {mode === 'signup' && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                At least 8 characters with letters and numbers.
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="pt-3 border-t border-white/5 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-brand-cyan hover:underline font-semibold"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-brand-cyan hover:underline font-semibold"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
