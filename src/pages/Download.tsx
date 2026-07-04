import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Download as DownloadIcon, RefreshCw, ListTodo } from 'lucide-react';
import { Button } from '../components/ui/Button';
import clsx from 'clsx';
import styles from './Download.module.css';

export const Download: React.FC = () => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    // Simulate download delay
    setTimeout(() => {
      setIsDownloading(false);
      // In a real app, this would trigger a file download
    }, 1500);
  };

  return (
    <div className={clsx("animate-fade-in", styles.downloadContainer)}>
      <div className={styles.successCard}>
        <div className={styles.iconWrapper}>
          <FileCheck size={48} strokeWidth={1.5} />
        </div>
        <h1 className={styles.title}>Your HTML document is ready.</h1>
        <p className={styles.subtitle}>
          We have successfully composed your reviewed model into a standalone HTML file.
        </p>

        <div className={styles.actions}>
          <Button 
            variant="primary" 
            size="lg" 
            icon={isDownloading ? <RefreshCw className="animate-spin" size={20} /> : <DownloadIcon size={20} />}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download HTML File'}
          </Button>
          
          <Button 
            variant="secondary" 
            size="lg" 
            icon={<RefreshCw size={20} />}
            onClick={() => navigate('/upload')}
          >
            Convert Another Document
          </Button>

          <Button 
            variant="secondary" 
            size="lg" 
            icon={<ListTodo size={20} />}
            onClick={() => navigate('/jobs')}
          >
            Go to Documents
          </Button>
        </div>
      </div>
    </div>
  );
};
