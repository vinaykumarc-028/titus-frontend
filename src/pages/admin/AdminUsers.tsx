import React, { useState, useEffect } from 'react';
import {
  Search, UserPlus, Shield, User, Trash2, RefreshCw,
  MoreVertical, CheckCircle, XCircle, KeyRound, Pencil, X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { triggerToast } from '../../components/ui/ToastContainer';
import { api } from '../../lib/api';
import styles from './AdminUsers.module.css';

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

type ActionType = 'delete' | 'deactivate' | 'activate' | 'resetPassword';

const ACTION_CONFIGS: Record<ActionType, { title: string; description: (u: UserItem) => string; confirm: string; variant: 'danger' | 'warning' | 'default' }> = {
  delete:        { title: 'Delete User',          description: u => `Permanently delete "${u.full_name}"? This cannot be undone.`,                variant: 'danger',  confirm: 'Delete' },
  deactivate:    { title: 'Deactivate Account',   description: u => `Deactivate "${u.full_name}"? They will lose all access until reactivated.`, variant: 'warning', confirm: 'Deactivate' },
  activate:      { title: 'Activate Account',     description: u => `Activate "${u.full_name}"? They will regain access to the platform.`,       variant: 'default', confirm: 'Activate' },
  resetPassword: { title: 'Reset Password',       description: u => `Reset password for "${u.full_name}"? They will receive a temporary password.`, variant: 'warning', confirm: 'Reset Password' },
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers]           = useState<UserItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'Admin' | 'Operator'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Confirm dialog
  const [pendingAction, setPendingAction] = useState<{ type: ActionType; user: UserItem } | null>(null);

  // Create / Edit form
  const [showForm, setShowForm]   = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName]   = useState('');
  const [formPass, setFormPass]   = useState('');
  const [formRole, setFormRole]   = useState('Operator');
  const [formLoading, setFormLoading] = useState(false);

  // Menu
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<UserItem[]>('/users/');
      setUsers(data || []);
    } catch {
      triggerToast('error', 'Error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Close menu on outside click
  useEffect(() => {
    const close = () => setOpenMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFormEmail(''); setFormName(''); setFormPass(''); setFormRole('Operator');
    setShowForm(true);
  };

  const openEdit = (u: UserItem) => {
    setEditingUser(u);
    setFormName(u.full_name);
    setFormEmail(u.email);
    setFormPass('');
    setFormRole(u.role);
    setShowForm(true);
    setOpenMenu(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingUser) {
        // Edit: only update role/name via available endpoints
        // We use a direct register-style update (backend only has create + activate/deactivate)
        triggerToast('info', 'Not Supported', 'Direct user edits require a backend PATCH endpoint. Activate/deactivate and password reset are available.');
      } else {
        await api.post('/auth/register', {
          full_name: formName,
          email: formEmail,
          password: formPass,
          role: formRole,
        });
        triggerToast('success', 'User Created', `${formName} added successfully.`);
        setShowForm(false);
        fetchUsers();
      }
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Failed to save user.');
    } finally {
      setFormLoading(false);
    }
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    const { type, user } = pendingAction;
    try {
      if (type === 'delete') {
        await api.delete(`/users/${user.id}`);
        setUsers(prev => prev.filter(u => u.id !== user.id));
        triggerToast('success', 'Deleted', `${user.full_name} removed.`);
      } else if (type === 'activate') {
        await api.patch(`/users/${user.id}/activate`, {});
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true } : u));
        triggerToast('success', 'Activated', `${user.full_name} is now active.`);
      } else if (type === 'deactivate') {
        await api.patch(`/users/${user.id}/deactivate`, {});
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: false } : u));
        triggerToast('success', 'Deactivated', `${user.full_name} has been deactivated.`);
      } else if (type === 'resetPassword') {
        const res = await api.post<{ temporary_password: string }>(`/users/${user.id}/reset-password`, {});
        triggerToast('success', 'Password Reset', `Temporary password: ${res?.temporary_password || 'Password@123'}`);
      }
    } catch {
      triggerToast('error', 'Error', `Failed to ${type} user.`);
    } finally {
      setPendingAction(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !searchTerm ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
    Admin:    { bg: 'rgba(124,58,237,0.12)',  color: '#7c3aed' },
    Operator: { bg: 'rgba(37,99,235,0.12)',   color: '#2563eb' },
  };

  const confirmConfig = pendingAction ? ACTION_CONFIGS[pendingAction.type] : null;

  return (
    <div className={styles.page}>
      {/* Confirm Dialog */}
      {pendingAction && confirmConfig && (
        <ConfirmationDialog
          isOpen
          title={confirmConfig.title}
          description={confirmConfig.description(pendingAction.user)}
          confirmText={confirmConfig.confirm}
          cancelText="Cancel"
          variant={confirmConfig.variant === 'warning' || confirmConfig.variant === 'default' ? 'danger' : 'danger'}
          onConfirm={executeAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>User Management</h2>
          <p className={styles.subtitle}>
            {users.filter(u => u.is_active).length} active · {users.filter(u => !u.is_active).length} inactive · {users.length} total
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={<UserPlus size={14} />} onClick={openCreate}>
            Add User
          </Button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className={styles.createCard}>
          <div className={styles.createCardHeader}>
            <h3 className={styles.createTitle}>{editingUser ? 'Edit User' : 'New User'}</h3>
            <button className={styles.closeBtn} onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <form onSubmit={handleFormSubmit} className={styles.createForm}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Full Name</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className={styles.formField}>
                <label>Email</label>
                <input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="jane@titus.com" disabled={!!editingUser} />
              </div>
              {!editingUser && (
                <div className={styles.formField}>
                  <label>Password</label>
                  <input type="password" required value={formPass} onChange={e => setFormPass(e.target.value)} placeholder="Min. 8 characters" />
                </div>
              )}
              <div className={styles.formField}>
                <label>Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="Operator">Operator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" loading={formLoading}>
                {editingUser ? 'Save Changes' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <select className={styles.filterSelect} value={filterRole} onChange={e => setFilterRole(e.target.value as any)}>
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Operator">Operator</option>
          </select>
          <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total Users', value: users.length, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          { label: 'Admins',      value: users.filter(u => u.role === 'Admin').length,    color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          { label: 'Operators',   value: users.filter(u => u.role === 'Operator').length, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Active',      value: users.filter(u => u.is_active).length,           color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
          { label: 'Inactive',    value: users.filter(u => !u.is_active).length,          color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
        ].map(stat => (
          <div key={stat.label} className={styles.statCard} style={{ borderColor: stat.color + '33' }}>
            <span className={styles.statValue} style={{ color: stat.color }}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.tableRow}>
                <div className={styles.userCell}>
                  <div className={styles.skeleton} style={{ width: 34, height: 34, borderRadius: '50%' }} />
                  <div>
                    <div className={styles.skeleton} style={{ width: 130, height: 13, marginBottom: 5 }} />
                    <div className={styles.skeleton} style={{ width: 170, height: 11 }} />
                  </div>
                </div>
                <div className={styles.skeleton} style={{ width: 72, height: 22, borderRadius: 20 }} />
                <div className={styles.skeleton} style={{ width: 62, height: 22, borderRadius: 20 }} />
                <div className={styles.skeleton} style={{ width: 80, height: 13 }} />
                <div />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <User size={36} />
              <p>{users.length === 0 ? 'No users yet. Add your first user.' : `No results for "${searchTerm}".`}</p>
            </div>
          ) : filtered.map(user => {
            const rc = ROLE_COLOR[user.role] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' };
            const initials = (user.full_name || '')
              .split(' ')
              .filter(Boolean)
              .map(w => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '??';
            return (
              <div key={user.id} className={styles.tableRow}>
                <div className={styles.userCell}>
                  <div className={styles.avatar} style={{ background: rc.bg, color: rc.color }}>{initials}</div>
                  <div>
                    <div className={styles.userName}>{user.full_name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>

                <span className={styles.badge} style={{ background: rc.bg, color: rc.color }}>
                  {user.role === 'Admin' ? <Shield size={10} /> : <User size={10} />}
                  {user.role}
                </span>

                <span className={styles.badge} style={
                  user.is_active
                    ? { background: 'rgba(22,163,74,0.12)', color: '#16a34a' }
                    : { background: 'rgba(220,38,38,0.12)', color: '#dc2626' }
                }>
                  {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>

                <span className={styles.dateCell}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>

                {/* Actions menu */}
                <div className={styles.actions}>
                  <div className={styles.menuWrap} onClick={e => e.stopPropagation()}>
                    <button
                      className={styles.menuBtn}
                      onClick={() => setOpenMenu(prev => prev === user.id ? null : user.id)}
                      title="User actions"
                    >
                      <MoreVertical size={15} />
                    </button>
                    {openMenu === user.id && (
                      <div className={styles.dropdown}>
                        <button className={styles.dropItem} onClick={() => { openEdit(user); }}>
                          <Pencil size={13} /> Edit
                        </button>
                        {user.is_active ? (
                          <button className={styles.dropItem + ' ' + styles.dropItemWarn} onClick={() => { setPendingAction({ type: 'deactivate', user }); setOpenMenu(null); }}>
                            <XCircle size={13} /> Deactivate
                          </button>
                        ) : (
                          <button className={styles.dropItem + ' ' + styles.dropItemSuccess} onClick={() => { setPendingAction({ type: 'activate', user }); setOpenMenu(null); }}>
                            <CheckCircle size={13} /> Activate
                          </button>
                        )}
                        <button className={styles.dropItem} onClick={() => { setPendingAction({ type: 'resetPassword', user }); setOpenMenu(null); }}>
                          <KeyRound size={13} /> Reset Password
                        </button>
                        <div className={styles.dropDivider} />
                        <button className={styles.dropItem + ' ' + styles.dropItemDanger} onClick={() => { setPendingAction({ type: 'delete', user }); setOpenMenu(null); }}>
                          <Trash2 size={13} /> Delete User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
