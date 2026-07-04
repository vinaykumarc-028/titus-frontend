import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft,
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  PhoneCall, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  Eye, 
  Edit3, 
  FileText, 
  Sparkles, 
  Download, 
  CheckCircle2
} from 'lucide-react';
import { Button } from './Button';
import clsx from 'clsx';
import styles from './HelpCenterDrawer.module.css';

interface HelpCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpView = 'main' | 'getting-started' | 'faqs' | 'ocr-tips' | 'support';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I upload documents?',
    answer: 'Navigate to the Converter page, click the upload area (or drag and drop your files), and choose your document. The processing will start automatically.'
  },
  {
    id: 'faq-2',
    question: 'Which file types are supported?',
    answer: 'We support PDF, JPG, JPEG, PNG, WEBP, and TIFF. The maximum file size limit is 10 MB per upload.'
  },
  {
    id: 'faq-3',
    question: 'Can I edit OCR mistakes?',
    answer: 'Yes! After processing finishes, you will be taken to the Review editor screen where you can compare the original document side-by-side and edit any unrecognized words inline.'
  },
  {
    id: 'faq-4',
    question: 'Can I generate AI Answer Keys?',
    answer: 'Yes, if your document is an assignment or exam, click the "Generate AI Answer Key" option inside the Review screen. Our AI will analyze the questions and construct a structured draft key.'
  },
  {
    id: 'faq-5',
    question: 'How accurate is OCR?',
    answer: 'Our OCR engine averages 95%+ accuracy for clean print-texts, and 85%+ accuracy for legible handwriting. Scan quality and lighting play a major role in results.'
  },
  {
    id: 'faq-6',
    question: 'Can I upload handwritten notes?',
    answer: 'Absolutely. The platform is specifically optimized to parse handwritten worksheets, classroom notes, and quizzes.'
  }
];

