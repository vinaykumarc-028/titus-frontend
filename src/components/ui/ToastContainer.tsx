import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import styles from './ToastContainer.module.css';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description: string;
}

export const triggerToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, description: string) => {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { type, title, description } }));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: any; title: string; description: string }>;
      if (!customEvent.detail) return;
      const { type, title, description } = customEvent.detail;
      const id = Math.random().toString(36).substring(7);
      
      setToasts(prev => [...prev, { id, type, title, description }]);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />;
      case 'error': return <AlertCircle size={18} style={{ color: 'var(--danger)' }} />;
      case 'warning': return <AlertCircle size={18} style={{ color: 'var(--warning)' }} />;
      default: return <Info size={18} style={{ color: 'var(--info)' }} />;
    }
  };

  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <div className={styles.icon}>{getIcon(toast.type)}</div>
          <div className={styles.content}>
            <div className={styles.toastTitle}>{toast.title}</div>
            <div className={styles.description}>{toast.description}</div>
          </div>
          <button className={styles.closeBtn} onClick={() => removeToast(toast.id)} aria-label="Dismiss Notification">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
