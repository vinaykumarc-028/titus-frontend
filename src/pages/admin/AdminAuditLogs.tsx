import React from 'react';
import { 
  Search, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { triggerToast } from '../../components/ui/ToastContainer';
import styles from './AdminAuditLogs.module.css';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/audit-logs/');
      const mapped = (data || []).map((l: any, idx: number) => {
        const dateStr = l.timestamp ? new Date(l.timestamp * 1000).toLocaleString() : 'N/A';
        let status = "Success";
        const actionLower = (l.action || "").toLowerCase();
        if (actionLower.includes("fail") || actionLower.includes("error")) {
          status = "Failed";
        } else if (actionLower.includes("warn")) {
          status = "Warning";
        }
        return {
          id: idx,
          date: dateStr,
          user: l.operator_id || "Operator",
          action: l.action,
          document: l.job_name || "System",
          status: status
        };
      });
      setLogs(mapped);
    } catch (err: any) {
      console.error(err);
      triggerToast('error', 'Logs Error', err.message || 'Failed to retrieve system logs.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, []);

  const renderStatusBadge = (status: string) => {
    let icon = <CheckCircle2 size={12} style={{ marginRight: '6px' }} />;
    let variant: 'green' | 'amber' | 'red' | 'blue' | 'gray' = 'green';
    
    if (status === 'Warning') {
      icon = <AlertTriangle size={12} style={{ marginRight: '6px' }} />;
      variant = 'amber';
    } else if (status === 'Failed') {
      icon = <XCircle size={12} style={{ marginRight: '6px' }} />;
      variant = 'red';
    } else if (status === 'Info') {
      icon = <Info size={12} style={{ marginRight: '6px' }} />;
      variant = 'blue';
    }

    return (
      <Badge variant={variant} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {icon}
        {status}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        Loading logs...
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Audit Logs</h1>
          <p className={styles.subtitle}>Track system events, user actions, and document processing history.</p>
        </div>
        <Button variant="secondary" onClick={fetchLogs}>
          Refresh Logs
        </Button>
      </div>

      <Card className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="Search logs by user, action or document..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Document</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log: any) => (
                <tr key={log.id}>
                  <td>
                    <div className={styles.timeWrapper}>
                      <Clock size={14} className={styles.textMuted} />
                      <span className={styles.textMuted}>{log.date}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.userName}>{log.user}</span>
                  </td>
                  <td>{log.action}</td>
                  <td className={styles.textMuted}>{log.document}</td>
                  <td>
                    {renderStatusBadge(log.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
