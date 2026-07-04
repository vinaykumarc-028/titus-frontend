import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  PieChart, 
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { api } from '../../lib/api';
import { triggerToast } from '../../components/ui/ToastContainer';
import styles from './AdminReports.module.css';

interface ReportMetric {
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  trendLabel: string;
  color: string;
  bgColor: string;
}

interface ChartBarItem {
  day: string;
  value: number;
  count: number;
}

interface CategoryDistribution {
  name: string;
  percentage: number;
  color: string;
}

const ICONS: { [key: string]: React.ReactNode } = {
  "Documents Uploaded": <FileText size={20} />,
  "Documents Converted": <TrendingUp size={20} />,
  "Pending Reviews": <Clock size={20} />,
  "Completed Reviews": <CheckCircle2 size={20} />,
};

const CATEGORY_COLORS = [
  'var(--primary)',
  'var(--accent-purple)',
  'var(--warning)',
  'var(--success)',
  '#0891b2',
  '#ec4899',
  'var(--text-muted)'
];

export const AdminReports: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [activity, setActivity] = useState<ChartBarItem[]>([]);
  const [categories, setCategories] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const jobs = await api.get<any[]>('/jobs/') || [];
        const total = jobs.length;
        const completed = jobs.filter((j: any) => j.status === 'completed').length;
        const pending = jobs.filter((j: any) => j.status === 'review_pending' || j.status === 'uploaded').length;

        // 1. Calculate Metrics with valid theme-based background colors
        setMetrics([
          { label: 'Documents Uploaded', value: String(total), trend: '+100%', trendDirection: 'up', trendLabel: 'cumulative total', color: 'var(--primary)', bgColor: 'var(--primary-subtle)' },
          { label: 'Documents Converted', value: String(completed), trend: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%', trendDirection: 'up', trendLabel: 'conversion rate', color: 'var(--success)', bgColor: 'var(--bg-success)' },
          { label: 'Pending Reviews', value: String(pending), trend: total > 0 ? `${Math.round((pending / total) * 100)}%` : '0%', trendDirection: 'down', trendLabel: 'of total jobs', color: 'var(--warning)', bgColor: 'var(--bg-warning)' },
          { label: 'Completed Reviews', value: String(completed), trend: '100%', trendDirection: 'up', trendLabel: 'success verification', color: 'var(--success)', bgColor: 'var(--bg-success)' },
        ]);

        // 2. Category Distribution
        const catCounts: Record<string, number> = {};
        jobs.forEach((j: any) => {
          const cat = j.category || 'Question Paper';
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
        const catDistribution: CategoryDistribution[] = sortedCats.map(([name, count], index) => ({
          name,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        }));
        
        if (catDistribution.length === 0) {
          catDistribution.push({ name: 'Question Paper', percentage: 0, color: 'var(--primary)' });
        }
        setCategories(catDistribution);

        // 3. Activity Chart (Grouped by Day of Week for past 7 days)
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityCounts: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        
        // Populate counts
        jobs.forEach((j: any) => {
          if (j.created_at) {
            const date = new Date(j.created_at);
            const dayName = daysOfWeek[date.getDay()];
            activityCounts[dayName] = (activityCounts[dayName] || 0) + 1;
          }
        });

        // Normalize bar heights (max height is 100%)
        const maxVal = Math.max(...Object.values(activityCounts), 1);
        const chartActivity: ChartBarItem[] = daysOfWeek.map(day => ({
          day,
          value: Math.round((activityCounts[day] / maxVal) * 100),
          count: activityCounts[day]
        }));
        setActivity(chartActivity);

      } catch (err: any) {
        console.error(err);
        triggerToast('error', 'Report Load Error', err.message || 'Failed to construct analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports & Analytics</h1>
          <p className={styles.subtitle}>Platform usage and document processing statistics.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-48)', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Compiling platform usage statistics...</span>
        </div>
      ) : (
        <>
          <div className={styles.metricsGrid}>
            {metrics.map((metric, idx) => (
              <Card key={idx} className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <div className={metric.label ? styles.metricIcon : ''} style={{ color: metric.color, backgroundColor: metric.bgColor, borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ICONS[metric.label]}
                  </div>
                </div>
                <div className={styles.metricValue}>{metric.value}</div>
                <div className={styles.metricTrendWrapper}>
                  <span className={metric.trendDirection === 'up' ? styles.trendUp : styles.trendDown}>
                    {metric.trend}
                  </span>
                  <span className={styles.trendLabel}>{metric.trendLabel}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className={styles.chartsGrid}>
            <Card className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}><Activity size={18} /> Daily Activity</h3>
              </div>
              <div className={styles.barChartContainer}>
                {activity.map(item => (
                  <div key={item.day} className={styles.barColumn}>
                    <div className={styles.barWrapper}>
                      <div className={styles.barValue}>{item.count > 0 ? item.count : '0'}</div>
                      <div className={styles.bar} style={{ height: `${Math.max(item.value, 4)}%` }} />
                    </div>
                    <span className={styles.barLabel}>{item.day}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}><PieChart size={18} /> Most Used Categories</h3>
              </div>
              <div className={styles.categoryList}>
                {categories.map(cat => (
                  <div key={cat.name} className={styles.categoryItem}>
                    <div className={styles.catInfo}>
                      <div className={styles.catDot} style={{ backgroundColor: cat.color }} />
                      <span className={styles.catName}>{cat.name}</span>
                    </div>
                    <div className={styles.catProgressWrapper}>
                      <div className={styles.catProgressBar} style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                    </div>
                    <span className={styles.catPercentage}>{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
