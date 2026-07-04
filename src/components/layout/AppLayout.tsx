import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import {
  Bell, Sun, Moon, HelpCircle, LogOut
} from 'lucide-react';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { HelpCenterDrawer } from '../ui/HelpCenterDrawer';
import { useAuth } from '../../context/AuthContext';
import styles from './AppLayout.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/':               'Dashboard',
  '/upload':         'Upload Document',
  '/processing':     'Processing',
  '/review':         'Manual Review',
  '/documents':      'Documents',
  '/settings':       'Settings',
  '/profile':        'Profile',
  '/success':        'Complete',
  '/generating-document':'Generating Document',
};

// Pages that should use full-width layout (no padding/maxWidth)
const FULL_WIDTH_PAGES = ['/review'];

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [hasUnread, setHasUnread] = useState(() => {
    try {
      const notifs = JSON.parse(localStorage.getItem('titus-notifications') || '[]');
      return notifs.some((n: any) => !n.read);
    } catch { return true; }
  });

  const location = useLocation();

  const path = location.pathname;
  const pageTitle = PAGE_TITLES[path] || path.split('/').filter(Boolean).map(s =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
  ).join(' › ') || 'Dashboard';

  const isFull = FULL_WIDTH_PAGES.some(p => path.startsWith(p));

  React.useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    setIsDark(theme === 'dark');

    const onTheme = () => setIsDark(localStorage.getItem('theme') === 'dark');
    const onNotifs = () => {
      try {
        const notifs = JSON.parse(localStorage.getItem('titus-notifications') || '[]');
        setHasUnread(notifs.some((n: any) => !n.read));
      } catch { setHasUnread(false); }
    };
    window.addEventListener('theme-change', onTheme);
    window.addEventListener('notifications-change', onNotifs);
    return () => {
      window.removeEventListener('theme-change', onTheme);
      window.removeEventListener('notifications-change', onNotifs);
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('theme-change'));
  };

  return (
    <div className={styles.shell}>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(p => !p)} />

      <div className={`${styles.mainColumn}${collapsed ? ` ${styles.sidebarCollapsed}` : ''}`}>
        {/* Top Bar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.pageTitle}>{pageTitle}</span>
          </div>

          <div className={styles.topbarRight}>
            <button
              className={styles.topbarBtn}
              onClick={toggleTheme}
              title={isDark ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button
                className={styles.topbarBtn}
                onClick={() => setIsNotificationsOpen(true)}
                aria-label="Notifications"
              >
                <Bell size={16} />
                {hasUnread && <span className={styles.notifDot} />}
              </button>
              <NotificationDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
            </div>

            <div style={{ position: 'relative' }}>
              <button
                className={styles.topbarBtn}
                onClick={() => setIsHelpOpen(true)}
                aria-label="Help"
              >
                <HelpCircle size={16} />
              </button>
              <HelpCenterDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            </div>

            <div className={styles.topbarDivider} />

            <div style={{ position: 'relative' }}>
              <div
                className={styles.userChip}
                onClick={() => setIsProfileOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.userChipAvatar}>
                {(user?.full_name || '')
                  .split(' ')
                  .filter(Boolean)
                  .map(w => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'OP'}
              </div>
              <span className={styles.userChipName}>{user?.full_name || 'Operator'}</span>
            </div>
            <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
          </div>

          <button
            className={styles.topbarBtn}
            title="Sign out"
            aria-label="Sign out"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={16} />
          </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.contentArea}>
          <div className={isFull ? styles.pageContentFull : styles.pageContent}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
