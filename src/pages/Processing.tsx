import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  CheckCircle2, AlertCircle, ChevronRight, X,
  FileText, Cpu, Code2, RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from './Processing.module.css';

interface Stage {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'waiting' | 'active' | 'done' | 'error';
  detail?: string;
}

export const Processing: React.FC = () => {
  const navigate = useNavigate();
  const [jobStatus, setJobStatus] = useState<'processing' | 'failed' | 'completed'>('processing');
  const [totalPages, setTotalPages] = useState(0);
  const [pagesProcessed, setPagesProcessed] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [logs, setLogs] = useState<string[]>(['Initializing job...']);
  const logsRef = useRef<HTMLDivElement>(null);

  const stages: Stage[] = [
    {
      id: 'init',
      label: 'Initializing',
      icon: <FileText size={14} />,
      status: pagesProcessed >= 0 && jobStatus !== 'failed' ? 'done' : 'error',
      detail: 'Job created and queued',
    },
    {
      id: 'extract',
      label: 'Extracting Pages',
      icon: <FileText size={14} />,
      status: totalPages > 0 ? 'done' : jobStatus === 'processing' ? 'active' : 'waiting',
      detail: totalPages > 0 ? `${totalPages} pages found` : 'Reading document structure...',
    },
    {
      id: 'ocr',
      label: 'OCR Processing',
      icon: <Cpu size={14} />,
      status: jobStatus === 'completed' ? 'done'
        : jobStatus === 'failed' ? 'error'
        : pagesProcessed > 0 ? 'active'
        : totalPages > 0 ? 'active' : 'waiting',
      detail: totalPages > 0
        ? `Page ${pagesProcessed} / ${totalPages}`
        : 'Waiting for page extraction...',
    },
    {
      id: 'html',
      label: 'Generating HTML',
      icon: <Code2 size={14} />,
      status: jobStatus === 'completed' ? 'done'
        : jobStatus === 'failed' ? 'error'
        : 'waiting',
      detail: jobStatus === 'completed' ? 'Document ready' : 'Pending OCR completion...',
    },
  ];

  const progress = jobStatus === 'completed'
    ? 100
    : totalPages > 0
    ? Math.max(5, Math.floor((pagesProcessed / totalPages) * 80))
    : 10;

  const eta = totalPages > 0 && pagesProcessed < totalPages
    ? `~${Math.max(1, (totalPages - pagesProcessed) * 8)}s remaining`
    : jobStatus === 'completed' ? 'Done' : 'Calculating...';

  useEffect(() => {
    const jobId = localStorage.getItem('active_job_id');
    if (!jobId) { setJobStatus('failed'); setErrorMsg('No active job found.'); return; }

    const poll = async () => {
      try {
        const data = await api.get<any>(`/jobs/${jobId}`);

        setTotalPages(data.pages_count ?? 0);
        setPagesProcessed(data.pages_processed ?? 0);

        if (data.status === 'completed' || data.status === 'pending_review') {
          setJobStatus('completed');
          setLogs(prev => [...prev.slice(-9), `✓ Processing complete — ${data.pages_count} pages`]);
        } else if (data.status === 'failed') {
          setJobStatus('failed');
          const msg = data.failures?.[0] || 'An unexpected error occurred.';
          setErrorMsg(msg);
          setLogs(prev => [...prev.slice(-9), `✗ Failed: ${msg}`]);
        } else {
          const logLine = data.pages_count > 0
            ? `OCR page ${data.pages_processed}/${data.pages_count}...`
            : 'Extracting document pages...';
          setLogs(prev => {
            const last = prev[prev.length - 1];
            return last === logLine ? prev : [...prev.slice(-9), logLine];
          });
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>OCR Processing</h1>
        <p className={styles.subtitle}>
          {jobStatus === 'processing' && 'Running Mistral OCR on your document...'}
          {jobStatus === 'completed' && 'Processing complete — ready for review.'}
          {jobStatus === 'failed' && 'Processing encountered an error.'}
        </p>
      </div>

      <div className={styles.workspace}>
        {/* Left — Stage Timeline */}
        <div className={styles.stagesCard}>
          <div className={styles.cardHeader}>Pipeline Stages</div>
          <div className={styles.stageList}>
            {stages.map((stage, i) => (
              <div key={stage.id} className={`${styles.stage} ${styles[stage.status]}`}>
                <div className={styles.stageConnector}>
                  <div className={styles.stageIcon}>
                    {stage.status === 'done'  && <CheckCircle2 size={14} />}
                    {stage.status === 'error' && <AlertCircle size={14} />}
                    {stage.status === 'active' && <span className={styles.spinDot} />}
                    {stage.status === 'waiting' && <span className={styles.emptyDot} />}
                  </div>
                  {i < stages.length - 1 && <div className={styles.stageLine} />}
                </div>
                <div className={styles.stageBody}>
                  <div className={styles.stageLabel}>{stage.label}</div>
                  {stage.detail && <div className={styles.stageDetail}>{stage.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center — Progress */}
        <div className={styles.progressCard}>
          <div className={styles.cardHeader}>
            <span>Overall Progress</span>
            <span className={styles.etaLabel}>{eta}</span>
          </div>

          <div className={styles.progressSection}>
            <div className={styles.progressStats}>
              <span className={styles.progressPct}>{progress}%</span>
              {totalPages > 0 && (
                <span className={styles.pagesStat}>
                  {pagesProcessed}/{totalPages} pages
                </span>
              )}
            </div>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${
                  jobStatus === 'completed' ? styles.fillDone : ''
                } ${jobStatus === 'failed' ? styles.fillError : ''}`}
                style={{ width: `${jobStatus === 'failed' ? progress : progress}%` }}
              />
            </div>
          </div>

          {/* Page-level mini bars */}
          {totalPages > 0 && (
            <div className={styles.pageGrid}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className={`${styles.pageBar} ${
                    i < pagesProcessed ? styles.pageBarDone :
                    i === pagesProcessed && jobStatus === 'processing' ? styles.pageBarActive : ''
                  }`}
                  title={`Page ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {jobStatus === 'failed' && (
              <>
                <Button variant="danger" size="md" icon={<X size={14} />} onClick={() => navigate('/')}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" icon={<RotateCcw size={14} />} onClick={() => navigate('/upload')}>
                  Try Again
                </Button>
              </>
            )}
            {jobStatus === 'completed' && (
              <Button
                variant="primary"
                size="md"
                iconRight={<ChevronRight size={14} />}
                onClick={() => navigate('/review')}
              >
                Open Review
              </Button>
            )}
          </div>

          {/* Error detail */}
          {jobStatus === 'failed' && errorMsg && (
            <div className={styles.errorBox}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right — Log console */}
        <div className={styles.logsCard}>
          <div className={styles.cardHeader}>Live Log</div>
          <div className={styles.logsBody} ref={logsRef}>
            {logs.map((line, i) => (
              <div key={i} className={styles.logLine}>
                <span className={styles.logIdx}>{String(i + 1).padStart(2, '0')}</span>
                <span>{line}</span>
              </div>
            ))}
            {jobStatus === 'processing' && (
              <div className={styles.logLine}>
                <span className={styles.logIdx}>··</span>
                <span className={styles.logCursor}>▌</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
