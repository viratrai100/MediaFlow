import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  RefreshCw,
  Edit2,
  Check,
  X,
  AlertCircle,
  Sliders
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';



import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [feedback, setFeedback] = useState(null);

  // Edit quota modal/inline state
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingQuota, setEditingQuota] = useState(20);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await apiService.getAdminUsers({
        page,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter
      });
      setUsers(data.users || []);
      setPagination(data.pagination || { currentPage: page, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error('Failed to list users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleUpdateUser = async (userId, updates) => {
    setUpdatingId(userId);
    setFeedback(null);
    try {
      await apiService.updateAdminUser(userId, updates);
      setFeedback({ type: 'success', message: 'User updated successfully.' });
      setEditingUserId(null);
      fetchUsers(pagination.currentPage);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update user'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-purple" />
            User Account Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage user roles, ban/unban status, and daily download quotas.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchUsers(pagination.currentPage)}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
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
            <UserCheck className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Roles</option>
              <option value="user">Standard Users</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-purple"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="blocked">Deactivated / Blocked</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/50 text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">User</th>
                <th className="py-3.5 px-4 font-semibold">Role</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Daily Quota</th>
                <th className="py-3.5 px-4 font-semibold">Registered</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-purple" />
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?._id === u._id || currentUser?.id === u._id;
                  const isBusy = updatingId === u._id;
                  const isEditingThisQuota = editingUserId === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            {u.username}
                            {isSelf && (
                              <span className="text-[9px] bg-brand-purple/20 text-brand-purple px-1.5 py-0.5 rounded font-mono">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 text-[11px] font-mono">{u.email}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <Badge variant={u.role === 'admin' ? 'purple' : 'neutral'} size="sm">
                          {u.role === 'admin' ? 'Administrator' : 'Standard User'}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={u.isBlocked ? 'error' : 'success'} size="sm">
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </td>

                      {/* Daily Quota */}
                      <td className="py-3.5 px-4">
                        {isEditingThisQuota ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={editingQuota}
                              onChange={(e) => setEditingQuota(Number(e.target.value))}
                              className="w-16 px-1.5 py-1 bg-dark-800 border border-brand-purple rounded text-xs text-white"
                            />
                            <button
                              onClick={() => handleUpdateUser(u._id, { dailyLimit: editingQuota })}
                              className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 rounded bg-dark-700 text-slate-400 hover:bg-dark-600"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{u.quota?.dailyLimit ?? 20} reqs/day</span>
                            <button
                              onClick={() => {
                                setEditingUserId(u._id);
                                setEditingQuota(u.quota?.dailyLimit ?? 20);
                              }}
                              className="text-slate-500 hover:text-slate-300 p-1"
                              title="Edit Quota"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Registered */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role toggle */}
                          <button
                            disabled={isSelf || isBusy}
                            onClick={() =>
                              handleUpdateUser(u._id, {
                                role: u.role === 'admin' ? 'user' : 'admin'
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                              u.role === 'admin'
                                ? 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20'
                                : 'bg-dark-700 text-slate-300 hover:bg-dark-600'
                            } ${isSelf ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title={
                              isSelf
                                ? 'Cannot demote self'
                                : u.role === 'admin'
                                ? 'Demote to standard user'
                                : 'Promote to administrator'
                            }
                          >
                            {u.role === 'admin' ? 'Demote' : 'Promote Admin'}
                          </button>

                          {/* Block/Unblock toggle */}
                          <button
                            disabled={isSelf || isBusy}
                            onClick={() =>
                              handleUpdateUser(u._id, {
                                isBlocked: !u.isBlocked
                              })
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isBlocked
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            } ${isSelf ? 'opacity-40 cursor-not-allowed' : ''}`}
                            title={
                              isSelf
                                ? 'Cannot block own account'
                                : u.isBlocked
                                ? 'Unblock user'
                                : 'Block user'
                            }
                          >
                            {u.isBlocked ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <UserX className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total users)
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => fetchUsers(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                onClick={() => fetchUsers(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
