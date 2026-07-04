import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, File, RotateCcw, RotateCw, Trash2, 
  GripVertical, AlertTriangle, Settings2, Zap, 
  ChevronDown, ChevronUp, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Stepper } from '../components/ui/Stepper';
import { useNavigate } from 'react-router-dom';
import { triggerToast } from '../components/ui/ToastContainer';
import styles from './Upload.module.css';

interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  rotation: number;
  qualityWarning?: boolean;
  thumbnailUrl?: string;
  pageCount?: number;
}

const DOCUMENT_CATEGORIES = [
  'Question Paper',
  'Answer Key',
  'Assignment',
  'Lecture Notes',
  'Study Notes',
  'Lab Manual',
  'Worksheet',
  'Research Paper',
  'Project Report',
  'Circular',
  'Timetable',
  'Official Document',
  'Other'
];

const EXAM_CATEGORIES = ['Question Paper', 'Answer Key'];

const countPdfPages = async (file: File): Promise<number> => {
  try {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const matches = content.match(/\/Count\s+(\d+)/g);
        if (matches) {
          const counts = matches.map(m => {
            const num = m.match(/\d+/);
            return num ? parseInt(num[0], 10) : 1;
          });
          resolve(Math.max(...counts, 1));
        } else {
          const pages = content.match(/\/Type\s*\/Page\b/g);
          resolve(pages ? pages.length : 1);
        }
      };
      reader.readAsText(file.slice(0, 100 * 1024));
    });
  } catch {
    return 1;
  }
};

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalsMapRef = useRef<Map<string, any>>(new Map());
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const selectedFile = files.find(f => f.id === selectedFileId) || null;

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAcademic, setShowAcademic] = useState(false);
  
  const [metadata, setMetadata] = useState({
    title: '',
    category: '',
    subject: '',
    language: 'English',
    date: '',
    description: '',
    
    course: '',
    classGrade: '',
    semester: '',
    section: '',
    faculty: '',
    academicYear: '',
    batch: '',

    examName: '',
    examType: '',
    maxMarks: '',
    timeDuration: '',
    instructions: ''
  });

  // Cleanup active intervals and window drag/drop handlers on unmount
  useEffect(() => {
    const preventGlobalDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragenter', preventGlobalDefault);
    window.addEventListener('dragover', preventGlobalDefault);
    window.addEventListener('dragleave', preventGlobalDefault);
    window.addEventListener('drop', preventGlobalDefault);

    return () => {
      window.removeEventListener('dragenter', preventGlobalDefault);
      window.removeEventListener('dragover', preventGlobalDefault);
      window.removeEventListener('dragleave', preventGlobalDefault);
      window.removeEventListener('drop', preventGlobalDefault);

      intervalsMapRef.current.forEach((interval) => clearInterval(interval));
      intervalsMapRef.current.clear();

      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openFilePicker();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'image/webp', 
      'image/tiff', 
      'image/bmp', 
      'image/gif', 
      'image/heic', 
      'image/heif'
    ];
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif', '.bmp', '.gif', '.heic', '.heif'];
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    newFiles.forEach(f => {
      const isMimeValid = validTypes.includes(f.type);
      const isExtValid = validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));
      if (isMimeValid || isExtValid) {
        validFiles.push(f);
      } else {
        invalidFiles.push(f.name);
      }
    });

    if (invalidFiles.length > 0) {
      triggerToast(
        'error', 
        'Unsupported Files', 
        `Skipped unsupported file(s): ${invalidFiles.join(', ')}. Only PDF, PNG, JPG, JPEG, WEBP, BMP, GIF, TIFF, HEIC, and HEIF are supported.`
      );
    }

    if (validFiles.length === 0) return;

    const mapped = validFiles.map((f) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(7);
      
      // Start progress simulation
      let progressVal = 0;
      const interval = setInterval(() => {
        progressVal += Math.floor(Math.random() * 20) + 15;
        if (progressVal >= 100) {
          progressVal = 100;
          clearInterval(interval);
          intervalsMapRef.current.delete(id);
        }
        setFiles(prev => prev.map(item => item.id === id ? { ...item, progress: progressVal } : item));
      }, 100);
      intervalsMapRef.current.set(id, interval);

      // Browser uploads usually do not expose reliable physical DPI. Only flag
      // truly tiny images here; messy handwriting is handled by the OCR path.
      if (f.type.startsWith("image/")) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(f);
        img.src = objectUrl;
        img.onload = () => {
          const megapixels = (img.naturalWidth * img.naturalHeight) / 1_000_000;
          const shortestEdge = Math.min(img.naturalWidth, img.naturalHeight);
          if (megapixels < 0.4 || shortestEdge < 500) {
            setFiles(prev => prev.map(item => item.id === id ? { ...item, qualityWarning: true } : item));
          }
          URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
        };
      }

      // Generate local thumbnail URL if file is not PDF
      let thumbnailUrl: string | undefined = undefined;
      if (!f.name.toLowerCase().endsWith('.pdf')) {
        thumbnailUrl = URL.createObjectURL(f);
        objectUrlsRef.current.add(thumbnailUrl);
      }

      // Asynchronously fetch PDF page count
      if (f.name.toLowerCase().endsWith('.pdf')) {
        countPdfPages(f).then(count => {
          setFiles(prev => prev.map(item => item.id === id ? { ...item, pageCount: count } : item));
        });
      }

      // Auto-select first file added for preview
      if (files.length === 0) {
        // Will be set after state update via effect
      }

      return {
        id,
        file: f,
        name: f.name,
        size: f.size,
        progress: 0,
        rotation: 0,
        qualityWarning: false,
        thumbnailUrl,
        pageCount: f.name.toLowerCase().endsWith('.pdf') ? 1 : undefined
      };
    });
    setFiles((prev) => {
      const next = [...prev, ...mapped];
      // Auto-select the first newly added file for preview
      if (mapped.length > 0) setSelectedFileId(mapped[0].id);
      return next;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    const fileItem = files.find(f => f.id === id);
    if (fileItem?.thumbnailUrl) {
      URL.revokeObjectURL(fileItem.thumbnailUrl);
      objectUrlsRef.current.delete(fileItem.thumbnailUrl);
    }
    const interval = intervalsMapRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalsMapRef.current.delete(id);
    }
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      // If we removed the selected file, select the first remaining one
      if (id === selectedFileId) {
        setSelectedFileId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const rotateFile = (id: string, degrees: number) => {
    setFiles((prev) => prev.map(f => {
      if (f.id === id) {
        return { ...f, rotation: (f.rotation + degrees) % 360 };
      }
      return f;
    }));
  };

  const hasQualityWarning = files.some(f => f.qualityWarning);

  const isValid = () => {
    if (files.length === 0) return false;
    if (files.some(f => f.progress < 100)) return false;
    if (!showAdvanced) return true; 
    
    if (EXAM_CATEGORIES.includes(metadata.category)) {
      if (!metadata.examName.trim()) return false;
    }
    
    return true; 
  };

  const handleProcess = async () => {
    if (!isValid()) return;
    
    // 1. Create Job (JSON)
    const jobPayload = {
      subject: metadata.subject || (metadata.title || files[0].name),
      class_grade: metadata.classGrade || metadata.examName || "Unknown",
      total_marks: parseInt(metadata.maxMarks) || 100,
      time_allowed: metadata.timeDuration || null,
      notes: metadata.description || null
    };

    try {
      const token = localStorage.getItem("titus_auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/jobs/", {
        method: "POST",
        headers,
        body: JSON.stringify(jobPayload)
      });
      if (!res.ok) throw new Error("Failed to create job on server.");
      
      const jobData = await res.json();
      const jobId = jobData.id;
      localStorage.setItem("active_job_id", jobId);

      // 2. Upload Files
      const formData = new FormData();
      files.forEach(f => {
        formData.append("files", f.file);
      });

      const uploadHeaders: Record<string, string> = {};
      if (token) {
        uploadHeaders["Authorization"] = `Bearer ${token}`;
      }

      const uploadRes = await fetch(`/api/v1/job-files/upload/${jobId}`, {
        method: "POST",
        headers: uploadHeaders,
        body: formData
      });
      if (!uploadRes.ok) throw new Error("Failed to upload files.");

      // 3. Trigger OCR Processing in Background
      const processRes = await fetch(`/api/v1/jobs/${jobId}/process`, {
        method: "POST",
        headers: uploadHeaders
      });
      if (!processRes.ok) throw new Error("Failed to start processing.");

      navigate('/processing');
    } catch (err: any) {
      triggerToast('error', 'Execution Error', err.message || 'Failed to start document conversion.');
    }
  };

  const renderAdvancedForm = () => {
    const isExam = EXAM_CATEGORIES.includes(metadata.category);

    return (
      <form className={styles.metadataForm}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-12)' }}>
          <Input label="Document Title *" placeholder="Enter title" value={metadata.title} onChange={e => setMetadata({...metadata, title: e.target.value})} />
          
          <div className={styles.textareaWrapper}>
            <label className={styles.textareaLabel}>Document Category *</label>
            <select 
              className={styles.textarea} 
              value={metadata.category} 
              onChange={e => setMetadata({...metadata, category: e.target.value})}
              style={{ height: '42px', padding: '0 var(--space-12)' }}
            >
              <option value="" disabled>Select a category...</option>
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
          <Input label="Subject (Optional)" placeholder="e.g. Science" value={metadata.subject} onChange={e => setMetadata({...metadata, subject: e.target.value})} />
          <Input label="Language" placeholder="e.g. English" value={metadata.language} onChange={e => setMetadata({...metadata, language: e.target.value})} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-12)' }}>
          <Input label="Date (Optional)" type="date" value={metadata.date} onChange={e => setMetadata({...metadata, date: e.target.value})} />
        </div>

        <div className={styles.textareaWrapper}>
          <label className={styles.textareaLabel}>Description / Notes (Optional)</label>
          <textarea 
            className={styles.textarea} rows={2} placeholder="Add any notes here..."
            value={metadata.description} onChange={e => setMetadata({...metadata, description: e.target.value})}
          />
        </div>

        <div className={styles.sectionDivider} onClick={() => setShowAcademic(!showAcademic)} style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', cursor: 'pointer', padding: 'var(--space-8) 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginTop: 'var(--space-8)' }}>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Academic Information (Optional)</strong>
            {showAcademic ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
          </div>
        </div>

        {showAcademic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', padding: 'var(--space-8) 0', animation: 'fadeIn 200ms ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
              <Input label="Course" placeholder="e.g. B.Tech" value={metadata.course} onChange={e => setMetadata({...metadata, course: e.target.value})} />
              <Input label="Class / Grade" placeholder="e.g. Grade 12" value={metadata.classGrade} onChange={e => setMetadata({...metadata, classGrade: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
              <Input label="Semester" placeholder="e.g. 1st Semester" value={metadata.semester} onChange={e => setMetadata({...metadata, semester: e.target.value})} />
              <Input label="Section" placeholder="e.g. A" value={metadata.section} onChange={e => setMetadata({...metadata, section: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
              <Input label="Faculty / Teacher" placeholder="Name" value={metadata.faculty} onChange={e => setMetadata({...metadata, faculty: e.target.value})} />
              <Input label="Academic Year" placeholder="e.g. 2023-24" value={metadata.academicYear} onChange={e => setMetadata({...metadata, academicYear: e.target.value})} />
            </div>
            <Input label="Batch" placeholder="e.g. 2024" value={metadata.batch} onChange={e => setMetadata({...metadata, batch: e.target.value})} />
          </div>
        )}

        {isExam && (
          <div style={{ backgroundColor: 'var(--bg-info)', padding: 'var(--space-16)', borderRadius: 'var(--radius-input)', marginTop: 'var(--space-8)' }}>
            <h4 style={{ fontSize: '14px', marginBottom: 'var(--space-16)', color: 'var(--primary)' }}>Exam Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-12)', marginBottom: 'var(--space-12)' }}>
              <Input label="Exam Name *" placeholder="e.g. Mid Semester" value={metadata.examName} onChange={e => setMetadata({...metadata, examName: e.target.value})} />
              <div className={styles.textareaWrapper}>
                <label className={styles.textareaLabel}>Exam Type</label>
                <select 
                  className={styles.textarea} 
                  value={metadata.examType} 
                  onChange={e => setMetadata({...metadata, examType: e.target.value})}
                  style={{ height: '42px', padding: '0 var(--space-12)' }}
                >
                  <option value="">Select type...</option>
                  <option value="Unit Test">Unit Test</option>
                  <option value="Internal">Internal</option>
                  <option value="Mid Semester">Mid Semester</option>
                  <option value="End Semester">End Semester</option>
                  <option value="Practical">Practical</option>
                  <option value="Viva">Viva</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', marginBottom: 'var(--space-12)' }}>
              <Input label="Maximum Marks" type="number" placeholder="e.g. 100" value={metadata.maxMarks} onChange={e => setMetadata({...metadata, maxMarks: e.target.value})} />
              <Input label="Time Duration" placeholder="e.g. 2 Hours" value={metadata.timeDuration} onChange={e => setMetadata({...metadata, timeDuration: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-12)' }}>
              <Input label="Exam Date" type="date" value={metadata.date} onChange={e => setMetadata({...metadata, date: e.target.value})} />
              <div className={styles.textareaWrapper}>
                <label className={styles.textareaLabel}>Instructions (Optional)</label>
                <textarea 
                  className={styles.textarea} rows={2} placeholder="Any specific exam instructions..."
                  value={metadata.instructions} onChange={e => setMetadata({...metadata, instructions: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.actions} style={{ marginTop: 'var(--space-24)' }}>
          <Button variant="primary" size="lg" style={{ width: '100%' }} disabled={!isValid()} onClick={handleProcess} type="button">
            Read Document
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className={clsx("animate-fade-in", styles.pageWrapper)}>
      <Stepper currentStep="upload" />

      <div className={styles.header}>
        <h1 className={styles.title}>Upload Documents</h1>
        <p className={styles.subtitle}>Upload your handwritten document or PDF to begin composing a structured examination document.</p>
      </div>

      {/* ── Main 3-column grid: dropzone | preview | metadata ── */}
      <div className={clsx(styles.grid, files.length > 0 ? styles.gridSplit : styles.gridSingle)}>
        {/* LEFT: dropzone + thumbnail strip */}
        <div className={styles.uploadCol}>
          <div
            className={clsx(styles.dropzone, isDragging && styles.active)}
            onDragEnter={handleDragEnter} onDragOver={handleDragOver}
            onDragLeave={handleDragLeave} onDrop={handleDrop}
          >
            <div className={styles.uploadIllustration}>
              <UploadCloud size={64} className={styles.uploadIcon} />
            </div>
            <div className={styles.dropTitle}>Click to upload or drag and drop</div>
            <div className={styles.dropSubtitle}>Supports PDF, JPG, PNG, WEBP, TIFF, BMP, GIF (Max 50MB)</div>
            <Button variant="secondary" size="md" style={{ marginTop: 'var(--space-16)' }} onClick={handleBrowseClick}>Browse Files</Button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.gif,.heic,.heif" onChange={handleFileChange} />
          </div>

          <Card style={{ marginTop: 'var(--space-16)', padding: 'var(--space-16)', border: '1px dashed var(--border)', textAlign: 'center' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>
              Having trouble using Browse Files?
            </h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              You can drag files directly from Windows Explorer onto the upload area.
            </p>
          </Card>

          {hasQualityWarning && (
            <div className={styles.warningBanner}>
              <AlertTriangle size={20} />
              <span><strong>Small image detected:</strong> Some pages may have limited pixel detail. You can still process them.</span>
            </div>
          )}

          {files.length > 0 && (
            <div className={styles.thumbnailSection}>
              <h3 className={styles.sectionTitle}>Document Pages ({files.length})</h3>
              <div className={styles.thumbnailStrip}>
                {files.map((f, index) => (
                  <div
                    key={f.id}
                    className={clsx(styles.thumbnailCard, selectedFileId === f.id && styles.thumbnailCardActive)}
                    onClick={() => { setSelectedFileId(f.id); setPreviewZoom(100); }}
                  >
                    <div className={styles.thumbnailDragHandle}>
                      <GripVertical size={16} /> <span className={styles.pageNumber}>Page {index + 1}</span>
                    </div>
                    <div className={styles.thumbnailImageWrapper}>
                      {f.thumbnailUrl ? (
                        <img 
                          src={f.thumbnailUrl} 
                          className={styles.thumbnailPreviewImage} 
                          style={{ transform: `rotate(${f.rotation}deg)` }} 
                          alt={f.name}
                        />
                      ) : (
                        <div className={styles.thumbnailPlaceholder} style={{ transform: `rotate(${f.rotation}deg)` }}>
                          <File size={32} />
                        </div>
                      )}
                      {f.qualityWarning && <div className={styles.thumbnailWarning} title="Small image"><AlertTriangle size={14} /></div>}
                    </div>

                    <div className={styles.thumbnailFileName} title={f.name}>
                      {f.name}
                      {f.name.toLowerCase().endsWith('.pdf') && (
                        <div>
                          <span className={styles.pdfBadge}>PDF • {f.pageCount || 1} pages</span>
                        </div>
                      )}
                    </div>

                    {f.progress < 100 ? (
                      <div className={styles.thumbnailProgress}>
                        <div className={styles.thumbnailProgressBar} style={{ width: `${f.progress}%` }} />
                        <span className={styles.progressPercent}>{f.progress}%</span>
                      </div>
                    ) : (
                      <div className={styles.thumbnailSuccessText}>Staged</div>
                    )}

                    <div className={styles.thumbnailToolbar}>
                      <button onClick={(e) => { e.stopPropagation(); rotateFile(f.id, -90); }} title="Rotate Left"><RotateCcw size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); rotateFile(f.id, 90); }} title="Rotate Right"><RotateCw size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); rotateFile(f.id, 180); }} title="Rotate 180°" style={{ fontSize: '10px', fontWeight: 'bold' }}>180°</button>
                      <button className={styles.trashBtn} onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} title="Delete Page"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTRE: full-size file preview */}
        {files.length > 0 && selectedFile && (
          <div className={styles.previewCol}>
            <div className={styles.previewPanel}>
              <div className={styles.previewToolbar}>
                <span className={styles.previewFilename}>{selectedFile.name}</span>
                <div className={styles.previewControls}>
                  <button className={styles.previewBtn} onClick={() => setPreviewZoom(z => Math.max(30, z - 15))} title="Zoom out"><ZoomOut size={14} /></button>
                  <span className={styles.previewZoomLabel}>{previewZoom}%</span>
                  <button className={styles.previewBtn} onClick={() => setPreviewZoom(z => Math.min(300, z + 15))} title="Zoom in"><ZoomIn size={14} /></button>
                  <button className={styles.previewBtn} onClick={() => setPreviewZoom(100)} title="Reset zoom"><Maximize2 size={14} /></button>
                </div>
              </div>

              <div className={styles.previewBody}>
                {selectedFile.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    key={selectedFile.id}
                    src={selectedFile.thumbnailUrl || URL.createObjectURL(selectedFile.file)}
                    className={styles.previewIframe}
                    style={{ width: `${previewZoom}%`, minWidth: '300px' }}
                    title={selectedFile.name}
                  />
                ) : selectedFile.thumbnailUrl ? (
                  <img
                    src={selectedFile.thumbnailUrl}
                    className={styles.previewImage}
                    style={{
                      transform: `scale(${previewZoom / 100}) rotate(${selectedFile.rotation}deg)`,
                      transformOrigin: 'top center',
                    }}
                    alt={selectedFile.name}
                  />
                ) : (
                  <div className={styles.previewEmpty}>
                    <File size={48} />
                    <span>No preview available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT: metadata / action */}
        {files.length > 0 && (
          <div className={styles.metadataCol}>
            
            {!showAdvanced && (
              <Card className={clsx(styles.metadataCard, "animate-fade-in")}>
                <div style={{ textAlign: 'center', padding: 'var(--space-24) 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-16)' }}>
                    <div style={{ padding: 'var(--space-16)', backgroundColor: 'var(--bg-warning)', color: 'var(--warning)', borderRadius: '50%' }}>
                      <Zap size={48} />
                    </div>
                  </div>
                  <h3 style={{ fontSize: 'var(--text-h4)', marginBottom: 'var(--space-8)' }}>Quick Read</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-32)', fontSize: '14px' }}>
                    Skip adding document details and immediately begin reading the document.
                  </p>
                  <Button variant="primary" size="lg" style={{ width: '100%', marginBottom: 'var(--space-16)' }} onClick={handleProcess}>
                    Read Document Now
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(true)}>
                    <Settings2 size={16} style={{ marginRight: '8px' }} /> Add Document Details
                  </Button>
                </div>
              </Card>
            )}

            {showAdvanced && (
              <Card className={clsx(styles.metadataCard, "animate-fade-in")}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
                  <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Document Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(false)}>Cancel</Button>
                </div>
                
                {renderAdvancedForm()}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
