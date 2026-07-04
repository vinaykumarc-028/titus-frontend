import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className,
  disabled,
  ...rest
}) => {
  return (
    <button
      className={clsx(
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden />
      ) : icon ? (
        <span className={styles.iconLeft}>{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && <span className={styles.iconRight}>{iconRight}</span>}
    </button>
  );
};
