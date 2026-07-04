import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = <PackageOpen size={48} />, 
  title, 
  description, 
  actionText, 
  onAction 
}) => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
