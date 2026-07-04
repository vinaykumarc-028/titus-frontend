import React, { useEffect, useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import styles from './ConfirmationDialog.module.css';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary'
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button for safety & quick execution
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onCancel} />
      <div className={styles.dialogContainer} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className={styles.header}>
          <div className={`${styles.iconWrapper} ${styles[variant]}`}>
            {variant === 'danger' || variant === 'warning' ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
          </div>
          <h3 id="dialog-title" className={styles.title}>{title}</h3>
        </div>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </>
  );
};
