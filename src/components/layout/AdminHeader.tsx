import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Shield, Sun, Moon, HelpCircle } from 'lucide-react';
import styles from './Header.module.css';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { HelpCenterDrawer } from '../ui/HelpCenterDrawer';

export const AdminHeader: React.FC = () => {
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  const [hasUnread, setHasUnread] = useState(() => {
    const saved = localStorage.getItem('titus-notifications');
    if (saved) {
      try {
        const notifs = JSON.parse(saved);
        return notifs.some((n: any) => !n.read);
      } catch (e) {}
    }
    return true;
  });

  useEffect(() => {
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

  useEffect(() => {
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
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getPageTitle = () => {
    const lastPath = pathnames[pathnames.length - 1];
    if (!lastPath || lastPath === 'dashboard') return 'Dashboard';
    if (lastPath === 'users') return 'Users';
    if (lastPath === 'documents') return 'Documents';
    if (lastPath === 'categories') return 'Document Categories';
    if (lastPath === 'reports') return 'Reports';
    if (lastPath === 'logs') return 'Audit Logs';
    if (lastPath === 'settings') return 'Settings';
    return formatBreadcrumb(lastPath);
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>

      <div className={styles.rightSection}>
        <button 
          className={styles.actionButton} 
          onClick={toggleTheme} 
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Light Theme" : "Dark Theme"}
          style={{ marginRight: '8px' }}
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
            <div className={styles.avatar} style={{ backgroundColor: 'var(--bg-purple)', color: 'var(--accent-purple)', width: '32px', height: '32px' }}>
              <Shield size={16} />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Administrator</span>
              <span className={styles.userRole}>System Admin</span>
            </div>
          </div>
          <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} isAdmin={true} />
        </div>
      </div>
    </header>
  );
};
