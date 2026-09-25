import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Video,
  Sparkles,
  History,
  User,
  Sliders,
  HelpCircle,
  LayoutDashboard,
  Menu,
  X,
  LogIn,
  LogOut,
  Shield
} from 'lucide-react';
import Button from '../common/Button';
import { useDownload } from '../../context/DownloadContext';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const location = useLocation();
  const { history } = useDownload();
  const { user, isAdmin, logout } = useAuth();

  const navLinks = [
    { name: 'Downloader', path: '/', icon: Video },
    { name: 'History', path: '/history', icon: History, count: history.length },
    { name: 'Features', path: '/features', icon: Sparkles },
    { name: 'Tutorials', path: '/help', icon: HelpCircle },
    { name: 'Settings', path: '/settings', icon: Sliders },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-dark-900/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple via-brand-blue to-brand-cyan flex items-center justify-center shadow-glow-purple group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-heading font-bold text-white tracking-tight">
                  Social<span className="text-brand-cyan">Stream</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-dark-800/70 p-1.5 rounded-full border border-white/5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? 'bg-brand-purple text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                    {typeof link.count === 'number' && link.count > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] font-bold">
                        {link.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions: Auth / Admin */}
            <div className="hidden sm:flex items-center gap-2.5">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-800 border border-white/5 text-xs text-slate-200 hover:border-brand-purple/40 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-lg bg-brand-purple/20 text-brand-purple flex items-center justify-center font-bold text-[10px]">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{user.username}</span>
                    {isAdmin && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded font-mono">
                        Admin
                      </span>
                    )}
                  </Link>

                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="secondary" size="sm" icon={LayoutDashboard}>
                        Admin
                      </Button>
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-dark-800 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenAuth('login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenAuth('signup')}
                  >
                    Sign Up
                  </Button>
                  <Link to="/admin">
                    <Button variant="secondary" size="sm" icon={Shield}>
                      Admin
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-white/10 bg-dark-900/95 backdrop-blur-2xl px-4 pt-2 pb-6 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium ${
                    active
                      ? 'bg-brand-purple/20 text-white border border-brand-purple/30'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {typeof link.count === 'number' && link.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan text-xs">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-white/10 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2 bg-dark-800 rounded-xl text-xs text-white">
                    <span>Signed in as <b>{user.username}</b></span>
                    <button onClick={logout} className="text-red-400 font-semibold">
                      Sign Out
                    </button>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" size="md" className="w-full" icon={LayoutDashboard}>
                        Admin Portal
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenAuth('login');
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenAuth('signup');
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
