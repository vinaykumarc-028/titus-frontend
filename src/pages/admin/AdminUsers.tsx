import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, User, Trash2, RefreshCw } from 'lucide-react';
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

export const AdminUsers: React.FC = () => {
  const [users, setUsers]           = useState<UserItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);

  // New user form state
  const [showForm, setShowForm]     = useState(false);
  const [formEmail, setFormEmail]   = useState('');
  const [formName, setFormName]     = useState('');
  const [formPass, setFormPass]     = useState('');
  const [formRole, setFormRole]     = useState('Operator');
  const [formLoading, setFormLoading] = useState(false);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('/auth/register', {
        full_name: formName,
        email: formEmail,
        password: formPass,
        role: formRole,
      });
      triggerToast('success', 'User Created', `${formName} added successfully.`);
      setShowForm(false);
      setFormEmail(''); setFormName(''); setFormPass(''); setFormRole('Operator');
      fetchUsers();
    } catch (err: any) {
      triggerToast('error', 'Error', err.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      triggerToast('success', 'Deleted', `${deleteTarget.full_name} removed.`);
    } catch {
      triggerToast('error', 'Error', 'Failed to delete user.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
    Admin:    { bg: 'rgba(124,58,237,0.1)',  color: '#7c3aed' },
    Operator: { bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
  };

  return (
    <div className={styles.page}>
      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        title="Delete User"
        description={deleteTarget ? `Permanently delete "${deleteTarget.full_name}"? This cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Users</h2>
          <p className={styles.subtitle}>{users.length} account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchUsers} loading={loading}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={<UserPlus size={14} />} onClick={() => setShowForm(p => !p)}>
            {showForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>
      </div>

      {/* Inline create form */}
      {showForm && (
        <div className={styles.createCard}>
          <h3 className={styles.createTitle}>New User</h3>
          <form onSubmit={handleCreateUser} className={styles.createForm}>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Full Name</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className={styles.formField}>
                <label>Email</label>
                <input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="jane@titus.com" />
              </div>
              <div className={styles.formField}>
                <label>Password</label>
                <input type="password" required value={formPass} onChange={e => setFormPass(e.target.value)} placeholder="Min. 8 characters" />
              </div>
              <div className={styles.formField}>
                <label>Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="Operator">Operator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <Button type="submit" variant="primary" size="sm" loading={formLoading}>
              Create Account
            </Button>
          </form>
        </div>
      )}

      {/* Search */}
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
                  <div className={styles.skeleton} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div>
                    <div className={styles.skeleton} style={{ width: 120, height: 13, marginBottom: 4 }} />
                    <div className={styles.skeleton} style={{ width: 160, height: 11 }} />
                  </div>
                </div>
                <div className={styles.skeleton} style={{ width: 70, height: 22, borderRadius: 20 }} />
                <div className={styles.skeleton} style={{ width: 60, height: 22, borderRadius: 20 }} />
                <div className={styles.skeleton} style={{ width: 80, height: 13 }} />
                <div />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <User size={32} />
              <p>{users.length === 0 ? 'No users yet.' : `No results for "${searchTerm}".`}</p>
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
                    ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a' }
                    : { background: 'rgba(220,38,38,0.1)', color: '#dc2626' }
                }>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>

                <span className={styles.dateCell}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>

                <div className={styles.actions}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setDeleteTarget(user)}
                    title="Delete user"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
