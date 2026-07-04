import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileDropdown.module.css';

export const ProfileDropdown: React.FC<{ isOpen: boolean; onClose: () => void; isAdmin?: boolean }> = ({ isOpen, onClose, isAdmin = false }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    navigate('/login');
  };

  const handleSettings = () => {
    navigate(isAdmin ? '/admin/settings' : '/settings');
    onClose();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            <User size={20} />
          </div>
          <div className={styles.userInfo}>
            <div className={styles.name}>{isAdmin ? 'Administrator' : 'User'}</div>
            <div className={styles.email}>{isAdmin ? 'admin@titus.com' : 'user@titus.com'}</div>
          </div>
        </div>
        <div className={styles.body}>
          <button className={styles.menuItem} onClick={() => {
            navigate(isAdmin ? '/admin/profile' : '/profile');
            onClose();
          }}>
            <User size={16} />
            <span>My Profile</span>
          </button>
          <button className={styles.menuItem} onClick={handleSettings}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <div className={styles.divider} />
          <button className={`${styles.menuItem} ${styles.logout}`} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
