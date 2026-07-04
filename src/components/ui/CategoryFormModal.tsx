import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import styles from './FormModal.module.css';

export interface CategoryFormValues {
  name: string;
  desc: string;
  icon: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
  initialData?: Partial<CategoryFormValues>;
  title?: string;
}

/**
 * CategoryFormModal
 *
 * Replaces window.prompt() flow for creating/editing categories in AdminCategories.
 *
 * BACKEND INTEGRATION: Connect onSubmit to POST /api/admin/categories (create) or
 * PUT /api/admin/categories/:id (update)
 */
export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Create Category',
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('📘');
  const [error, setError] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setDesc(initialData?.desc || '');
      setIcon(initialData?.icon || '📘');
      setError(null);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = Array.from(
          modalRef.current?.querySelectorAll<HTMLElement>(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) || []
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !desc.trim() || !icon.trim()) {
      setError('All fields are required.');
      return;
    }
    onSubmit({ name, desc, icon });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        id="category-form-dialog"
        className={styles.dialog}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
      >
        <header className={styles.header}>
          <h2 id="category-form-title" className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <div className={styles.inputGroup}>
            <label htmlFor="cat-name">Category Name</label>
            <input
              id="cat-name"
              ref={firstInputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Question Paper"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="A brief explanation of the category's purpose."
              required
              rows={3}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="cat-icon">Icon (Emoji)</label>
            <input
              id="cat-icon"
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="e.g., 📘"
              maxLength={2}
              required
              style={{ maxWidth: '100px', textAlign: 'center' }}
            />
          </div>

          <footer className={styles.footer}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {initialData ? 'Save Changes' : 'Create Category'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
