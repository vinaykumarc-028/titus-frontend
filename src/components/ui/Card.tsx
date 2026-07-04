import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = false,
  children,
  className,
  ...rest
}) => (
  <div
    className={clsx(
      styles.card,
      styles[variant],
      styles[`p_${padding}`],
      hover && styles.hover,
      className
    )}
    {...rest}
  >
    {children}
  </div>
);
