import React from 'react';
import { Filter, Download, Trash2, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import styles from './Jobs.module.css';

interface Job {
  id: string;
  subject: string;
  classGrade: string;
  uploadedAt: string;
  status: 'Uploaded' | 'Processing' | 'Review Pending' | 'Completed' | 'Failed';
  operator: string;
}

const mockJobs: Job[] = [
  { id: 'JOB-8291', subject: 'Mathematics', classGrade: 'Grade 10', uploadedAt: 'Today, 10:24 AM', status: 'Processing', operator: 'System' },
  { id: 'JOB-8290', subject: 'Physics', classGrade: 'Grade 12', uploadedAt: 'Today, 10:15 AM', status: 'Processing', operator: 'System' },
  { id: 'JOB-8289', subject: 'Biology', classGrade: 'Grade 11', uploadedAt: 'Today, 09:45 AM', status: 'Completed', operator: 'Operator 1' },
  { id: 'JOB-8288', subject: 'Chemistry', classGrade: 'Grade 12', uploadedAt: 'Today, 09:30 AM', status: 'Failed', operator: 'System' },
  { id: 'JOB-8287', subject: 'English', classGrade: 'Grade 9', uploadedAt: 'Yesterday, 04:00 PM', status: 'Review Pending', operator: 'Operator 2' },
  { id: 'JOB-8286', subject: 'History', classGrade: 'Grade 10', uploadedAt: 'Yesterday, 02:15 PM', status: 'Uploaded', operator: 'Operator 1' },
];

const getStatusBadge = (status: Job['status']) => {
  const variantMap: Record<Job['status'], BadgeVariant> = {
    'Uploaded': 'gray',
    'Processing': 'blue',
    'Review Pending': 'amber',
    'Completed': 'green',
    'Failed': 'red'
  };
  return <Badge variant={variantMap[status]}>{status}</Badge>;
};

export const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === mockJobs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mockJobs.map(job => job.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Documents</h1>
          <p className={styles.pageSubtitle}>View and manage all your uploaded documents.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="primary" onClick={() => navigate('/upload')}>Upload Documents</Button>
        </div>
      </div>

      <div className={styles.filterToolbar}>
        <div className={styles.searchBox}>
          <Input placeholder="Search Documents..." />
        </div>
        <div className={styles.filtersGroup}>
          <Button variant="secondary" icon={<Filter size={16} />}>Filter</Button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {mockJobs.length === 0 ? (
          <EmptyState 
            icon={<Layers size={48} />}
            title="No documents yet"
            description="Upload your first handwritten document to get started."
            actionText="Upload Document"
            onAction={() => navigate('/upload')}
          />
        ) : (
          <>
            <div className={styles.tableToolbar}>
              <div className={styles.bulkActions}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={selectedIds.length === mockJobs.length && mockJobs.length > 0}
                  onChange={toggleSelectAll}
                />
                <span className={styles.bulkText}>{selectedIds.length} Selected</span>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className={styles.checkbox} 
                        checked={selectedIds.length === mockJobs.length && mockJobs.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className={styles.th}>Document Name</th>
                    <th className={styles.th}>Upload Date</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockJobs.map(job => (
                    <tr 
                      key={job.id} 
                      className={`${styles.tr} ${selectedIds.includes(job.id) ? styles.trSelected : ''}`}
                    >
                      <td className={styles.td}>
                        <input 
                          type="checkbox" 
                          className={styles.checkbox} 
                          checked={selectedIds.includes(job.id)}
                          onChange={() => toggleSelect(job.id)}
                        />
                      </td>
                      <td className={styles.td} style={{ fontWeight: 600 }}>{job.subject} Document.pdf</td>
                      <td className={`${styles.td} ${styles.tdMuted}`}>{job.uploadedAt}</td>
                      <td className={styles.td}>{getStatusBadge(job.status)}</td>
                      <td className={styles.td}>
                        <div className={styles.rowActions}>
                          <Button variant="ghost" size="sm" onClick={() => navigate(job.status === 'Review Pending' ? '/review' : '/jobs')}>
                            {job.status === 'Review Pending' ? 'Review' : 'Open'}
                          </Button>
                          <button className={styles.actionIconBtn} title="Download">
                            <Download size={16} />
                          </button>
                          <button className={`${styles.actionIconBtn} ${styles.deleteBtn}`} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <div className={styles.pageInfo}>Showing 1 to 6 of 1,284 entries</div>
              <div className={styles.pageControls}>
                <Button variant="secondary" size="sm" disabled>Previous</Button>
                <div className={styles.pageNumbers}>
                  <button className={`${styles.pageNum} ${styles.pageNumActive}`}>1</button>
                  <button className={styles.pageNum}>2</button>
                  <button className={styles.pageNum}>3</button>
                  <span>...</span>
                  <button className={styles.pageNum}>214</button>
                </div>
                <Button variant="secondary" size="sm">Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
