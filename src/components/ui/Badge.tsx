import React from 'react';
import clsx from 'clsx';
import styles from './Badge.module.css';

export type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gray',
  dot = false,
  children,
  className,
  style
}) => (
  <span className={clsx(styles.badge, styles[variant], className)} style={style}>
    {dot && <span className={clsx(styles.dot, styles[`dot_${variant}`])} />}
    {children}
  </span>
);
