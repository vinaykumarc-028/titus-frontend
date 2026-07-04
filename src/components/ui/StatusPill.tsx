import React from 'react';
import styles from './StatusPill.module.css';
import clsx from 'clsx';

type JobStatus = 'processing' | 'pending_review' | 'completed' | 'failed' | 'uploading';

const STATUS_MAP: Record<JobStatus, { label: string; cls: string; animated: boolean }> = {
  processing:    { label: 'Processing',    cls: 'processing',    animated: true },
  pending_review:{ label: 'Review Pending',cls: 'review',        animated: true },
  completed:     { label: 'Completed',     cls: 'completed',     animated: false },
  failed:        { label: 'Failed',        cls: 'failed',        animated: false },
  uploading:     { label: 'Uploading',     cls: 'uploading',     animated: true },
};

interface StatusPillProps {
  status: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className }) => {
  const cfg = STATUS_MAP[status as JobStatus] ?? { label: status, cls: 'gray', animated: false };
  return (
    <span className={clsx(styles.pill, styles[cfg.cls], className)}>
      <span className={clsx(styles.dot, cfg.animated && styles.animated)} />
      {cfg.label}
    </span>
  );
};
