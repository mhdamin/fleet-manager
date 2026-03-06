import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Lock, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  FormField,
  ModalShell,
  SectionHeader,
  SelectInput,
  StatCard,
  StatusBadge,
  TableCard,
  TextInput,
} from './AppUI';
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
      await createUser({ username: form.username.trim(), password: form.password, roles: [form.role] });
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
      await updateUserById(user.id, { username: nextUsername.trim(), roles: user.roles });
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
  const adminUsers = useMemo(
    () => users.filter((user) => (user.roles || []).some((role) => role === 'ROLE_ADMIN' || role === 'ROLE_SUPERADMIN')).length,
    [users]
  );

  return (
    <div className="app-grid" style={{ gap: 24 }}>
      <SectionHeader
        title="User Management"
        description="Manage identities, roles, access, and account lifecycle controls."
        warning={error}
        action={
          <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Add New User
          </Button>
        }
      />

      <div className="app-grid app-grid--stats">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Active Users" value={activeUsers} />
        <StatCard label="Administrators" value={adminUsers} />
        <StatCard label="Assignable Roles" value={roles.length} />
      </div>

      <TableCard>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role(s)</th>
                <th>Last Login</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="app-empty">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="app-empty">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.username}</div>
                        <div className="app-muted" style={{ fontSize: 12 }}>ID: {user.id}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(user.roles || []).map((role) => (
                          <StatusBadge key={`${user.id}-${role}`} tone="inverse">
                            {normalizeRole(role)}
                          </StatusBadge>
                        ))}
                      </div>
                    </td>
                    <td className="app-muted">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                    <td>
                      <StatusBadge tone={(user.status || 'Active').toUpperCase() === 'INACTIVE' ? 'warning' : 'success'}>
                        {user.status || 'Active'}
                      </StatusBadge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button variant="ghost" size="sm" type="button" onClick={() => handleEditUser(user)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="secondary" size="sm" type="button" onClick={() => handleResetPassword(user)}>
                          <Lock size={14} />
                        </Button>
                        <Button variant="danger" size="sm" type="button" onClick={() => handleDeleteUser(user)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      {isCreateModalOpen ? (
        <ModalShell
          title="Create New User"
          onClose={() => setIsCreateModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="create-user-form" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </Button>
            </>
          }
        >
          <form id="create-user-form" onSubmit={handleCreateUser} className="app-grid">
            <FormField label="Username">
              <TextInput value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
            </FormField>
            <FormField label="Password">
              <TextInput
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </FormField>
            <FormField label="Role">
              <SelectInput value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
                {roles.map((role) => (
                  <option key={role} value={role}>{normalizeRole(role)}</option>
                ))}
              </SelectInput>
            </FormField>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default UserManagement;
