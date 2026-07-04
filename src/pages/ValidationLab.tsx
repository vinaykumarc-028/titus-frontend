import React, { useState, useRef } from 'react';
import {
  Upload, FileText, AlertCircle, Loader2,
  FileCheck, Download,
  Play, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { triggerToast } from '../components/ui/ToastContainer';
import styles from './ValidationLab.module.css';

interface ProgressRow {
  page: number;
  status: 'waiting' | 'running' | 'completed' | 'failed' | 'timeout';
  duration?: number;
  reason?: string;
}

export const ValidationLab: React.FC = () => {
  // Input states
  const [institutionName, setInstitutionName] = useState('TITUS SOLUTIONS EXAM LAB');
  const [subject, setSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [timeAllowed, setTimeAllowed] = useState('');
  const [notes, setNotes] = useState('');
  
  const [files, setFiles] = useState<File[]>([]);
  const [groundTruth, setGroundTruth] = useState<File | null>(null);

  // Status and run states
  const [isRunning, setIsRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Progress states
  const [progressPages, setProgressPages] = useState<ProgressRow[]>([]);
  const [progressStatus, setProgressStatus] = useState('');
  
  // Result states
  const [result, setResult] = useState<any>(null);
  const [generatedAnswers, setGeneratedAnswers] = useState<string | null>(null);
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gtInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleGtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setGroundTruth(e.target.files[0]);
    }
  };

  const clearForm = () => {
    setFiles([]);
    setGroundTruth(null);
    setResult(null);
    setGeneratedAnswers(null);
    setStatusMsg('');
    setIsError(false);
    setProgressPages([]);
    setProgressStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (gtInputRef.current) gtInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      triggerToast('error', 'Validation Error', 'Handwritten PDF or image files are required.');
      return;
    }

    const formData = new FormData();
    files.forEach(f => {
      formData.append('files', f);
    });
    if (groundTruth) {
      formData.append('ground_truth', groundTruth);
    }

    setIsRunning(true);
    setIsError(false);
    setStatusMsg('Running OCR validation pipeline...');
    setProgressStatus('Connecting to server...');
    setProgressPages([]);
    setResult(null);
    setGeneratedAnswers(null);

    try {
      const response = await fetch('/dev/ocr-validation/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = 'Validation failed.';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.detail || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.substring(6);
            const ev = JSON.parse(dataStr);

            if (ev.type === 'status') {
              setProgressStatus(ev.message);
            } else if (ev.type === 'init_pages') {
              const rows: ProgressRow[] = [];
              for (let i = 1; i <= ev.total_pages; i++) {
                rows.push({ page: i, status: 'waiting' });
              }
              setProgressPages(rows);
            } else if (ev.type === 'page_status') {
              setProgressPages(prev =>
                prev.map(p =>
                  p.page === ev.page
                    ? { ...p, status: ev.status, duration: ev.duration, reason: ev.reason }
                    : p
                )
              );
            } else if (ev.type === 'result') {
              setResult(ev.result);
              setStatusMsg(`Successfully processed ${ev.result.pages.length} page(s).`);
              setProgressStatus('Evaluation Complete.');
            } else if (ev.type === 'error') {
              throw new Error(`[${ev.category}] ${ev.message}`);
            }
          }
        }
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMsg(err.message || 'Validation process failed.');
      setProgressStatus('Failed.');
      triggerToast('error', 'Validation Failure', err.message || 'Failed to complete run.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadReport = (label: string, filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('success', 'Download', `${label} download started.`);
  };

  const handleDownloadHtml = async (includeAnswers: boolean) => {
    if (!result) return;
    const allElements = [];
    for (const page of result.pages) {
      if (page.status === 'Completed' && page.elements) {
        allElements.push(...page.elements);
      }
    }

    const payload = {
      elements: allElements,
      institution_name: institutionName.trim() || 'TITUS SOLUTIONS EXAM LAB',
      subject: subject.trim() || null,
      class_grade: classGrade.trim() || null,
      total_marks: parseInt(totalMarks.trim()) || null,
      time_allowed: timeAllowed.trim() || null,
      notes: notes.trim() || null,
      answers_markdown: includeAnswers ? generatedAnswers : null
    };

    try {
      const res = await fetch('/dev/ocr-validation/download-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTML generation failed.');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;

      const baseName = (payload.subject || 'extracted-exam').replace(/\s+/g, '_');
      anchor.download = includeAnswers ? `${baseName}-with-answers.html` : `${baseName}.html`;
      anchor.click();
      URL.revokeObjectURL(url);
      triggerToast('success', 'HTML Generated', 'Extracted exam downloaded successfully.');
    } catch (err: any) {
      triggerToast('error', 'Download Error', err.message || 'Failed to download HTML document.');
    }
  };

  const handleGenerateAnswers = async () => {
    if (!result) return;
    const allElements: any[] = [];
    for (const page of result.pages) {
      if (page.status === 'Completed' && page.elements) {
        allElements.push(...page.elements);
      }
    }

    try {
      setIsGeneratingAnswers(true);
      triggerToast('info', 'AI Answer Key', 'Generating answers for exam elements...');
      const res = await fetch('/dev/ocr-validation/generate-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: allElements })
      });
      
      if (!res.ok) throw new Error('Failed to generate answers.');
      
      const data = await res.json();
      setGeneratedAnswers(data.answers_markdown);
      triggerToast('success', 'AI Completed', 'AI generated answer key preview loaded.');
    } catch (err: any) {
      triggerToast('error', 'Generation Error', err.message || 'Failed to generate answers.');
    } finally {
      setIsGeneratingAnswers(false);
    }
  };

  const renderDiffLine = (line: string, i: number) => {
    let cls = '';
    if (line.startsWith('+')) cls = styles.diffAdd;
    else if (line.startsWith('-')) cls = styles.diffDel;
    else if (line.startsWith('@')) cls = styles.diffMeta;
    return (
      <div key={i} className={`${styles.diffLine} ${cls}`}>
        {line}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.badge}>Developer Mode Only</div>
          <h1 className={styles.title}>Validation Lab</h1>
          <p className={styles.subtitle}>
            Upload a document alongside its Ground Truth to perform end-to-end Character Accuracy (CER) and Word Accuracy (WER) evaluation.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        {/* Parameters Form */}
        <Card className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Institution Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={institutionName}
                  onChange={e => setInstitutionName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Subject *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Mathematics"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Class / Grade *</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Grade 10"
                  value={classGrade}
                  onChange={e => setClassGrade(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Total Marks *</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="e.g. 100"
                  value={totalMarks}
                  onChange={e => setTotalMarks(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Time Duration</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 3 Hours"
                  value={timeAllowed}
                  onChange={e => setTimeAllowed(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Notes</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Validation Run notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.uploadRow}>
              {/* Document File Select */}
              <div className={styles.uploadBox}>
                <label className={styles.label}>Scanned Documents *</label>
                <div className={styles.fileDropzone} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={24} className={styles.uploadIcon} />
                  <span className={styles.uploadText}>
                    {files.length > 0 ? `${files.length} file(s) selected` : 'Select PDFs or Images'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="application/pdf,image/png,image/jpeg,image/webp,image/tiff"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
                {files.length > 0 && (
                  <div className={styles.fileList}>
                    {files.map((f, idx) => (
                      <div key={idx} className={styles.fileItem}>
                        <FileText size={12} />
                        <span className={styles.fileName}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ground Truth File Select */}
              <div className={styles.uploadBox}>
                <label className={styles.label}>Ground Truth file (.txt, .pdf) (Optional)</label>
                <div className={styles.fileDropzone} onClick={() => gtInputRef.current?.click()}>
                  <FileCheck size={24} className={styles.uploadIcon} />
                  <span className={styles.uploadText}>
                    {groundTruth ? groundTruth.name : 'Select Ground Truth Text or PDF'}
                  </span>
                  <input
                    ref={gtInputRef}
                    type="file"
                    accept="text/plain,.txt,application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleGtChange}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={clearForm} disabled={isRunning}>
                Clear
              </Button>
              <Button type="submit" variant="primary" icon={<Play size={14} />} loading={isRunning}>
                Run OCR Validation
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Running Progress */}
        {isRunning && (
          <Card className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <Loader2 className="animate-spin" size={16} />
              <span className={styles.progressStatus}>{progressStatus}</span>
            </div>
            <div className={styles.progressList}>
              {progressPages.map(p => (
                <div key={p.page} className={styles.progressRow}>
                  <span>Page {p.page}</span>
                  <span className={styles[`badge_${p.status}`]}>
                    {p.status === 'waiting' && 'Waiting'}
                    {p.status === 'running' && 'Running...'}
                    {p.status === 'completed' && `Completed (${p.duration?.toFixed(1)}s)`}
                    {p.status === 'failed' && `Failed (${p.reason})`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Status indicator on failure */}
        {!isRunning && isError && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Evaluation Output Dashboard */}
        {!isRunning && result && (
          <div className={styles.results}>

            {/* Run Header */}
            <div className={styles.metricsSummary}>
              <div className={styles.sumCard}>
                <span className={styles.sumKey}>Total Processing Time</span>
                <strong className={styles.sumVal}>{result.total_processing_time_seconds.toFixed(2)}s</strong>
              </div>
              <div className={styles.sumCard}>
                <span className={styles.sumKey}>Pages Processed</span>
                <strong className={styles.sumVal}>{result.run_summary?.pages_processed ?? result.pages.length}</strong>
              </div>
              <div className={styles.sumCard}>
                <span className={styles.sumKey}>Pages Succeeded</span>
                <strong className={styles.sumVal} style={{ color: 'var(--success)' }}>
                  {result.run_summary?.pages_succeeded ?? result.pages.filter((p: any) => p.status === 'Completed').length}
                </strong>
              </div>
              {result.run_summary?.pages_failed > 0 && (
                <div className={styles.sumCard}>
                  <span className={styles.sumKey}>Pages Failed</span>
                  <strong className={styles.sumVal} style={{ color: 'var(--danger)' }}>
                  {result.run_summary.pages_failed}
                </strong>
              </div>
            )}
              {result.benchmark ? (
                <>
                  <div className={styles.sumCard}>
                    <span className={styles.sumKey}>Overall Accuracy</span>
                    <strong className={styles.sumVal} style={{ color: (result.benchmark.overall_accuracy ?? result.benchmark.document_character_accuracy) >= 0.95 ? 'var(--success)' : (result.benchmark.overall_accuracy ?? result.benchmark.document_character_accuracy) >= 0.80 ? 'var(--warning)' : 'var(--danger)' }}>
                      {((result.benchmark.overall_accuracy ?? result.benchmark.document_character_accuracy) * 100).toFixed(2)}%
                    </strong>
                  </div>
                  <div className={styles.sumCard}>
                    <span className={styles.sumKey}>Character Accuracy</span>
                    <strong className={styles.sumVal} style={{ color: result.benchmark.document_character_accuracy >= 0.95 ? 'var(--success)' : result.benchmark.document_character_accuracy >= 0.80 ? 'var(--warning)' : 'var(--danger)' }}>
                      {(result.benchmark.document_character_accuracy * 100).toFixed(2)}%
                    </strong>
                  </div>
                  <div className={styles.sumCard}>
                    <span className={styles.sumKey}>Word Accuracy</span>
                    <strong className={styles.sumVal} style={{ color: result.benchmark.document_word_accuracy >= 0.95 ? 'var(--success)' : result.benchmark.document_word_accuracy >= 0.80 ? 'var(--warning)' : 'var(--danger)' }}>
                      {(result.benchmark.document_word_accuracy * 100).toFixed(2)}%
                    </strong>
                  </div>
                </>
              ) : (
                <div className={styles.sumCard}>
                  <span className={styles.sumKey}>Benchmark Accuracy</span>
                  <strong className={styles.sumVal} style={{ color: 'var(--danger)', fontSize: 'var(--text-16)' }}>Unavailable</strong>
                </div>
              )}
            </div>

            {!result.benchmark && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>Production benchmark was not returned by the backend. Accuracy is intentionally hidden because legacy file-level diff can include metadata and is not valid scoring.</span>
              </div>
            )}

            {/* Production Benchmark Report */}
            {result.benchmark && (() => {
              const bm = result.benchmark;
              const charAccNum = bm.document_character_accuracy;
              const accColor = charAccNum >= 0.95 ? 'var(--success)' : charAccNum >= 0.80 ? 'var(--warning)' : 'var(--danger)';
              return (
                <Card className={styles.benchmarkCard}>
                  <div className={styles.benchmarkHeader}>
                    <h3 className={styles.benchmarkTitle}>OCR Benchmark Report</h3>
                    <span className={styles.benchmarkBadge} style={{ background: accColor }}>
                      {((bm.overall_accuracy ?? bm.document_character_accuracy) * 100).toFixed(2)}% Overall Accuracy
                    </span>
                  </div>

                  <div className={styles.benchmarkMetrics}>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Overall Accuracy</span>
                      <strong className={styles.bmMetricValue} style={{ color: accColor }}>
                        {((bm.overall_accuracy ?? bm.document_character_accuracy) * 100).toFixed(2)}%
                      </strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Character Error Rate</span>
                      <strong className={styles.bmMetricValue} style={{ color: accColor }}>
                        {(bm.document_cer * 100).toFixed(2)}%
                      </strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Word Error Rate</span>
                      <strong className={styles.bmMetricValue} style={{ color: bm.document_word_accuracy >= 0.95 ? 'var(--success)' : bm.document_word_accuracy >= 0.80 ? 'var(--warning)' : 'var(--danger)' }}>
                        {(bm.document_wer * 100).toFixed(2)}%
                      </strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Character Accuracy</span>
                      <strong className={styles.bmMetricValue} style={{ color: accColor }}>{(bm.document_character_accuracy * 100).toFixed(2)}%</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Word Accuracy</span>
                      <strong className={styles.bmMetricValue}>{(bm.document_word_accuracy * 100).toFixed(2)}%</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Chars Correct</span>
                      <strong className={styles.bmMetricValue} style={{ color: 'var(--success)' }}>{bm.total_chars_correct.toLocaleString()}</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Chars Deleted</span>
                      <strong className={styles.bmMetricValue} style={{ color: 'var(--danger)' }}>{bm.total_chars_deleted.toLocaleString()}</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Chars Inserted</span>
                      <strong className={styles.bmMetricValue} style={{ color: 'var(--warning)' }}>{bm.total_chars_inserted.toLocaleString()}</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Chars Substituted</span>
                      <strong className={styles.bmMetricValue} style={{ color: 'var(--warning)' }}>{bm.total_chars_substituted.toLocaleString()}</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Missing Words</span>
                      <strong className={styles.bmMetricValue} style={{ color: 'var(--danger)' }}>{(bm.total_missing_words ?? bm.total_words_deleted).toLocaleString()}</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Inserted Words</span>
                      <strong className={styles.bmMetricValue} style={{ color: 'var(--warning)' }}>{(bm.total_inserted_words ?? bm.total_words_inserted).toLocaleString()}</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Formatting Score</span>
                      <strong className={styles.bmMetricValue}>{((bm.formatting_preservation ?? 1) * 100).toFixed(2)}%</strong>
                    </div>
                    <div className={styles.bmMetric}>
                      <span className={styles.bmMetricLabel}>Structural Score</span>
                      <strong className={styles.bmMetricValue}>{((bm.structural_preservation ?? 1) * 100).toFixed(2)}%</strong>
                    </div>
                  </div>

                  <div className={styles.confDist}>
                    <span className={styles.confDistLabel}>Confidence Distribution</span>
                    <div className={styles.confBuckets}>
                      <div className={styles.confBucket} style={{ background: 'var(--success-subtle)' }}>
                        <span className={styles.confBucketCount}>{bm.confidence_high}</span>
                        <span className={styles.confBucketLabel}>High &ge;95%</span>
                      </div>
                      <div className={styles.confBucket} style={{ background: 'var(--warning-subtle)' }}>
                        <span className={styles.confBucketCount}>{bm.confidence_medium}</span>
                        <span className={styles.confBucketLabel}>Medium 80&ndash;94%</span>
                      </div>
                      <div className={styles.confBucket} style={{ background: 'var(--danger-subtle)' }}>
                        <span className={styles.confBucketCount}>{bm.confidence_low}</span>
                        <span className={styles.confBucketLabel}>Low &lt;80%</span>
                      </div>
                    </div>
                  </div>

                  {bm.pages.length > 1 && (
                    <div className={styles.pageExtreme}>
                      <div className={styles.extremeItem}>
                        <span className={styles.extremeLabel}>Best Page</span>
                        <span className={styles.extremeVal} style={{ color: 'var(--success)' }}>
                          Page {bm.lowest_cer_page} &mdash; CER {(bm.lowest_cer * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className={styles.extremeItem}>
                        <span className={styles.extremeLabel}>Worst Page</span>
                        <span className={styles.extremeVal} style={{ color: 'var(--danger)' }}>
                          Page {bm.highest_cer_page} &mdash; CER {(bm.highest_cer * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={styles.pageBreakdownTable}>
                    <div className={styles.pbTableHeader}>
                      <span>Page</span>
                      <span>CER</span>
                      <span>WER</span>
                      <span>Char Acc</span>
                      <span>Page Acc</span>
                      <span>Correct</span>
                      <span>Deleted</span>
                      <span>Inserted</span>
                      <span>Subst.</span>
                      <span>Warnings</span>
                    </div>
                    {bm.pages.map((pg: any) => {
                      const rowColor = pg.character_accuracy >= 0.95 ? 'var(--success)' : pg.character_accuracy >= 0.80 ? 'var(--warning)' : 'var(--danger)';
                      return (
                        <div key={pg.page} className={styles.pbTableRow}>
                          <span className={styles.pbPageNum}>P{pg.page}</span>
                          <span style={{ color: rowColor, fontWeight: 600 }}>{(pg.cer * 100).toFixed(1)}%</span>
                          <span style={{ color: rowColor }}>{(pg.wer * 100).toFixed(1)}%</span>
                          <span style={{ color: rowColor, fontWeight: 600 }}>{(pg.character_accuracy * 100).toFixed(1)}%</span>
                          <span style={{ color: rowColor, fontWeight: 600 }}>{((pg.page_accuracy ?? pg.character_accuracy) * 100).toFixed(1)}%</span>
                          <span style={{ color: 'var(--success)' }}>{pg.chars_correct}</span>
                          <span style={{ color: 'var(--danger)' }}>{pg.chars_deleted}</span>
                          <span style={{ color: 'var(--warning)' }}>{pg.chars_inserted}</span>
                          <span style={{ color: 'var(--warning)' }}>{pg.chars_substituted}</span>
                          <span>
                            {pg.warnings?.length > 0
                              ? <span className={styles.warnBadge} title={pg.warnings.join(' | ')}>&#9888; {pg.warnings.length}</span>
                              : <span className={styles.okBadge}>&#10003;</span>
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {bm.ground_truth_metadata && Object.keys(bm.ground_truth_metadata).length > 0 && (
                    <div className={styles.gtMetadata}>
                      <span className={styles.gtMetaTitle}>Ground Truth Metadata (display only &mdash; not used in scoring)</span>
                      <div className={styles.gtMetaGrid}>
                        {Object.entries(bm.ground_truth_metadata).map(([k, v]: [string, any]) => (
                          <div key={k} className={styles.gtMetaRow}>
                            <span className={styles.gtMetaKey}>{k}</span>
                            <span className={styles.gtMetaVal}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })()}

            {/* Downloads */}
            <div className={styles.downloads}>
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={14} />}
                onClick={() => handleDownloadReport('OCR Markdown', 'ocr-markdown.md', result.pages.map((p: any) => p.markdown).join('\n\n'))}
              >
                Download Markdown
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={14} />}
                onClick={() => handleDownloadReport('Parsed JSON', 'parsed-document.json', JSON.stringify(result.pages, null, 2))}
              >
                Download JSON
              </Button>
              {result.benchmark && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={() => handleDownloadReport('Benchmark Report', 'benchmark-report.json', JSON.stringify(result.benchmark, null, 2))}
                >
                  Download Benchmark
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<FileCheck size={14} />}
                onClick={() => handleDownloadHtml(false)}
              >
                Download HTML
              </Button>
              {!generatedAnswers ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Sparkles size={14} />}
                  onClick={handleGenerateAnswers}
                  loading={isGeneratingAnswers}
                >
                  Generate AI Answers
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={() => handleDownloadHtml(true)}
                >
                  Download Exam with Answers
                </Button>
              )}
            </div>

            {generatedAnswers && (
              <Card className={styles.answersCard}>
                <h3 className={styles.answersTitle}>AI Answer Key</h3>
                <pre className={styles.answersText}>{generatedAnswers}</pre>
              </Card>
            )}

            {/* Debug: Unified Diff */}
            {result.benchmark?.unified_diff && (
              <Card className={styles.diffCard}>
                <div className={styles.diffDebugBanner}>
                  <AlertCircle size={14} />
                  <span>Debug View only. Scores above are computed from the alignment engine, NOT from this diff.</span>
                </div>
                <h3 className={styles.diffTitle}>Unified Diff (Debug)</h3>
                <div className={styles.diffLines}>
                  {result.benchmark.unified_diff.split('\n').map((line: string, i: number) => renderDiffLine(line, i))}
                </div>
              </Card>
            )}

            {/* Page Breakdown Panel */}
            <div className={styles.pageBreakdown}>
              <h2 className={styles.breakdownTitle}>Page Breakdown</h2>
              <div className={styles.pageBreakdownList}>
                {result.pages.map((p: any) => (
                  <div key={p.page} className={styles.pageBreakdownCard}>
                    <div className={styles.breakdownThumb}>
                      {p.image_data_url ? (
                        <img src={p.image_data_url} alt={`Page ${p.page}`} />
                      ) : (
                        <div className={styles.noThumb}>No Image</div>
                      )}
                      <div className={styles.pageBreakdownLabel}>Page {p.page}</div>
                    </div>
                    <div className={styles.breakdownOcr}>
                      <span className={styles.breakdownSubHeader}>Extracted Markdown</span>
                      <pre className={styles.breakdownText}>{p.markdown || '(no text extracted)'}</pre>
                    </div>
                    <div className={styles.breakdownMetrics}>
                      <span className={styles.breakdownSubHeader}>Metrics</span>
                      <div className={styles.breakdownMetricRow}>
                        <span>Status</span>
                        <strong>{p.status}</strong>
                      </div>
                      <div className={styles.breakdownMetricRow}>
                        <span>OCR Duration</span>
                        <span>{p.processing_time_seconds.toFixed(2)}s</span>
                      </div>
                      {p.metrics && (
                        <>
                          <div className={styles.breakdownMetricRow}>
                            <span>VLM request</span>
                            <span>{p.metrics.gemini_request_seconds.toFixed(2)}s</span>
                          </div>
                          <div className={styles.breakdownMetricRow}>
                            <span>Resolution</span>
                            <span>{p.metrics.image_resolution}</span>
                          </div>
                        </>
                      )}
                      {result.benchmark?.pages?.find((pg: any) => pg.page === p.page) && (
                        <>
                          <div className={styles.breakdownMetricRow}>
                            <span>Page Accuracy</span>
                            <strong>{((result.benchmark.pages.find((pg: any) => pg.page === p.page).page_accuracy ?? 0) * 100).toFixed(2)}%</strong>
                          </div>
                          <div className={styles.breakdownMetricRow}>
                            <span>Formatting</span>
                            <span>{((result.benchmark.pages.find((pg: any) => pg.page === p.page).formatting_score ?? 1) * 100).toFixed(1)}%</span>
                          </div>
                          <div className={styles.breakdownMetricRow}>
                            <span>Structural</span>
                            <span>{((result.benchmark.pages.find((pg: any) => pg.page === p.page).structural_score ?? 1) * 100).toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                    {result.benchmark?.pages?.find((pg: any) => pg.page === p.page) && (
                      <details className={styles.breakdownOcr}>
                        <summary className={styles.breakdownSubHeader}>Side-by-side Ground Truth vs OCR</summary>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', marginTop: 'var(--space-8)' }}>
                          <pre className={styles.breakdownText}>{result.benchmark.pages.find((pg: any) => pg.page === p.page).ground_truth_text || '(no benchmark ground truth)'}</pre>
                          <pre className={styles.breakdownText}>{result.benchmark.pages.find((pg: any) => pg.page === p.page).ocr_text || p.markdown || '(no OCR text)'}</pre>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
