import React from 'react';
import styles from './MetricCard.module.css';
import { Skeleton } from './Skeleton';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, icon, iconColor = 'var(--primary)', trend, loading
}) => {
  if (loading) {
    return (
      <div className={styles.card}>
        <Skeleton width={32} height={32} radius={8} className={styles.iconSkeleton} />
        <Skeleton width="60%" height={28} className={styles.valueSkeleton} />
        <Skeleton width="40%" height={14} />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap} style={{ background: `${iconColor}18`, color: iconColor }}>
        {icon}
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      {trend && (
        <div className={styles.trend} style={{ color: trend.value >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
        </div>
      )}
    </div>
  );
};
