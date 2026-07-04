import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  FileText,
  Tags,
  BarChart3,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV = [
  { label: 'Dashboard',   icon: <LayoutDashboard size={18} />, to: '/admin/dashboard' },
  { label: 'Users',       icon: <Users size={18} />,           to: '/admin/users' },
  { label: 'Documents',   icon: <FileText size={18} />,        to: '/admin/documents' },
  { label: 'Categories',  icon: <Tags size={18} />,            to: '/admin/categories' },
  { label: 'Reports',     icon: <BarChart3 size={18} />,       to: '/admin/reports' },
  { label: 'Audit Logs',  icon: <ScrollText size={18} />,      to: '/admin/logs' },
  { label: 'Settings',    icon: <Settings size={18} />,        to: '/admin/settings' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Shield size={18} />
        </div>
        {!collapsed && <span className={styles.brandName}>TITUS Admin</span>}
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        {/* User chip */}
        <div className={clsx(styles.userChip, collapsed && styles.userChipCollapsed)}>
          <div className={styles.userAvatar}>{initials}</div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.full_name || 'Administrator'}</span>
              <span className={styles.userRole}>System Admin</span>
            </div>
          )}
        </div>

        <div className={styles.footerBtns}>
          <button
            className={styles.footerBtn}
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>

          <button
            className={clsx(styles.footerBtn, styles.logoutBtn)}
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
