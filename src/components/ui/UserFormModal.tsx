import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import styles from './FormModal.module.css';

export interface UserFormValues {
  name: string;
  email: string;
  role: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
}

const ROLE_OPTIONS = ['Administrator', 'Operator', 'Reviewer', 'Viewer'];

/**
 * UserFormModal
 *
 * Replaces the previous window.prompt() flow for creating users in AdminUsers.
 * Provides accessible modal with Name, Email, and Role fields.
 *
 * BACKEND INTEGRATION: Connect onSubmit to POST /api/admin/users/invite
 */
export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Operator');
  const [error, setError] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setRole('Operator');
      setError(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ESC to close + focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab') {
        const dialog = document.getElementById('user-form-dialog');
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled'));

        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('Full name is required.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('A valid email address is required.'); return; }

    onSubmit({ name: name.trim(), email: email.trim(), role });
    onClose();
  };

  return (
    <div className={styles.overlay} aria-modal="true" role="dialog" aria-labelledby="user-form-title">
      <div className={styles.dialog} id="user-form-dialog">
        <div className={styles.header}>
          <h2 id="user-form-title" className={styles.title}>Invite New User</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.errorMessage} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="user-name" className={styles.label}>Full Name <span aria-hidden="true">*</span></label>
            <input
              ref={firstInputRef}
              id="user-name"
              type="text"
              className={styles.input}
              placeholder="e.g. Alice Admin"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="user-email" className={styles.label}>Email Address <span aria-hidden="true">*</span></label>
            <input
              id="user-email"
              type="email"
              className={styles.input}
              placeholder="user@titus.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="user-role" className={styles.label}>Role</label>
            <select
              id="user-role"
              className={styles.select}
              value={role}
              onChange={e => setRole(e.target.value)}
              aria-label="Select user role"
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Create Account</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
