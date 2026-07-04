import React from 'react';
import styles from './Skeleton.module.css';
import clsx from 'clsx';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  className?: string;
  lines?: number;
  /** @deprecated unused, kept for backward compat */
  variant?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height = 14,
  radius,
  className,
  lines,
}) => {
  if (lines && lines > 1) {
    return (
      <div className={styles.lineGroup}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(styles.bar, className)}
            style={{
              width: i === lines - 1 ? '60%' : '100%',
              height,
              borderRadius: radius ?? 4,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(styles.bar, className)}
      style={{
        width: width ?? '100%',
        height,
        borderRadius: radius ?? 4,
      }}
    />
  );
};

export const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className={styles.card}>
    <Skeleton height={16} width="50%" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height={14} width={i % 2 === 0 ? '100%' : '75%'} />
    ))}
  </div>
);

export const SkeletonTableRow: React.FC = () => (
  <div className={styles.tableRow}>
    <Skeleton height={14} width={160} />
    <Skeleton height={14} width={80} />
    <Skeleton height={14} width={100} />
    <Skeleton height={22} width={80} radius={99} />
    <Skeleton height={14} width={60} />
  </div>
);