export const HelpCenterDrawer: React.FC<HelpCenterDrawerProps> = ({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState<HelpView>('main');
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset view when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentView('main');
      setActiveFaq(null);
    }
  }, [isOpen]);

  const toggleFaq = (id: string) => {
    setActiveFaq(prev => prev === id ? null : id);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Drawer Container */}
      <div className={clsx(styles.drawer, styles.slideIn)}>
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className={styles.toast}>
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Drawer Header */}
        <div className={styles.header}>
          {currentView === 'main' ? (
            <div>
              <h2 className={styles.headerTitle}>Help Center</h2>
              <p className={styles.headerSubtitle}>Find guides, tips, FAQs, and support resources.</p>
            </div>
          ) : (
            <button className={styles.backBtn} onClick={() => setCurrentView('main')}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close Help Center">
            <X size={20} />
          </button>
        </div>

        {/* View Switcher Panel Body */}
        <div className={styles.body}>

          {/* MAIN SCREEN VIEW */}
          {currentView === 'main' && (
            <div className={clsx(styles.viewContainer, styles.fadeIn)}>
              <div className={styles.quickActionsGrid}>
                <div className={styles.actionCard} onClick={() => setCurrentView('getting-started')}>
                  <div className={styles.actionIconWrapper} style={{ color: 'var(--primary)' }}>
                    <BookOpen size={20} />
                  </div>
                  <div className={styles.actionBody}>
                    <span className={styles.actionCardTitle}>Getting Started</span>
                    <p className={styles.actionCardDesc}>Learn document upload to download workflow.</p>
                  </div>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>

                <div className={styles.actionCard} onClick={() => setCurrentView('faqs')}>
                  <div className={styles.actionIconWrapper} style={{ color: 'var(--accent-purple)' }}>
                    <HelpCircle size={20} />
                  </div>
                  <div className={styles.actionBody}>
                    <span className={styles.actionCardTitle}>Frequently Asked Questions</span>
                    <p className={styles.actionCardDesc}>Find quick answers to common questions.</p>
                  </div>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>

                <div className={styles.actionCard} onClick={() => setCurrentView('ocr-tips')}>
                  <div className={styles.actionIconWrapper} style={{ color: 'var(--warning)' }}>
                    <Lightbulb size={20} />
                  </div>
                  <div className={styles.actionBody}>
                    <span className={styles.actionCardTitle}>OCR Tips</span>
                    <p className={styles.actionCardDesc}>Achieve the highest quality OCR parsed outputs.</p>
                  </div>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>

                <div className={styles.actionCard} onClick={() => setCurrentView('support')}>
                  <div className={styles.actionIconWrapper} style={{ color: 'var(--success)' }}>
                    <PhoneCall size={20} />
                  </div>
                  <div className={styles.actionBody}>
                    <span className={styles.actionCardTitle}>Contact Support</span>
                    <p className={styles.actionCardDesc}>Get help from our support channels.</p>
                  </div>
                  <ChevronRight size={16} className={styles.chevron} />
                </div>
              </div>
            </div>
          )}

          {/* GETTING STARTED VIEW */}
          {currentView === 'getting-started' && (
            <div className={clsx(styles.viewContainer, styles.fadeIn)}>
              <h3 className={styles.sectionTitle}>Getting Started</h3>
              <div className={styles.workflowTimeline}>
                <div className={styles.workflowStep}>
                  <div className={styles.stepIconWrapper}>
                    <Upload size={16} />
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepTitle}>1. Upload Document</span>
                    <p className={styles.stepDesc}>Drag & drop PDF files or images into the workspace.</p>
                  </div>
                </div>

                <div className={styles.workflowStep}>
                  <div className={styles.stepIconWrapper}>
                    <Eye size={16} />
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepTitle}>2. Read Document</span>
                    <p className={styles.stepDesc}>Our high-fidelity OCR scans and parses handwritings.</p>
                  </div>
                </div>

                <div className={styles.workflowStep}>
                  <div className={styles.stepIconWrapper}>
                    <Edit3 size={16} />
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepTitle}>3. Review OCR</span>
                    <p className={styles.stepDesc}>Double check and edit parsed mistakes side-by-side.</p>
                  </div>
                </div>

                <div className={styles.workflowStep}>
                  <div className={styles.stepIconWrapper}>
                    <FileText size={16} />
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepTitle}>4. Compose HTML Document</span>
                    <p className={styles.stepDesc}>Compile reviewed model blocks into standalone HTML.</p>
                  </div>
                </div>

                <div className={styles.workflowStep}>
                  <div className={styles.stepIconWrapper}>
                    <Sparkles size={16} />
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepTitle}>5. Generate AI Answer Key (Optional)</span>
                    <p className={styles.stepDesc}>Generate structured answer key sheets automatically.</p>
                  </div>
                </div>

                <div className={styles.workflowStep}>
                  <div className={styles.stepIconWrapper}>
                    <Download size={16} />
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepTitle}>6. Download</span>
                    <p className={styles.stepDesc}>Save the finished files directly to your device.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQS VIEW */}
          {currentView === 'faqs' && (
            <div className={clsx(styles.viewContainer, styles.fadeIn)}>
              <h3 className={styles.sectionTitle}>Frequently Asked Questions</h3>
              <div className={styles.accordionContainer}>
                {FAQS.map(faq => (
                  <div key={faq.id} className={styles.accordionCard}>
                    <button 
                      className={styles.accordionHeader} 
                      onClick={() => toggleFaq(faq.id)}
                      aria-expanded={activeFaq === faq.id}
                    >
                      <span>{faq.question}</span>
                      {activeFaq === faq.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <div className={clsx(styles.accordionBody, activeFaq === faq.id && styles.expanded)}>
                      <div className={styles.accordionContent}>
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OCR TIPS VIEW */}
          {currentView === 'ocr-tips' && (
            <div className={clsx(styles.viewContainer, styles.fadeIn)}>
              <h3 className={styles.sectionTitle}>OCR Best Practices</h3>
              <div className={styles.infoCard}>
                <div className={styles.tipItem}>
                  <CheckCircle2 size={16} className={styles.tipIcon} />
                  <span className={styles.tipText}>Use clear handwriting</span>
                </div>
                <div className={styles.tipItem}>
                  <CheckCircle2 size={16} className={styles.tipIcon} />
                  <span className={styles.tipText}>Good lighting</span>
                </div>
                <div className={styles.tipItem}>
                  <CheckCircle2 size={16} className={styles.tipIcon} />
                  <span className={styles.tipText}>Keep pages flat</span>
                </div>
                <div className={styles.tipItem}>
                  <CheckCircle2 size={16} className={styles.tipIcon} />
                  <span className={styles.tipText}>Upload high-resolution images</span>
                </div>
                <div className={styles.tipItem}>
                  <CheckCircle2 size={16} className={styles.tipIcon} />
                  <span className={styles.tipText}>Avoid blurry photos</span>
                </div>
                <div className={styles.tipItem}>
                  <CheckCircle2 size={16} className={styles.tipIcon} />
                  <span className={styles.tipText}>Use supported formats</span>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT SUPPORT VIEW */}
          {currentView === 'support' && (
            <div className={clsx(styles.viewContainer, styles.fadeIn)}>
              <h3 className={styles.sectionTitle}>Contact Support</h3>
              <div className={styles.supportCard}>
                <div className={styles.supportDetail}>
                  <span className={styles.detailLabel}>Support Email</span>
                  <span className={styles.detailValue}>support@example.com</span>
                </div>
                <div className={styles.supportDetail}>
                  <span className={styles.detailLabel}>Working Hours</span>
                  <span className={styles.detailValue}>Monday – Friday, 9:00 AM – 6:00 PM</span>
                </div>
                <div className={styles.supportDetail}>
                  <span className={styles.detailLabel}>Response Time</span>
                  <span className={styles.detailValue}>Within 24 hours</span>
                </div>

                <div className={styles.supportActions}>
                  <Button 
                    variant="secondary" 
                    onClick={() => showToast('Documentation link triggered (UI Only)')}
                  >
                    Documentation
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => showToast('Support email client triggered (UI Only)')}
                  >
                    Email Support
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
