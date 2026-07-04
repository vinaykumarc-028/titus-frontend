import React, { useState, useEffect } from 'react';
import { Calendar, Download, Search, Clock, Loader2, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../lib/api';
import { triggerToast } from '../components/ui/ToastContainer';
import styles from './AuditLog.module.css';

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ipAddress: string;
}

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/audit-logs/');
      const mapped = (data || []).map((l: any, idx: number) => {
        const dateStr = l.timestamp ? new Date(l.timestamp * 1000).toLocaleString() : 'N/A';
        return {
          id: String(idx),
          timestamp: dateStr,
          user: l.operator_id || "Operator",
          action: l.action || "Event",
          resource: l.job_name || "System",
          ipAddress: "Local Session"
        };
      });
      setLogs(mapped);
    } catch (err: any) {
      console.error(err);
      triggerToast('error', 'History Error', err.message || 'Failed to retrieve activity history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExport = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + ["Timestamp,User,Action,Resource,IP Address"].concat(
            logs.map(e => `"${e.timestamp}","${e.user}","${e.action}","${e.resource}","${e.ipAddress}"`)
          ).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `titus_activity_log_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast('success', 'Export Successful', 'Activity logs exported to CSV.');
    } catch (err) {
      triggerToast('error', 'Export Failed', 'Unable to format logs for CSV export.');
    }
  };

  const filteredLogs = logs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Activity History</h1>
          <p className={styles.pageSubtitle}>Track all user actions and system events for compliance and security.</p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport} disabled={loading || logs.length === 0}>Export Log</Button>
      </div>

      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Input 
            placeholder="Search logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-48)', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Loading history logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState 
            icon={<History size={48} />}
            title="No Activity Found"
            description="No activity history matches your search criteria."
          />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Timestamp</th>
                    <th className={styles.th}>User</th>
                    <th className={styles.th}>Action</th>
                    <th className={styles.th}>Resource / Document</th>
                    <th className={styles.th}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className={styles.tr}>
                      <td className={styles.td} style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} className={styles.textMuted} />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className={styles.td} style={{ fontWeight: 500 }}>{log.user}</td>
                      <td className={styles.td}>
                        <span className={styles.actionBadge}>{log.action}</span>
                      </td>
                      <td className={styles.td} style={{ fontFamily: 'monospace' }}>{log.resource}</td>
                      <td className={styles.td} style={{ color: 'var(--text-muted)' }}>{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <div className={styles.pageInfo}>Showing {filteredLogs.length} entries</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
