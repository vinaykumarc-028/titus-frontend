import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Loader2, CheckCircle2, Clock, Upload,
  ArrowRight, RefreshCw, AlertTriangle, Activity
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusPill } from '../components/ui/StatusPill';
import { Button } from '../components/ui/Button';
import { SkeletonTableRow } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsData, logsData] = await Promise.all([
        api.get<any[]>('/jobs/'),
        api.get<any[]>('/audit-logs').catch(() => []),
      ]);
      setJobs(jobsData || []);
      setActivities(
        (logsData || []).slice(0, 8).map((l: any) => ({
          time: new Date(l.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: l.action,
          name: l.job_name,
          details: l.details,
        }))
      );
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => { fetchData(); }, []);

  const metrics = {
    total:      jobs.length,
    processing: jobs.filter(j => j.status === 'processing').length,
    review:     jobs.filter(j => j.status === 'pending_review').length,
    completed:  jobs.filter(j => j.status === 'completed').length,
  };

  // Sort newest first using created_at from the backend
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 8);

  const handleOpenJob = (job: any) => {
    localStorage.setItem('active_job_id', job.id);
    if (job.status === 'pending_review') navigate('/review');
    else if (job.status === 'processing') navigate('/processing');
    else if (job.status === 'completed') navigate('/documents');
    else navigate('/documents');
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Document processing workspace · Last updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchData} loading={loading}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={<Upload size={14} />} onClick={() => navigate('/upload')}>
            New Upload
          </Button>
        </div>
      </div>

      {/* Metric Row */}
      <div className={styles.metricsGrid}>
        <MetricCard label="Total Jobs" value={metrics.total} icon={<FileText size={18} />} iconColor="var(--primary)" loading={loading} />
        <MetricCard label="Processing" value={metrics.processing} icon={<Loader2 size={18} />} iconColor="var(--info)" loading={loading} />
        <MetricCard label="Awaiting Review" value={metrics.review} icon={<Clock size={18} />} iconColor="var(--warning)" loading={loading} />
        <MetricCard label="Completed" value={metrics.completed} icon={<CheckCircle2 size={18} />} iconColor="var(--success)" loading={loading} />
      </div>

      {/* Main grid: jobs table + activity feed */}
      <div className={styles.mainGrid}>
        {/* Jobs Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>Recent Jobs</div>
            <Button variant="ghost" size="xs" iconRight={<ArrowRight size={12} />} onClick={() => navigate('/documents')}>
              View all
            </Button>
          </div>

          {/* Table Head */}
          <div className={styles.tableHead}>
            <span className={styles.colName}>Document</span>
            <span className={styles.colStatus}>Status</span>
            <span className={styles.colDate}>Date</span>
            <span className={styles.colAction}></span>
          </div>

          <div className={styles.tableBody}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
              : recentJobs.length === 0
              ? (
                <div className={styles.emptyRow}>
                  <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <p>No documents yet. Upload your first document to get started.</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/upload')}>
                    Upload Document
                  </Button>
                </div>
              )
              : recentJobs.map(job => (
                <div key={job.id} className={styles.tableRow} onClick={() => handleOpenJob(job)}>
                  <div className={styles.colName}>
                    <span className={styles.docIcon}><FileText size={14} /></span>
                    <span className={styles.docName} title={job.subject || job.id}>
                      {job.subject || 'Untitled Job'}
                    </span>
                    {job.class_grade && <span className={styles.docMeta}>{job.class_grade}</span>}
                  </div>
                  <div className={styles.colStatus}>
                    <StatusPill status={job.status} />
                  </div>
                  <div className={styles.colDate}>
                    {job.created_at
                      ? new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : '—'}
                  </div>
                  <div className={styles.colAction}>
                    <ArrowRight size={14} className={styles.rowArrow} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Activity Feed */}
        <div className={styles.activityCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>
              <Activity size={14} style={{ display: 'inline', marginRight: 6 }} />
              Activity
            </div>
          </div>

          <div className={styles.activityList}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ background: 'var(--border)' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 12, width: '80%', borderRadius: 4, marginBottom: 4 }} />
                    <div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 4 }} />
                  </div>
                </div>
              ))
              : activities.length === 0
              ? <p className={styles.emptyActivity}>No recent activity.</p>
              : activities.map((a, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <span className={styles.activityAction}>{a.action}</span>
                    <span className={styles.activityName}>{a.name}</span>
                    {a.details && <span className={styles.activityDetails}>· {a.details}</span>}
                  </div>
                  <span className={styles.activityTime}>{a.time}</span>
                </div>
              ))
            }
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>Quick Actions</div>
            </div>
            <div className={styles.quickGrid}>
              <button className={styles.quickBtn} onClick={() => navigate('/upload')}>
                <Upload size={16} />
                <span>Upload</span>
              </button>
              <button className={styles.quickBtn} onClick={() => navigate('/documents')}>
                <FileText size={16} />
                <span>Documents</span>
              </button>
              {metrics.review > 0 && (
                <button className={`${styles.quickBtn} ${styles.quickBtnAlert}`} onClick={() => {
                  const job = jobs.find(j => j.status === 'pending_review');
                  if (job) { localStorage.setItem('active_job_id', job.id); navigate('/review'); }
                }}>
                  <AlertTriangle size={16} />
                  <span>{metrics.review} Review{metrics.review > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
