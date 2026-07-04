import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, FileText, Shield } from 'lucide-react';
import styles from './PortalSelection.module.css';

export const PortalSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Box size={40} color="#FFFFFF" />
        </div>
        <h1 className={styles.brandTitle}>TITUS Document Intelligence</h1>
        <h2 className={styles.welcome}>Welcome Back</h2>
        <p className={styles.subtitle}>Choose a portal to continue</p>
      </div>

      <div className={styles.cardsContainer}>
        {/* Document Portal Card */}
        <div 
          className={styles.portalCard} 
          onClick={() => navigate('/login/document')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.iconWrapper} style={{ backgroundColor: 'var(--bg-info)', color: 'var(--primary)' }}>
            <FileText size={32} />
          </div>
          <h3 className={styles.cardTitle}>Document Portal</h3>
          <p className={styles.cardDescription}>
            Access the document conversion platform to upload, review, convert and manage your documents.
          </p>
          <div className={styles.buttonPlaceholder}>
            Continue
          </div>
        </div>

        {/* Administration Portal Card */}
        <div 
          className={styles.portalCard} 
          onClick={() => navigate('/login/admin')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.iconWrapper} style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
            <Shield size={32} />
          </div>
          <h3 className={styles.cardTitle}>Administration Portal</h3>
          <p className={styles.cardDescription}>
            Access administration tools, application management and system configuration.
          </p>
          <div className={styles.buttonPlaceholder}>
            Continue
          </div>
        </div>
      </div>
    </div>
  );
};
