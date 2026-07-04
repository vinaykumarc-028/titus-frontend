import React from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import styles from './Stepper.module.css';

export type StepIndicator = 'upload' | 'processing' | 'review' | 'create' | 'download';

interface StepperProps {
  currentStep: StepIndicator;
  compact?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, compact = false }) => {
  const steps: { id: StepIndicator; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'processing', label: 'Reading' },
    { id: 'review', label: 'Review' },
    { id: 'create', label: 'Compose HTML' },
    { id: 'download', label: 'Download' },
  ];

  return (
    <div className={clsx(styles.stepperContainer, compact && styles.compact)}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

        return (
          <React.Fragment key={step.id}>
            <div className={clsx(styles.stepItem, isActive && styles.active, isCompleted && styles.completed)}>
              <div className={styles.stepCircle}>
                {isCompleted ? <Check size={16} strokeWidth={3} /> : index + 1}
              </div>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div className={clsx(styles.stepLine, isCompleted && styles.lineCompleted)} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
