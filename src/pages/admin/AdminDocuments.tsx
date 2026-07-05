import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { triggerToast } from '../../components/ui/ToastContainer';
import styles from './AdminDocuments.module.css';
import { api } from '../../lib/api';
import type { AdminDocItem } from '../../types';

export const AdminDocuments: React.FC = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<AdminDocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminDocItem | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/jobs/');
      const mapped = (data || []).map((job: any) => ({
        id: job.id,
        name: job.subject || 'Untitled Document',
        category: job.category || 'Question Paper',
        date: job.created_at ? new Date(job.created_at).toLocaleString('en-GB') : 'N/A',
        status: job.status === 'completed' ? 'Completed' : job.status === 'processing' ? 'Processing' : job.status === 'failed' ? 'Failed' : 'Review Needed',
        owner: job.uploaded_by_name || 'Unknown User'
      }));
      setDocs(mapped);
    } catch (e: any) {
      console.error(e);
      triggerToast('error', 'Load Error', e.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/jobs/${deleteTarget.id}`);
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      triggerToast('success', 'Document Purged', `"${deleteTarget.name}" deleted from system archives.`);
    } catch (err: any) {
      triggerToast('error', 'Delete Error', err.message || 'Failed to delete document.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleOpenDoc = (doc: AdminDocItem) => {
    localStorage.setItem('active_job_id', String(doc.id));
    navigate('/review');
  };

  const handleRetry = async (doc: AdminDocItem) => {
    try {
      triggerToast('info', 'OCR Retry', `Re-queueing OCR scan for ${doc.name}...`);
      await api.post(`/jobs/${doc.id}/process`);
      triggerToast('success', 'OCR Retry Queued', `Scan re-queued successfully.`);
      loadDocs();
    } catch (err: any) {
      triggerToast('error', 'Retry Error', err.message || 'Failed to retry processing.');
    }
  };

  const handleDownload = async (doc: AdminDocItem) => {
    try {
      triggerToast('info', 'Download Started', `Preparing HTML download for "${doc.name}"...`);
      const token = localStorage.getItem('titus_auth_token');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/v1/jobs/${doc.id}/download?include_answers=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name.replace(/\s+/g, '_')}_with_answers.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('success', 'Download Complete', `Document "${doc.name}" saved.`);
    } catch (err: any) {
      triggerToast('error', 'Download Error', err.message || 'Failed to download document.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Question Paper': return <span style={{ marginRight: '8px', fontSize: '16px' }}>📘</span>;
      case 'Assignment': return <span style={{ marginRight: '8px', fontSize: '16px' }}>📙</span>;
      case 'Lecture Notes': return <span style={{ marginRight: '8px', fontSize: '16px' }}>📗</span>;
      case 'Research Paper': return <span style={{ marginRight: '8px', fontSize: '16px' }}>📕</span>;
      case 'Lab Manual': return <span style={{ marginRight: '8px', fontSize: '16px' }}>🔬</span>;
      case 'Worksheet': return <span style={{ marginRight: '8px', fontSize: '16px' }}>📝</span>;
      default: return <span style={{ marginRight: '8px', fontSize: '16px' }}>📄</span>;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch(status) {
      case 'Completed': return 'green';
      case 'Processing': return 'blue';
      case 'Review Needed': return 'amber';
      case 'Failed': return 'red';
      default: return 'gray';
    }
  };

  const filteredDocs: AdminDocItem[] = docs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || d.category === filterCategory;
    const matchesStatus = !filterStatus || d.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className={styles.wrapper}>
      {/* Delete Confirmation */}
      <ConfirmationDialog 
        isOpen={deleteTarget !== null}
        title="Purge Document Archive"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This will delete all OCR extractions and structured models for all portal operators.` : ''}
        confirmText="Purge Document"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Document Management</h1>
          <p className={styles.subtitle}>View and manage all documents across the platform.</p>
        </div>
      </div>

      <Card className={styles.card}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-48)', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Retrieving archived documents...</span>
          </div>
        ) : (
          <>
            {docs.length > 0 && (
              <div className={styles.toolbar}>
                <div className={styles.searchContainer}>
                  <Search className={styles.searchIcon} size={18} />
                  <input 
                    type="text" 
                    placeholder="Search documents by name or owner..." 
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className={styles.filterGroup}>
                  <select 
                    className={styles.selectInput} 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Question Paper">Question Paper</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Lecture Notes">Lecture Notes</option>
                  </select>
                  <select 
                    className={styles.selectInput} 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Processing">Processing</option>
                    <option value="Failed">Failed</option>
                    <option value="Review Needed">Review Needed</option>
                  </select>
                  <Button variant="secondary" onClick={() => triggerToast('info', 'Filters opened', 'Advanced indexing filters enabled')}>
                    <Filter size={16} style={{ marginRight: '8px' }} />
                    More Filters
                  </Button>
                </div>
              </div>
            )}

            {docs.length === 0 ? (
              <div style={{ padding: 'var(--space-48)', display: 'flex', justifyContent: 'center' }}>
                <EmptyState 
                  title="Archive is empty" 
                  description="No documents exist in the platform storage cluster."
                />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div style={{ padding: 'var(--space-48)', display: 'flex', justifyContent: 'center' }}>
                <EmptyState 
                  title="No documents matched" 
                  description={`Zero results found for filter query "${searchTerm}".`}
                  actionText="Reset Search"
                  onAction={() => setSearchTerm('')}
                />
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Category</th>
                      <th>Upload Date</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th className={styles.actionsColumn}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <div className={styles.docNameWrapper}>
                            {getCategoryIcon(doc.category)}
                            <span className={styles.docName}>{doc.name}</span>
                          </div>
                        </td>
                        <td>{doc.category}</td>
                        <td className={styles.textMuted}>{doc.date}</td>
                        <td>
                          <Badge variant={getBadgeVariant(doc.status)}>
                            {doc.status}
                          </Badge>
                        </td>
                        <td>{doc.owner}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.actionBtn} title="Open" onClick={() => handleOpenDoc(doc)}><ExternalLink size={16} /></button>
                            <button className={styles.actionBtn} title="Download" onClick={() => handleDownload(doc)}><Download size={16} /></button>
                            {(doc.status === 'Failed' || doc.status === 'Review Needed') && (
                              <button className={styles.actionBtn} title="Retry OCR" onClick={() => handleRetry(doc)}><RefreshCw size={16} /></button>
                            )}
                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Delete" onClick={() => setDeleteTarget(doc)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};
