import React, { useEffect, useState } from 'react';
import {
  Users, FileText, CheckCircle2, Clock,
  AlertCircle, UserPlus, ArrowRight, TrendingUp,
  Activity, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import styles from './AdminDashboard.module.css';

interface Stats {
  totalUsers: number;
  totalJobs: number;
  completed: number;
  pendingReview: number;
  processing: number;
  failed: number;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [jobs, users] = await Promise.all([
          api.get<any[]>('/jobs/'),
          api.get<any[]>('/users/').catch(() => []),
        ]);

        const sorted = [...(jobs || [])].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        setStats({
          totalUsers:   (users || []).length,
          totalJobs:    (jobs || []).length,
          completed:    (jobs || []).filter((j: any) => j.status === 'completed').length,
          pendingReview:(jobs || []).filter((j: any) => j.status === 'pending_review').length,
          processing:   (jobs || []).filter((j: any) => j.status === 'processing').length,
          failed:       (jobs || []).filter((j: any) => j.status === 'failed').length,
        });
        setRecentJobs(sorted.slice(0, 6));
      } catch (e) {
        console.error('Admin dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const METRIC_CARDS = [
    { label: 'Total Users',     value: stats?.totalUsers,    icon: <Users size={18} />,        color: '#7c3aed', bg: 'rgba(124,58,237,0.1)'  },
    { label: 'Total Jobs',      value: stats?.totalJobs,     icon: <FileText size={18} />,     color: '#2563eb', bg: 'rgba(37,99,235,0.1)'   },
    { label: 'Completed',       value: stats?.completed,     icon: <CheckCircle2 size={18} />, color: '#16a34a', bg: 'rgba(22,163,74,0.1)'   },
    { label: 'Pending Review',  value: stats?.pendingReview, icon: <Clock size={18} />,        color: '#d97706', bg: 'rgba(217,119,6,0.1)'   },
    { label: 'Processing',      value: stats?.processing,    icon: <TrendingUp size={18} />,   color: '#0891b2', bg: 'rgba(8,145,178,0.1)'   },
    { label: 'Failed',          value: stats?.failed,        icon: <AlertCircle size={18} />,  color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
  ];

  const STATUS_COLOR: Record<string, string> = {
    completed:     '#16a34a',
    pending_review:'#d97706',
    processing:    '#0891b2',
    failed:        '#dc2626',
    pending:       '#6b7280',
  };

  const STATUS_LABEL: Record<string, string> = {
    completed:     'Completed',
    pending_review:'Review',
    processing:    'Processing',
    failed:        'Failed',
    pending:       'Pending',
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Overview</h2>
          <p className={styles.subtitle}>Platform summary and recent activity</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<Users size={14} />} onClick={() => navigate('/admin/users')}>
            Manage Users
          </Button>
          <Button variant="primary" size="sm" icon={<UserPlus size={14} />} onClick={() => navigate('/admin/users')}>
            Add User
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className={styles.metricsGrid}>
        {METRIC_CARDS.map(card => (
          <div key={card.label} className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>{card.label}</span>
              <div className={styles.metricIcon} style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div className={styles.metricValue}>
              {loading ? <div className={styles.skeleton} style={{ width: 48, height: 32 }} /> : (card.value ?? 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className={styles.grid}>
        {/* Recent Jobs */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Activity size={15} />
              Recent Jobs
            </div>
            <button className={styles.viewAllBtn} onClick={() => navigate('/admin/documents')}>
              View all <ArrowRight size={13} />
            </button>
          </div>

          <div className={styles.jobTable}>
            <div className={styles.jobTableHead}>
              <span>Document</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.jobRow}>
                  <div className={styles.skeleton} style={{ width: '55%', height: 14 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 20 }} />
                  <div className={styles.skeleton} style={{ width: 60, height: 14 }} />
                </div>
              ))
            ) : recentJobs.length === 0 ? (
              <div className={styles.empty}>
                <FileText size={28} />
                <p>No jobs yet</p>
              </div>
            ) : recentJobs.map(job => (
              <div key={job.id} className={styles.jobRow}>
                <div className={styles.jobName}>
                  <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span>{job.subject || 'Untitled Job'}</span>
                </div>
                <span
                  className={styles.statusPill}
                  style={{
                    background: `${STATUS_COLOR[job.status] || '#6b7280'}15`,
                    color: STATUS_COLOR[job.status] || '#6b7280',
                  }}
                >
                  {STATUS_LABEL[job.status] || job.status}
                </span>
                <span className={styles.jobDate}>
                  {job.created_at
                    ? new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Shield size={15} />
              Quick Actions
            </div>
          </div>

          <div className={styles.quickGrid}>
            {[
              { label: 'Manage Users',    icon: <Users size={20} />,      to: '/admin/users',      color: '#7c3aed' },
              { label: 'All Documents',   icon: <FileText size={20} />,   to: '/admin/documents',  color: '#2563eb' },
              { label: 'Audit Logs',      icon: <Activity size={20} />,   to: '/admin/logs',       color: '#0891b2' },
              { label: 'System Settings', icon: <AlertCircle size={20} />,to: '/admin/settings',   color: '#d97706' },
            ].map(a => (
              <button
                key={a.label}
                className={styles.quickCard}
                onClick={() => navigate(a.to)}
              >
                <div className={styles.quickIcon} style={{ background: `${a.color}12`, color: a.color }}>
                  {a.icon}
                </div>
                <span className={styles.quickLabel}>{a.label}</span>
                <ArrowRight size={14} className={styles.quickArrow} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
