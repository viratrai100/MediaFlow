import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/navigation/AdminSidebar';
import AdminHeader from '../components/navigation/AdminHeader';

/**
 * Admin Portal Layout
 */
export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/admin':
        return 'System & Extraction Dashboard';
      case '/admin/analytics':
        return 'Media Traffic & Conversion Analytics';
      case '/admin/workers':
        return 'FFmpeg Stream Workers';
      case '/admin/rules':
        return 'Platform Rules & Rate Limiting';
      case '/admin/settings':
        return 'System Preferences';
      default:
        return 'Admin Engine';
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <AdminHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
