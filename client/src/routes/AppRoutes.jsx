import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import UserLayout from '../layouts/UserLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public User Pages
import HomePage from '../pages/user/HomePage';
import FeaturesPage from '../pages/user/FeaturesPage';
import FAQPage from '../pages/user/FAQPage';
import HistoryPage from '../pages/user/HistoryPage';
import ProfilePage from '../pages/user/ProfilePage';
import SettingsPage from '../pages/user/SettingsPage';
import HelpPage from '../pages/user/HelpPage';

// Admin Portal Pages & Guard
import AdminRouteGuard from '../components/auth/AdminRouteGuard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminJobsPage from '../pages/admin/AdminJobsPage';
import AdminPlatformsPage from '../pages/admin/AdminPlatformsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

// 404
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public User Routes */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      {/* Admin Portal Routes (Guarded by AdminRouteGuard) */}
      <Route
        path="/admin"
        element={
          <AdminRouteGuard>
            <AdminLayout />
          </AdminRouteGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="jobs" element={<AdminJobsPage />} />
        <Route path="platforms" element={<AdminPlatformsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Catch-all 404 */}
      <Route element={<UserLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

