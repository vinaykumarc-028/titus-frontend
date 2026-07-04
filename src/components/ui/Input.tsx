import React, { forwardRef, useId } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelRight?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, labelRight, rightElement, error, helperText, id, ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <div className={clsx(styles.container, error && styles.error, className)}>
        {(label || labelRight) && (
          <div className={styles.labelRow}>
            {label && (
              <label htmlFor={inputId} className={styles.label}>
                {label}
              </label>
            )}
            {labelRight && <div className={styles.labelRight}>{labelRight}</div>}
          </div>
        )}
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            id={inputId}
            className={clsx(styles.input, rightElement && styles.hasRightElement)}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
        </div>
        {error && (
          <span id={`${inputId}-error`} className={clsx(styles.helperText, styles.errorText)}>
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
