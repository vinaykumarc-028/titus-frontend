import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Download, Trash2, ExternalLink, Upload,
  FileText, RefreshCw, LayoutGrid, List
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusPill } from '../components/ui/StatusPill';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { triggerToast } from '../components/ui/ToastContainer';
import { SkeletonTableRow } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import styles from './Documents.module.css';

const STATUS_FILTERS = ['All', 'completed', 'pending_review', 'processing', 'failed'];

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/jobs/');
      // Sort newest first
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setDocs(sorted.map((d: any) => ({
        id: d.id,
        name: d.subject || 'Untitled Job',
        subject: d.subject,
        class_grade: d.class_grade,
        date: d.created_at,
        status: d.status,
        pages: d.pages?.length ?? 0,
      })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/jobs/${deleteTarget.id}`);
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id));
      triggerToast('success', 'Deleted', `"${deleteTarget.name}" removed.`);
    } catch { triggerToast('error', 'Error', 'Failed to delete document.'); }
    finally { setDeleteTarget(null); }
  };

  const handleDownload = async (doc: any) => {
    try {
      triggerToast('info', 'Download', `Preparing "${doc.name}"...`);
      const token = localStorage.getItem('titus_auth_token');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/v1/jobs/${doc.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.name || doc.id}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      triggerToast('error', 'Error', 'Failed to download document.');
    }
  };

  const handleOpen = (doc: any) => {
    localStorage.setItem('active_job_id', doc.id);
    if (doc.status === 'pending_review' || doc.status === 'completed') navigate('/review');
    else if (doc.status === 'processing') navigate('/processing');
    else triggerToast('info', 'Info', 'Document is not ready for review.');
  };

  const filtered = docs.filter(d => {
    const matchSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const LABEL: Record<string, string> = {
    All: 'All', completed: 'Completed', pending_review: 'Review', processing: 'Processing', failed: 'Failed'
  };

  return (
    <div className={styles.page}>
      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        title="Delete Document"
        description={deleteTarget ? `Permanently delete "${deleteTarget.name}"? This cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents</h1>
          <p className={styles.subtitle}>{docs.length} document{docs.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={fetchDocs} loading={loading}>Refresh</Button>
          <Button variant="primary" size="sm" icon={<Upload size={14} />} onClick={() => navigate('/upload')}>Upload</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name or subject..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className={`${styles.filterChip} ${statusFilter === f ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {LABEL[f]}
              {f !== 'All' && <span className={styles.filterCount}>
                {docs.filter(d => d.status === f).length}
              </span>}
            </button>
          ))}
        </div>

        <div className={styles.viewToggle}>
          <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')}><List size={14} /></button>
          <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={14} /></button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableHead}>
            <span>Document</span>
            <span>Subject</span>
            <span>Pages</span>
            <span>Date</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>
          <div className={styles.tableBody}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
              : filtered.length === 0
              ? (
                <div className={styles.emptyState}>
                  <FileText size={36} style={{ color: 'var(--text-muted)' }} />
                  <p>{docs.length === 0 ? 'No documents yet.' : `No results for "${searchTerm}".`}</p>
                  {docs.length === 0 && (
                    <Button variant="primary" size="sm" onClick={() => navigate('/upload')}>Upload Document</Button>
                  )}
                </div>
              )
              : filtered.map(doc => (
                <div key={doc.id} className={styles.tableRow}>
                  <div className={styles.docName}>
                    <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span className={styles.nameText} title={doc.name}>{doc.name}</span>
                  </div>
                  <span className={styles.docSubject}>{doc.subject || '—'}</span>
                  <span className={styles.docPages}>{doc.pages ?? '—'}</span>
                  <span className={styles.docDate}>
                    {doc.date ? new Date(doc.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                  <div><StatusPill status={doc.status} /></div>
                  <div className={styles.rowActions}>
                    <Button variant="ghost" size="xs" icon={<ExternalLink size={12} />} onClick={() => handleOpen(doc)}>Open</Button>
                    {(doc.status === 'completed' || doc.status === 'pending_review') && (
                      <Button variant="ghost" size="xs" icon={<Download size={12} />} onClick={() => handleDownload(doc)}>HTML</Button>
                    )}
                    <Button variant="ghost" size="xs" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(doc)} style={{ color: 'var(--danger)' }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className={styles.docCard}><div className={styles.cardSkeleton} /></div>)
            : filtered.map(doc => (
              <div key={doc.id} className={styles.docCard} onClick={() => handleOpen(doc)}>
                <div className={styles.cardIcon}><FileText size={24} /></div>
                <div className={styles.cardName} title={doc.name}>{doc.name}</div>
                {doc.subject && <div className={styles.cardSubject}>{doc.subject}</div>}
                <div className={styles.cardMeta}>
                  <StatusPill status={doc.status} />
                  {doc.pages && <span className={styles.cardPages}>{doc.pages}p</span>}
                </div>
                <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="xs" icon={<Download size={12} />} onClick={() => handleDownload(doc)} />
                  <Button variant="ghost" size="xs" icon={<Trash2 size={12} />} onClick={() => setDeleteTarget(doc)} style={{ color: 'var(--danger)' }} />
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};
