import React, { useState } from 'react';
import { Plus, Edit, UserX, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import styles from './Users.module.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

const mockUsers: User[] = [
  { id: '1', name: 'Alice Admin', email: 'alice@titus.com', role: 'Administrator', status: 'Active', lastLogin: 'Today, 09:41 AM' },
  { id: '2', name: 'Bob Operator', email: 'bob@titus.com', role: 'Operator', status: 'Active', lastLogin: 'Today, 08:30 AM' },
  { id: '3', name: 'Charlie Viewer', email: 'charlie@titus.com', role: 'Viewer', status: 'Inactive', lastLogin: '3 days ago' },
];

export const Users: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  return (
    <div className="animate-fade-in">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>User Management</h1>
          <p className={styles.pageSubtitle}>Manage system users, roles, and access permissions.</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>Invite User</Button>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'roles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            Roles & Permissions
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className={styles.tableContainer}>
          <div className={styles.tableToolbar}>
            <div className={styles.searchBox}>
              <Input placeholder="Search users by name or email..." />
            </div>
            <select className={styles.selectInput} defaultValue="all">
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="operator">Operator</option>
            </select>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Last Login</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map(user => (
                  <tr key={user.id} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 500 }}>{user.name}</td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{user.email}</td>
                    <td className={styles.td}>{user.role}</td>
                    <td className={styles.td}>
                      <Badge variant={user.status === 'Active' ? 'green' : 'gray'}>{user.status}</Badge>
                    </td>
                    <td className={`${styles.td} ${styles.tdMuted}`}>{user.lastLogin}</td>
                    <td className={styles.td}>
                      <div className={styles.rowActions}>
                        <button className={styles.actionIconBtn} title="Edit User">
                          <Edit size={16} />
                        </button>
                        <button className={styles.actionIconBtn} title="Reset Password">
                          <KeyRound size={16} />
                        </button>
                        <button className={`${styles.actionIconBtn} ${styles.dangerBtn}`} title="Deactivate">
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className={styles.placeholderState}>
          <p>Roles & Permissions management coming soon.</p>
        </div>
      )}
    </div>
  );
};
