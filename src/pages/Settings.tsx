import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Globe, 
  HelpCircle, 
  Info,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { triggerToast } from '../components/ui/ToastContainer';
import clsx from 'clsx';
import styles from './Settings.module.css';

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'language' | 'help' | 'about';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Form States
  const [appName, setAppName] = useState('TITUS Document Intelligence');
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);
  const [desktopNotif, setDesktopNotif] = useState(true);
  const [lang, setLang] = useState('en');

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    triggerToast('success', 'Theme Updated', `Switched to ${newTheme} mode.`);
  };

  useEffect(() => {
    const syncTheme = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('theme-change', syncTheme);
    return () => window.removeEventListener('theme-change', syncTheme);
  }, []);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'language', label: 'Language', icon: <Globe size={18} /> },
    { id: 'help', label: 'Help', icon: <HelpCircle size={18} /> },
    { id: 'about', label: 'About', icon: <Info size={18} /> },
  ];

  return (
    <div className={clsx("animate-fade-in", styles.container)}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account and application preferences.</p>
      </div>
      
      <div className={styles.settingsLayout}>
        <aside className={styles.sidebar}>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              className={clsx(styles.navItem, activeTab === tab.id && styles.active)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        <main className={styles.content}>
          <Card className={clsx("animate-fade-in", styles.sectionCard)}>
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div>
                <div className={styles.sectionHeader}>
                  <SettingsIcon size={24} style={{ color: 'var(--primary)' }} />
                  <h2 className={styles.sectionTitle}>General</h2>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Application Title</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={appName} 
                    onChange={(e) => setAppName(e.target.value)} 
                  />
                </div>

                <div className={styles.switchRow}>
                  <div className={styles.switchLabelBlock}>
                    <span className={styles.switchTitle}>Auto-save Progress</span>
                    <span className={styles.switchDesc}>Automatically save document changes while editing.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoSave} 
                    onChange={(e) => setAutoSave(e.target.checked)} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div className={styles.switchRow}>
                  <div className={styles.switchLabelBlock}>
                    <span className={styles.switchTitle}>Sound Effects</span>
                    <span className={styles.switchDesc}>Play alert tones on workflow completion.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={soundEffects} 
                    onChange={(e) => setSoundEffects(e.target.checked)} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ marginTop: 'var(--space-24)' }}>
                  <Button variant="primary" onClick={() => triggerToast('success', 'Settings Saved', 'General settings have been updated.')}>
                    Save General Settings
                  </Button>
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div>
                <div className={styles.sectionHeader}>
                  <Palette size={24} style={{ color: 'var(--primary)' }} />
                  <h2 className={styles.sectionTitle}>Appearance</h2>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)', marginBottom: 'var(--space-16)' }}>
                  Customize the visual look and theme mode of the platform.
                </p>

                <div className={styles.themeGrid}>
                  <div 
                    className={clsx(styles.themeCard, theme === 'light' && styles.themeCardActive)}
                    onClick={() => handleThemeChange('light')}
                  >
                    <div className={styles.themePreview} style={{ backgroundColor: '#F8FAFC' }}>
                      <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px' }} />
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '40px', height: '14px', backgroundColor: '#3B82F6', borderRadius: '4px' }} />
                    </div>
                    <span className={styles.themeLabel}>Light Mode</span>
                  </div>

                  <div 
                    className={clsx(styles.themeCard, theme === 'dark' && styles.themeCardActive)}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <div className={styles.themePreview} style={{ backgroundColor: '#0F172A' }}>
                      <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '8px', backgroundColor: '#334155', borderRadius: '4px' }} />
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '40px', height: '14px', backgroundColor: '#3B82F6', borderRadius: '4px' }} />
                    </div>
                    <span className={styles.themeLabel}>Dark Mode</span>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div>
                <div className={styles.sectionHeader}>
                  <Bell size={24} style={{ color: 'var(--primary)' }} />
                  <h2 className={styles.sectionTitle}>Notifications</h2>
                </div>
                
                <div className={styles.switchRow}>
                  <div className={styles.switchLabelBlock}>
                    <span className={styles.switchTitle}>Weekly Activity Email Digest</span>
                    <span className={styles.switchDesc}>Receive a summary report of all document scans and edits.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={emailDigest} 
                    onChange={(e) => setEmailDigest(e.target.checked)} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div className={styles.switchRow}>
                  <div className={styles.switchLabelBlock}>
                    <span className={styles.switchTitle}>Desktop Alert Popups</span>
                    <span className={styles.switchDesc}>Show in-app notification alerts upon document processing status updates.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={desktopNotif} 
                    onChange={(e) => setDesktopNotif(e.target.checked)} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ marginTop: 'var(--space-24)' }}>
                  <Button variant="primary" onClick={() => triggerToast('success', 'Settings Saved', 'Notification preferences have been updated.')}>
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            )}

            {/* LANGUAGE TAB */}
            {activeTab === 'language' && (
              <div>
                <div className={styles.sectionHeader}>
                  <Globe size={24} style={{ color: 'var(--primary)' }} />
                  <h2 className={styles.sectionTitle}>Language</h2>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)', marginBottom: 'var(--space-16)' }}>
                  Select the primary language displayed in the workspace interface.
                </p>

                <div className={styles.formGroup}>
                  <select 
                    className={styles.input} 
                    value={lang} 
                    onChange={(e) => { setLang(e.target.value); triggerToast('success', 'Language Updated', 'Interface language has been changed.'); }}
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español (Coming Soon)</option>
                    <option value="fr">Français (Coming Soon)</option>
                  </select>
                </div>
              </div>
            )}

            {/* HELP TAB */}
            {activeTab === 'help' && (
              <div>
                <div className={styles.sectionHeader}>
                  <HelpCircle size={24} style={{ color: 'var(--primary)' }} />
                  <h2 className={styles.sectionTitle}>Help</h2>
                </div>
                
                <div className={styles.helpGrid}>
                  <a href="#" className={styles.helpLinkCard} onClick={(e) => { e.preventDefault(); triggerToast('info', 'Opening Guide', 'Redirecting to user documentation...'); }}>
                    <span>User Documentation & Guide</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="#" className={styles.helpLinkCard} onClick={(e) => { e.preventDefault(); triggerToast('info', 'Contacting Support', 'Opening support ticket form...'); }}>
                    <span>Contact Technical Support</span>
                    <ChevronRight size={16} />
                  </a>
                  <a href="#" className={styles.helpLinkCard} onClick={(e) => { e.preventDefault(); triggerToast('info', 'Reporting Issue', 'Opening bug report dialog...'); }}>
                    <span>Report a System Issue</span>
                    <ChevronRight size={16} />
                  </a>
                </div>
              </div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div>
                <div className={styles.sectionHeader}>
                  <Info size={24} style={{ color: 'var(--primary)' }} />
                  <h2 className={styles.sectionTitle}>About</h2>
                </div>
                
                <div className={styles.metaGrid}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Product Name</span>
                    <span className={styles.metaValue}>TITUS Document Intelligence</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Version</span>
                    <span className={styles.metaValue}>v1.0.0-beta.4</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Build Version</span>
                    <span className={styles.metaValue}>2026.06.28.1</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>License Status</span>
                    <span className={styles.metaValue} style={{ color: 'var(--success)' }}>Active (Enterprise)</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Target Node</span>
                    <span className={styles.metaValue}>us-east-1</span>
                  </div>
                </div>
              </div>
            )}

          </Card>
        </main>
      </div>
    </div>
  );
};
