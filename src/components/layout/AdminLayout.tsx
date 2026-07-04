import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Bell, Sun, Moon, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import styles from './AdminLayout.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':  'Dashboard',
  '/admin/users':      'Users',
  '/admin/documents':  'Documents',
  '/admin/categories': 'Categories',
  '/admin/reports':    'Reports',
  '/admin/logs':       'Audit Logs',
  '/admin/settings':   'Settings',
};

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.full_name || '')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  return (
    <div className={styles.shell}>
      <AdminSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(p => !p)} />

      <div className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.adminBadge}>
              <Shield size={12} />
              <span>Admin</span>
            </div>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.tbBtn} onClick={toggleTheme} title="Toggle theme">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button className={styles.tbBtn} onClick={() => setIsNotifOpen(p => !p)} title="Notifications">
                <Bell size={16} />
              </button>
              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            </div>

            <div className={styles.divider} />

            {/* User chip */}
            <div className={styles.userChip}>
              <div className={styles.userAvatar}>{initials}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name || 'Administrator'}</span>
                <span className={styles.userRole}>System Admin</span>
              </div>
            </div>

            <button className={`${styles.tbBtn} ${styles.logoutBtn}`} onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
