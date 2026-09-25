import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Download,
  Globe,
  Clock,
  Settings,
  ArrowLeft,
  Activity,
  Cpu
} from 'lucide-react';

export default function AdminSidebar({ isCollapsed, onToggle }) {
  const location = useLocation();

  const menuItems = [
    { name: 'Telemetry Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'System Jobs Monitor', path: '/admin/jobs', icon: Download },
    { name: 'Platform Adapters', path: '/admin/platforms', icon: Globe },
    { name: 'Security Audit Logs', path: '/admin/audit-logs', icon: Clock },
    { name: 'Global Settings', path: '/admin/settings', icon: Settings },
    { name: 'Traffic Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];


  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 bg-dark-900 border-r border-white/[0.08] flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Brand */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.08] justify-between">
        <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shrink-0 shadow-glow-purple">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-heading font-bold text-white text-sm">SocialStream</span>
              <span className="text-[10px] text-brand-cyan uppercase tracking-wider font-semibold">Admin Engine</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                active
                  ? 'bg-brand-purple text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-white hover:bg-dark-800'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="flex-1">{item.name}</span>}
              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Switch to Public app */}
      <div className="p-3 border-t border-white/[0.08]">
        <Link
          to="/"
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-dark-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Return to Public App"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Public Downloader</span>}
        </Link>
      </div>
    </aside>
  );
}
