import React from 'react';
import { FileText, CheckCircle2, FileWarning, ExternalLink } from 'lucide-react';
import styles from './NotificationDropdown.module.css';

interface Notification {
  id: string;
  title: string;
  time: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Document uploaded successfully', time: '10:30 AM', type: 'success', read: false },
  { id: '2', title: 'Reading completed for Physics Final', time: '10:35 AM', type: 'info', read: false },
  { id: '3', title: 'HTML document ready: Physics Final', time: '10:38 AM', type: 'success', read: false },
  { id: '4', title: 'Low OCR confidence detected in Math Quiz', time: '04:15 PM', type: 'warning', read: true },
  { id: '5', title: 'Review completed for Biology Midterm', time: '02:00 PM', type: 'success', read: true },
  { id: '6', title: 'AI Answer Key generated for Chemistry', time: 'Oct 23', type: 'info', read: true }
];

export const NotificationDropdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    const saved = localStorage.getItem('titus-notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to initial
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  React.useEffect(() => {
    localStorage.setItem('titus-notifications', JSON.stringify(notifications));
    window.dispatchEvent(new Event('notifications-change'));
  }, [notifications]);

  if (!isOpen) return null;

  const renderIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle2 size={16} className={styles.iconSuccess} />;
      case 'warning': return <FileWarning size={16} className={styles.iconWarning} />;
      default: return <FileText size={16} className={styles.iconInfo} />;
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleItemClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const renderSection = (sectionTitle: string, filterIds: string[]) => {
    const sectionNotifs = notifications.filter(n => filterIds.includes(n.id));
    if (sectionNotifs.length === 0) return null;

    return (
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{sectionTitle}</div>
        {sectionNotifs.map(n => (
          <div 
            key={n.id} 
            className={`${styles.notificationItem} ${!n.read ? styles.unread : ''}`}
            onClick={() => handleItemClick(n.id)}
          >
            <div className={styles.iconWrapper}>{renderIcon(n.type)}</div>
            <div className={styles.contentWrapper}>
              <div className={styles.title}>{n.title}</div>
              <div className={styles.time}>{n.time}</div>
            </div>
            {!n.read && <div className={styles.unreadDot} />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Notifications</h3>
          <button className={styles.markAllRead} onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        </div>
        <div className={styles.body}>
          {renderSection('Today', ['1', '2', '3'])}
          {renderSection('Yesterday', ['4', '5'])}
          {renderSection('Older', ['6'])}
        </div>
        <div className={styles.footer}>
          <button className={styles.viewAll}>View all notifications <ExternalLink size={14} /></button>
        </div>
      </div>
    </>
  );
};
