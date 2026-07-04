import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { CategoryFormModal, CategoryFormValues } from '../../components/ui/CategoryFormModal';
import { triggerToast } from '../../components/ui/ToastContainer';
import styles from './AdminCategories.module.css';
import { api } from '../../lib/api';
import type { CategoryItem } from '../../types';

const DEFAULT_CATEGORIES = [
  { name: 'Question Paper', desc: 'Official exams, midterms, and weekly test papers.', icon: '📘' },
  { name: 'Answer Key', desc: 'Reference keys and solutions for graded exams.', icon: '🔑' },
  { name: 'Assignment', desc: 'Homework sheets, problem sets, and projects.', icon: '📙' },
  { name: 'Lecture Notes', desc: 'Classroom presentations and transcription notes.', icon: '📗' },
  { name: 'Study Notes', desc: 'Summaries, flashcard topics, and quick-ref guides.', icon: '📝' },
  { name: 'Lab Manual', desc: 'Instructions and templates for laboratory practicals.', icon: '🔬' },
  { name: 'Worksheet', desc: 'Practice worksheets and drill papers.', icon: '✏️' },
  { name: 'Research Paper', desc: 'Academic journal submissions and source papers.', icon: '📕' },
  { name: 'Project Report', desc: 'Term projects, group studies, and final presentations.', icon: '📁' },
  { name: 'Circular', desc: 'Administrative announcements and policy updates.', icon: '📢' },
  { name: 'Official Document', desc: 'Accreditation, transcript requests, and certificates.', icon: '🏛️' },
  { name: 'Other', desc: 'Miscellaneous and uncategorized file uploads.', icon: '📄' },
];

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const jobs = await api.get<any[]>('/jobs/');
      
      // Calculate counts from actual database jobs
      const counts: Record<string, number> = {};
      (jobs || []).forEach((job: any) => {
        const cat = job.category || 'Question Paper';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      // Build categories list with real counts
      const list: CategoryItem[] = DEFAULT_CATEGORIES.map((c, i) => ({
        id: i + 1,
        name: c.name,
        desc: c.desc,
        icon: c.icon,
        count: counts[c.name] || 0,
        status: 'Active',
        updated: 'Today'
      }));

      setCategories(list);
    } catch (e: any) {
      console.error(e);
      triggerToast('error', 'Load Error', e.message || 'Failed to calculate category metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
    triggerToast('success', 'Category Deleted', `Category "${deleteTarget.name}" removed from document indexes.`);
    setDeleteTarget(null);
  };

  const handleAddCategory = (values: CategoryFormValues) => {
    const newCat: CategoryItem = {
      id: Math.random(),
      name: values.name,
      desc: values.desc,
      icon: values.icon,
      count: 0,
      status: 'Active',
      updated: 'Just now'
    };

    setCategories(prev => [newCat, ...prev]);
    triggerToast('success', 'Category Created', `New tag index "${values.name}" created.`);
    setIsModalOpen(false);
  };

  const filteredCats = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.wrapper}>
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddCategory}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog 
        isOpen={deleteTarget !== null}
        title="Delete Document Category"
        description={deleteTarget ? `Are you sure you want to delete category "${deleteTarget.name}"? This removes category metadata from matching files.` : ''}
        confirmText="Remove Category"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className={styles.header} style={{ alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h2 className={styles.subtitle} style={{ margin: 0 }}>Create and configure category tags used across document pipelines.</h2>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-12)', alignItems: 'center' }}>
          {categories.length > 0 && (
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-card)',
                  fontSize: 'var(--text-small)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          )}
          
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-48)', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Calculating category statistics...</span>
        </div>
      ) : categories.length === 0 ? (
        <div style={{ padding: 'var(--space-48)', display: 'flex', justifyContent: 'center' }}>
          <EmptyState 
            title="No categories found" 
            description="Create document tags to help classify scan uploads."
            actionText="Add Tag"
            onAction={() => setIsModalOpen(true)}
          />
        </div>
      ) : filteredCats.length === 0 ? (
        <div style={{ padding: 'var(--space-48)', display: 'flex', justifyContent: 'center' }}>
          <EmptyState 
            title="No matches found" 
            description={`No category matches query "${searchTerm}".`}
            actionText="Reset Search"
            onAction={() => setSearchTerm('')}
          />
        </div>
      ) : (
        <div className={styles.categoriesGrid}>
          {filteredCats.map(cat => (
            <div key={cat.id} className={styles.catCard}>
              <div className={styles.catCardHeader}>
                <div className={styles.catIcon}>{cat.icon}</div>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} title="Edit" onClick={() => triggerToast('info', 'Edit Category', `Editing properties for ${cat.name}`)}><Edit2 size={14} /></button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Delete" onClick={() => setDeleteTarget(cat)}><Trash2 size={14} /></button>
                </div>
              </div>
              
              <div className={styles.catInfo}>
                <h3 className={styles.catName}>{cat.name}</h3>
                <p className={styles.catDesc}>{cat.desc}</p>
              </div>
              
              <div className={styles.catMeta}>
                <span className={styles.countText}>{cat.count} Documents</span>
                <Badge variant={cat.status === 'Active' ? 'green' : 'gray'}>
                  {cat.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
