import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User, Loader2, Sun, Moon, HelpCircle } from 'lucide-react';
import styles from './Header.module.css';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { HelpCenterDrawer } from '../ui/HelpCenterDrawer';

export const Header: React.FC = () => {
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  const [hasUnread, setHasUnread] = React.useState(() => {
    const saved = localStorage.getItem('titus-notifications');
    if (saved) {
      try {
        const notifs = JSON.parse(saved);
        return notifs.some((n: any) => !n.read);
      } catch (e) {}
    }
    return true;
  });

  React.useEffect(() => {
    const updateBadge = () => {
      const saved = localStorage.getItem('titus-notifications');
      if (saved) {
        try {
          const notifs = JSON.parse(saved);
          setHasUnread(notifs.some((n: any) => !n.read));
          return;
        } catch (e) {}
      }
      setHasUnread(true);
    };
    window.addEventListener('notifications-change', updateBadge);
    return () => window.removeEventListener('notifications-change', updateBadge);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const nextTheme = nextDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new Event('theme-change'));
  };

  React.useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem('theme') === 'dark');
    };
    window.addEventListener('theme-change', handleThemeChange);
    // Initial sync
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    setIsDark(currentTheme === 'dark');
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatBreadcrumb = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/upload')) return 'Document Converter';
    if (path.startsWith('/processing')) return 'Document Converter';
    if (path.startsWith('/generating-document')) return 'Document Composer';
    if (path.startsWith('/review')) return 'Review';
    if (path.startsWith('/success')) return 'Download';
    if (path.startsWith('/documents')) return 'Documents';
    if (path.startsWith('/settings')) return 'Settings';
    
    // Fallback using formatBreadcrumb
    const lastPath = pathnames[pathnames.length - 1];
    return lastPath ? formatBreadcrumb(lastPath) : 'Dashboard';
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h1 className={styles.pageTitle}>
          {getPageTitle()}
        </h1>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.processingIndicator} title="2 Documents Processing">
          <Loader2 size={16} className={styles.spinner} />
          <span>2 Processing</span>
        </div>

        <div className={styles.divider} />

        <button 
          className={styles.actionButton} 
          onClick={toggleTheme} 
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Light Theme" : "Dark Theme"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            className={styles.actionButton} 
            aria-label="Notifications"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell size={20} />
            {hasUnread && <span className={styles.notificationBadge} />}
          </button>
          <NotificationDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            className={styles.actionButton} 
            aria-label="Help"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle size={20} />
          </button>
          <HelpCenterDrawer isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>

        <div style={{ position: 'relative' }}>
          <div 
            className={styles.userProfile} 
            onClick={() => setIsProfileOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.avatar}>
              <User size={16} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>User</span>
              <span className={styles.userRole}>Operator</span>
            </div>
          </div>
          <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
      </div>
    </header>
  );
};
