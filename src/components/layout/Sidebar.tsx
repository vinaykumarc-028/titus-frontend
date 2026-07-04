import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Upload, FolderOpen,
  ScanText, ChevronRight, LogOut,
  Sun, Moon, FileCheck, Layers, ShieldCheck,
  FileBarChart, Users, PanelLeft
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  icon: React.FC<{ size?: number }>;
  to: string;
  shortcut?: string;
  disabled?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard',        icon: LayoutDashboard, to: '/',          shortcut: '⌘D' },
      { label: 'Upload Document',  icon: Upload,          to: '/upload',    shortcut: '⌘U' },
      { label: 'Processing',       icon: ScanText,        to: '/processing' },
      { label: 'Manual Review',    icon: FileCheck,       to: '/review' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { label: 'All Documents',    icon: FolderOpen,      to: '/documents', shortcut: '⌘L' },
    ],
  },
  {
    label: 'Future Modules',
    items: [
      { label: 'Batch Processing', icon: Layers,          to: '/batch',     disabled: true },
      { label: 'Validation Lab',   icon: ShieldCheck,     to: '/dev/ocr-validation' },
      { label: 'Analytics',        icon: FileBarChart,    to: '/analytics', disabled: true },
      { label: 'Users',            icon: Users,           to: '/admin/users', disabled: true },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = React.useState(() =>
    localStorage.getItem('theme') === 'dark'
  );

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('theme-change'));
  };

  // Sync theme from storage on mount
  React.useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    setIsDark(theme === 'dark');
    const handler = () => setIsDark(localStorage.getItem('theme') === 'dark');
    window.addEventListener('theme-change', handler);
    return () => window.removeEventListener('theme-change', handler);
  }, []);

  const initials = 'OP'; // Operator

  return (
    <aside className={clsx(styles.sidebar, collapsed && styles.collapsed)}>
      {/* Logo */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <ScanText size={16} />
        </div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoName}>TITUS</span>
            <span className={styles.logoBadge}>Document AI</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.navArea}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={styles.navSection}>
            {!collapsed && (
              <div className={styles.navSectionLabel}>{group.label}</div>
            )}
            {group.items.map((item) => (
              item.disabled ? (
                <div
                  key={item.to}
                  className={clsx(styles.navItem, styles.navItemDisabled)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles.navIcon}><item.icon size={16} /></span>
                  {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    clsx(styles.navItem, isActive && styles.active)
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className={styles.navIcon}><item.icon size={16} /></span>
                  {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                  {!collapsed && item.shortcut && (
                    <span className={styles.navShortcut}>{item.shortcut}</span>
                  )}
                </NavLink>
              )
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userRow} onClick={() => navigate('/profile')}>
          <div className={styles.userAvatar}>{initials}</div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userInfoName}>Operator</div>
              <div className={styles.userInfoRole}>Document Portal</div>
            </div>
          )}
        </div>

        <div className={styles.footerActions}>
          <button
            className={styles.footerBtn}
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {!collapsed && <span>{isDark ? 'Light' : 'Dark'}</span>}
          </button>

          <button
            className={styles.footerBtn}
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <PanelLeft size={14} />}
            {!collapsed && <span>Collapse</span>}
          </button>

          <button
            className={clsx(styles.footerBtn, styles.footerBtnDanger)}
            onClick={() => navigate('/login')}
            title="Logout"
          >
            <LogOut size={14} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
