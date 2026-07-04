import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  Globe,
  Bell,
  HardDrive,
  BrainCircuit,
  Shield,
  Palette,
  ScanText,
  Info,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { triggerToast } from '../../components/ui/ToastContainer';
import clsx from 'clsx';
import styles from './AdminSettings.module.css';

const TABS = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'limits', label: 'Upload Limits', icon: <HardDrive size={18} /> },
  { id: 'ai', label: 'AI Features', icon: <BrainCircuit size={18} /> },
  { id: 'ocr', label: 'OCR Config', icon: <ScanText size={18} /> },
  { id: 'languages', label: 'Languages', icon: <Globe size={18} /> },
  { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Appearance States
  const [adminTheme, setAdminTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [sidebarDefault, setSidebarDefault] = useState('expanded');
  
  // Notification States
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/...');
  
  // OCR States
  const [ocrThreshold, setOcrThreshold] = useState(85);
  const [autoRotate, setAutoRotate] = useState(true);

  // Limits state
  const [maxFileSize, setMaxFileSize] = useState('50');

  // AI state
  const [defaultAiModel, setDefaultAiModel] = useState('Titus-Vision-v2');

  // Security States
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [mfaRequired, setMfaRequired] = useState(false);

  const handleAdminThemeChange = (newTheme: string) => {
    setAdminTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    triggerToast('success', 'Theme Changed', `System theme set to ${newTheme}`);
  };

  const handleSaveChanges = () => {
    triggerToast('success', 'Settings Saved', 'All configuration modifications have been saved successfully!');
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>Configure platform-wide settings and preferences.</p>
        </div>
        <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
      </div>

      <div className={styles.layoutGrid}>
        <div className={styles.sidebar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={clsx(styles.tabBtn, activeTab === tab.id && styles.activeTab)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          <Card className={styles.settingsCard}>
            
            {/* GENERAL */}
            {activeTab === 'general' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>General Settings</h3>
                <p className={styles.sectionDescription}>Manage your application's basic configuration and system status.</p>
                
                <div className={styles.formGrid}>
                  <Input label="Application Name" defaultValue="TITUS Document Intelligence" />
                  <Input label="Support Email" defaultValue="support@titus.com" />
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Timezone</label>
                    <select className={styles.select}>
                      <option>Coordinated Universal Time (UTC)</option>
                      <option>Eastern Standard Time (EST)</option>
                      <option>Pacific Standard Time (PST)</option>
                    </select>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Language</label>
                    <select className={styles.select}>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
 
                  <div className={styles.switchGroup}>
                    <div className={styles.switchLabel}>
                      <strong>Maintenance Mode</strong>
                      <p>Disable user access while performing upgrades.</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>System Version</span>
                    <span className={styles.infoValue}>1.0.0</span>
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Appearance Settings</h3>
                <p className={styles.sectionDescription}>Control global console styling, default portal themes, and sidebar styles.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Console Theme Mode</label>
                    <div style={{ display: 'flex', gap: 'var(--space-16)', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="admin-theme" 
                          checked={adminTheme === 'light'} 
                          onChange={() => handleAdminThemeChange('light')} 
                        />
                        <span>Light Mode</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="admin-theme" 
                          checked={adminTheme === 'dark'} 
                          onChange={() => handleAdminThemeChange('dark')} 
                        />
                        <span>Dark Mode</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Sidebar default state</label>
                    <select 
                      className={styles.select} 
                      value={sidebarDefault} 
                      onChange={(e) => { setSidebarDefault(e.target.value); triggerToast('info', 'Preference Changed', 'Sidebar default state updated.'); }}
                    >
                      <option value="expanded">Expanded Menu</option>
                      <option value="collapsed">Icons Only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>System Notifications</h3>
                <p className={styles.sectionDescription}>Configure SMTP details, Slack notifications, and webhook alerts.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.switchGroup}>
                    <div className={styles.switchLabel}>
                      <strong>Critical System Alerts</strong>
                      <p>Send immediate notifications on conversion cluster failures.</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={systemAlerts} 
                        onChange={(e) => setSystemAlerts(e.target.checked)} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <Input 
                    label="Slack Integration Webhook" 
                    value={slackWebhook} 
                    onChange={(e) => setSlackWebhook(e.target.value)} 
                  />
                </div>
              </div>
            )}

            {/* LIMITS */}
            {activeTab === 'limits' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Upload Limits</h3>
                <p className={styles.sectionDescription}>Configure restrictions for document uploads.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Max File Size (MB)</label>
                    <select className={styles.select} value={maxFileSize} onChange={e => setMaxFileSize(e.target.value)}>
                      <option value="10">10 MB</option>
                      <option value="50">50 MB</option>
                      <option value="100">100 MB</option>
                      <option value="250">250 MB</option>
                    </select>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Allowed File Types</label>
                    <input type="text" className={styles.input} defaultValue="pdf, jpg, png, webp, tiff" />
                  </div>
                </div>
              </div>
            )}

            {/* AI FEATURES */}
            {activeTab === 'ai' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>AI Features</h3>
                <p className={styles.sectionDescription}>Configure AI models and automation features.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.switchGroup}>
                    <div className={styles.switchLabel}>
                      <strong>Auto-categorization</strong>
                      <p>Automatically predict document categories upon upload.</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.switchGroup}>
                    <div className={styles.switchLabel}>
                      <strong>AI Answer Key Generation</strong>
                      <p>Allow generation of answer keys from question papers.</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Default AI Model</label>
                    <select className={styles.select} value={defaultAiModel} onChange={e => setDefaultAiModel(e.target.value)}>
                      <option value="Titus-Vision-v2">Titus-Vision-v2</option>
                      <option value="Titus-Vision-v1">Titus-Vision-v1</option>
                      <option value="GPT-4o">GPT-4o</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* OCR CONFIG */}
            {activeTab === 'ocr' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>OCR Configuration</h3>
                <p className={styles.sectionDescription}>Adjust extraction confidence metrics and parser rules.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Confidence Threshold: {ocrThreshold}%</label>
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      value={ocrThreshold} 
                      onChange={(e) => setOcrThreshold(Number(e.target.value))} 
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Flags words below this value for reviewer verification.
                    </span>
                  </div>

                  <div className={styles.switchGroup}>
                    <div className={styles.switchLabel}>
                      <strong>Automatic Skew Correction</strong>
                      <p>Correct image rotations during processing runs.</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={autoRotate} 
                        onChange={(e) => setAutoRotate(e.target.checked)} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* LANGUAGES */}
            {activeTab === 'languages' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Supported OCR Languages</h3>
                <p className={styles.sectionDescription}>Enable or disable translation dictionaries for OCR indexing.</p>
                
                <div className={styles.formGrid}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked /> English
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked /> Spanish
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked /> French
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" /> German
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Security Policies</h3>
                <p className={styles.sectionDescription}>Manage authentication policies, sessions, and multi-factor mandates.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Inactivity Session Timeout (Minutes)</label>
                    <select 
                      className={styles.select} 
                      value={sessionTimeout} 
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>

                  <div className={styles.switchGroup}>
                    <div className={styles.switchLabel}>
                      <strong>Enforce Multi-Factor Auth (MFA)</strong>
                      <p>Require MFA for all system operator roles.</p>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={mfaRequired} 
                        onChange={(e) => setMfaRequired(e.target.checked)} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ABOUT */}
            {activeTab === 'about' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Platform Metadata</h3>
                <p className={styles.sectionDescription}>Details regarding the system architecture and active nodes.</p>
                
                <div className={styles.formGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Product Build Version</span>
                    <span className={styles.infoValue}>titus-core-v1.0.0-beta.4</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Database Mode</span>
                    <span className={styles.infoValue}>Multi-Node Cluster</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>OCR Engine Node</span>
                    <span className={styles.infoValue}>Titus-Vision-T4-AWS</span>
                  </div>
                </div>
              </div>
            )}

          </Card>
        </div>
      </div>
    </div>
  );
};
