import React from 'react';
import { Bell, Search, PanelLeftClose, PanelLeft, Shield } from 'lucide-react';
import Badge from '../common/Badge';

export default function AdminHeader({ isSidebarCollapsed, onToggleSidebar, title = 'System Overview' }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-xl border-b border-white/[0.08] px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          aria-label="Toggle Sidebar"
        >
          {isSidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        <div>
          <h1 className="text-base font-heading font-semibold text-white">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System status pill */}
        <Badge variant="success" size="sm">
          Node FFmpeg: Healthy
        </Badge>

        <button
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 relative transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-cyan" />
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-violet flex items-center justify-center font-bold text-xs text-white">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-white leading-tight">Admin Console</p>
            <p className="text-[10px] text-slate-400">Superuser</p>
          </div>
        </div>
      </div>
    </header>
  );
}
