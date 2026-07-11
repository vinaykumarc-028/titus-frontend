import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Download, 
  Sparkles, 
  FileText, 
  ChevronLeft, 
  Loader2, 
  Home,
  Check
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { triggerToast } from '../components/ui/ToastContainer';
import styles from './Success.module.css';
import { api } from '../lib/api';

export const Success: React.FC = () => {
  const navigate = useNavigate();
  const [aiState, setAiState] = useState<'idle' | 'generating' | 'completed'>('idle');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [exportFormat, setExportFormat] = useState<'html' | 'docx' | 'pdf' | 'json' | 'css'>('html');
  const [useV2, setUseV2] = useState<boolean>(false);
  const [job, setJob] = useState<any>(null);
  const jobId = localStorage.getItem('active_job_id');

  useEffect(() => {
    if (!jobId) return;
    api.get<any>(`/jobs/${jobId}`)
      .then(data => {
        if (data) {
          setJob(data);
          if (data.answers_result) {
            setAiState('completed');
          }
        }
      })
      .catch(() => undefined);
  }, [jobId]);

  const handleGenerateAI = async () => {
    setAiState('generating');
    triggerToast('info', 'AI Generation', 'Generating AI Answer Key using Gemini...');
    try {
      // Use the POST response directly — it returns the answers payload
      const answersData = await api.post<any>(`/jobs/${jobId}/generate-answers`);
      // Merge answers into the job state immediately (no race condition)
      setJob((prev: any) => ({ ...prev, answers_result: answersData }));
      setAiState('completed');
      triggerToast('success', 'AI Completed', `Generated ${answersData?.answers?.length || 0} answers successfully.`);
    } catch (err: any) {
      setAiState('idle');
      triggerToast('error', 'Generation Error', err.message || 'Failed to generate answers.');
    }
  };

  const handleDownload = async (includeAI = false) => {
    if (!jobId) {
      triggerToast('error', 'Download Error', 'No active document is selected.');
      return;
    }
    setDownloadStatus('loading');
    triggerToast('info', 'Download Started', `Preparing ${exportFormat.toUpperCase()} document...`);

    try {
      const token = localStorage.getItem('titus_auth_token');
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}/download?include_answers=${includeAI}&format=${exportFormat}&renderer=${useV2 ? 'v2' : 'v1'}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const suffix = includeAI ? '_with_answers' : '';
      const ext = exportFormat === 'docx' ? 'docx' : exportFormat === 'pdf' ? 'pdf' : 'html';
      a.href = url;
      a.download = `${documentName.replace(/\s+/g, '_')}${suffix}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadStatus('success');
      triggerToast('success', 'Downloaded', `${exportFormat.toUpperCase()} document${includeAI ? ' with answer key' : ''} saved.`);
    } catch (err: any) {
      setDownloadStatus('idle');
      triggerToast('error', 'Download Error', err.message || 'Failed to download.');
    }
  };

  const handleDownloadWithAI = (includeAI: boolean) => {
    handleDownload(includeAI);
  };

  const documentName = job?.name || job?.metadata?.title || 'Reviewed examination document';
  const pageCount = job?.pages_count || job?.pages?.length || 0;


  return (
    <div className={styles.container}>
      
      {/* 1. Success Header */}
      <div className={styles.header}>
        <CheckCircle2 size={64} className={styles.successIcon} />
        <h1 className={styles.title}>Conversion Complete!</h1>
        <p className={styles.description}>
          Your reviewed examination model has been composed into a standalone HTML document.
        </p>
      </div>

      {/* 2. Document Summary Card */}
      <Card className={styles.card}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryTitle}>
            <FileText size={18} color="var(--primary)" />
            <span>{documentName}</span>
          </div>
          <Badge variant="green">✓ Successfully Converted</Badge>
        </div>
        
        <div className={styles.twoColumnGrid}>
          <div className={styles.gridItem}>
            <span className={styles.gridKey}>Document Type</span>
            <span className={styles.gridVal}>Question Paper</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridKey}>Pages</span>
            <span className={styles.gridVal}>{pageCount || '—'} Pages</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridKey}>Output Format</span>
            <span className={styles.gridVal}>HTML</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridKey}>Completed</span>
            <span className={styles.gridVal}>Just Now</span>
          </div>
        </div>
      </Card>

      {/* 3. Download Card */}
      <Card className={`${styles.card} ${styles.centeredCard}`}>
        <div style={{ backgroundColor: 'var(--bg-info)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-12)' }}>
          <FileText size={24} />
        </div>
        <h2 className={styles.downloadCardTitle}>Ready to Download</h2>
        <p className={styles.downloadCardDesc}>
          Your structured question paper has been generated successfully. You can download it now or generate an AI Answer Key.
        </p>

        {/* Format Selection Dropdown */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 'var(--space-16)', width: '240px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Format:</span>
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value as any)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 'var(--radius-input)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="html">HTML Document</option>
            <option value="docx">Word Document (.docx)</option>
            <option value="pdf">PDF Document (.pdf)</option>
            <option value="json">Structured JSON Data</option>
            <option value="css">Styles Sheet (.css)</option>
          </select>
        </div>

        {/* Renderer V2 Toggle */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 'var(--space-16)', width: '240px' }}>
          <input 
            type="checkbox" 
            id="use-v2-checkbox"
            checked={useV2} 
            onChange={(e) => setUseV2(e.target.checked)}
            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
          />
          <label htmlFor="use-v2-checkbox" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}>
            Use Renderer V2 (Beta)
          </label>
        </div>
        
        {downloadStatus === 'idle' && (
          <Button 
            variant="primary" 
            size="lg" 
            icon={<Download size={18} />} 
            onClick={() => handleDownload(false)}
            style={{ width: '240px', height: '48px' }}
          >
            {exportFormat === 'docx' ? 'Download Word Document' : 
             exportFormat === 'pdf' ? 'Download PDF Document' : 
             exportFormat === 'json' ? 'Download JSON Data' : 
             exportFormat === 'css' ? 'Download CSS Styles' : 
             'Download HTML Document'}
          </Button>
        )}
        {downloadStatus === 'loading' && (
          <Button 
            variant="primary" 
            size="lg" 
            disabled
            icon={<Loader2 size={18} className="animate-spin" />}
            style={{ width: '240px', height: '48px' }}
          >
            Downloading...
          </Button>
        )}
        {downloadStatus === 'success' && (
          <Button 
            variant="success" 
            size="lg" 
            icon={<Check size={18} />}
            onClick={() => setDownloadStatus('idle')}
            style={{ width: '240px', height: '48px' }}
          >
            Downloaded!
          </Button>
        )}
      </Card>

      {/* 4. AI Answer Generation Card */}
      {aiState === 'idle' && (
        <Card className={`${styles.card} ${styles.centeredCard}`} style={{ borderStyle: 'dashed' }}>
          <Sparkles size={36} color="var(--warning)" style={{ marginBottom: 'var(--space-12)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Generate AI Answer Key</h3>
          <p className={styles.downloadCardDesc} style={{ fontSize: '14px', marginBottom: 'var(--space-20)' }}>
            Generate answers for the extracted questions using AI. This will create an additional Answer Key section.
          </p>
          <Button 
            variant="secondary" 
            size="md" 
            icon={<Sparkles size={16} color="var(--warning)" />} 
            onClick={handleGenerateAI}
          >
            Generate AI Answer Key
          </Button>
        </Card>
      )}

      {aiState === 'generating' && (
        <Card className={`${styles.card} ${styles.centeredCard}`}>
          <Loader2 size={36} color="var(--primary)" className="animate-spin" style={{ marginBottom: 'var(--space-16)' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Generating Answer Key...</h3>
          <p className={styles.downloadCardDesc} style={{ fontSize: '14px', marginBottom: 0 }}>
            Our AI is reading extracted questions and composing answers. This will only take a moment.
          </p>
        </Card>
      )}

      {aiState === 'completed' && (
        <Card className={styles.card}>
          <div className={styles.aiHeader}>
            <CheckCircle2 size={22} color="var(--success)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>AI Answer Key Generated</h3>
          </div>
          
          <div style={{ padding: 'var(--space-16) var(--space-24)', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', marginBottom: 'var(--space-24)', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Preview Answers ({job?.answers_result?.answers?.length || 0} answers generated):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '320px', overflowY: 'auto' }}>
              {job?.answers_result?.answers && job.answers_result.answers.length > 0 ? (
                job.answers_result.answers.map((ans: any, idx: number) => (
                  <div key={idx} style={{ 
                    padding: '10px 0', 
                    lineHeight: '1.6',
                    borderBottom: idx < job.answers_result.answers.length - 1 ? '1px solid var(--border)' : 'none',
                    color: 'var(--text-primary)'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)', marginRight: '8px', flexShrink: 0 }}>#{idx + 1}</span>
                    {ans.text}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No answers found in generated key.</div>
              )}
            </div>
          </div>

          <div className={styles.aiButtonsGrid}>
            <Button variant="secondary" icon={<Download size={16} />} onClick={() => handleDownloadWithAI(false)}>
              Download Question Paper
            </Button>
            <Button variant="primary" icon={<Download size={16} />} onClick={() => handleDownloadWithAI(true)}>
              Download Paper + Answer Key
            </Button>
          </div>
        </Card>
      )}

      {/* 5. Next Actions */}
      <div className={styles.nextActionsSection}>
        <h4 className={styles.nextActionsTitle}>What would you like to do next?</h4>
        <div className={styles.nextActionsButtons}>
          <Button variant="ghost" onClick={() => navigate('/upload')}>
            <ChevronLeft size={16} style={{ marginRight: '4px' }} />
            Upload Another Document
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            <Home size={16} style={{ marginRight: '6px' }} />
            Go to Dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate('/documents')}>
            <FileText size={16} style={{ marginRight: '6px' }} />
            View Documents
          </Button>
        </div>
      </div>

    </div>
  );
};
