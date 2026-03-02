import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Lock, Trash2, X } from 'lucide-react';
import {
  createUser,
  deleteUserById,
  getAssignableRoles,
  getUsers,
  resetUserPassword,
  updateUserById,
  type UserResponse,
} from '../services/api';

interface NewUserForm {
  username: string;
  password: string;
  role: string;
}

const DEFAULT_FORM: NewUserForm = {
  username: '',
  password: '',
  role: 'ROLE_USER',
};

const normalizeRole = (role: string): string => role.replace(/^ROLE_/, '');

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [roles, setRoles] = useState<string[]>(['ROLE_USER']);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState<NewUserForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userData, assignableRoles] = await Promise.all([getUsers(), getAssignableRoles()]);
      setUsers(userData);
      setRoles(assignableRoles.length ? assignableRoles : ['ROLE_USER']);
    } catch {
      setError('Unable to load users from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (roles.length && !roles.includes(form.role)) {
      setForm((prev) => ({ ...prev, role: roles[0] }));
    }
  }, [roles, form.role]);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createUser({
        username: form.username.trim(),
        password: form.password,
        roles: [form.role],
      });
      setIsCreateModalOpen(false);
      setForm(DEFAULT_FORM);
      await loadData();
    } catch {
      setError('Failed to create user. Check role permissions and username uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (user: UserResponse) => {
    const nextUsername = prompt('Update username', user.username);
    if (!nextUsername || nextUsername.trim() === user.username) {
      return;
    }

    try {
      await updateUserById(user.id, {
        username: nextUsername.trim(),
        roles: user.roles,
      });
      await loadData();
    } catch {
      setError('Failed to update user.');
    }
  };

  const handleResetPassword = async (user: UserResponse) => {
    const nextPassword = prompt(`Enter new password for ${user.username}`);
    if (!nextPassword) {
      return;
    }

    try {
      await resetUserPassword(user.id, nextPassword);
      alert('Password reset successfully.');
    } catch {
      setError('Failed to reset password.');
    }
  };

  const handleDeleteUser = async (user: UserResponse) => {
    if (!confirm(`Delete user ${user.username}?`)) {
      return;
    }

    try {
      await deleteUserById(user.id);
      await loadData();
    } catch {
      setError('Failed to delete user.');
    }
  };

  const activeUsers = useMemo(() => users.filter((user) => (user.status || '').toUpperCase() !== 'INACTIVE').length, [users]);
  const adminUsers = useMemo(() => users.filter((user) => (user.roles || []).some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_SUPERADMIN')).length, [users]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-500">Manage user accounts, roles, and permissions.</p>
          {error && <p className="text-xs text-amber-600 mt-1">{error}</p>}
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-gray-800"
        >
          <Plus size={16} className="mr-2" /> Add New User
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Total Users</p><p className="text-xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Active Users</p><p className="text-xl font-bold">{activeUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Administrators</p><p className="text-xl font-bold">{adminUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Assignable Roles</p><p className="text-xl font-bold">{roles.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role(s)</th>
              <th className="px-6 py-4">Last Login</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{user.username}</span>
                      <span className="text-xs text-gray-500">ID: {user.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {(user.roles || []).map((role) => (
                        <span key={`${user.id}-${role}`} className="px-2 py-1 rounded-full text-xs font-bold text-white bg-gray-700">
                          {normalizeRole(role)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-gray-400">
                      <button onClick={() => handleEditUser(user)} className="hover:text-blue-600" aria-label="Edit user"><Edit2 size={16} /></button>
                      <button onClick={() => handleResetPassword(user)} className="hover:text-gray-600" aria-label="Reset password"><Lock size={16} /></button>
                      <button onClick={() => handleDeleteUser(user)} className="hover:text-red-600" aria-label="Delete user"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateUser} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Username</label>
              <input
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{normalizeRole(role)}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
