import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Download, 
  Palette, 
  Monitor, 
  Building, 
  Globe, 
  CheckCircle2, 
  LogOut, 
  Key, 
  Camera
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import clsx from 'clsx';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  
  // Theme state
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme-pref') as 'light' | 'dark' | 'system') || 'light';
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('User');
  const [email, setEmail] = useState('user@example.com');
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [department, setDepartment] = useState('Operations');
  const [country, setCountry] = useState('United States');
  const [lang, setLang] = useState('English');

  // Preferences toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [desktopNotif, setDesktopNotif] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState('html');

  // UI status notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme
  useEffect(() => {
    const handleThemeChange = () => {
      const savedPref = localStorage.getItem('theme-pref') as 'light' | 'dark' | 'system';
      if (savedPref) setThemePref(savedPref);
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const handleThemeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as 'light' | 'dark' | 'system';
    setThemePref(selected);
    localStorage.setItem('theme-pref', selected);

    let activeTheme = selected;
    if (selected === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('theme', activeTheme);
    window.dispatchEvent(new Event('theme-change'));
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    showToast('Profile information updated successfully!');
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset values to mock defaults
    setFullName('User');
    setEmail('user@example.com');
    setPhone('+1 (555) 019-2834');
    setDepartment('Operations');
    setCountry('United States');
    setLang('English');
  };

  return (
    <div className={clsx("animate-fade-in", styles.wrapper)}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>
          Manage your account information, security, preferences, and activity.
        </p>
      </div>

      <div className={styles.layoutGrid}>
        {/* Left Column (30%) */}
        <div className={styles.leftCol}>
          <Card className={styles.summaryCard}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarLarge}>
                <span>U</span>
                <button className={styles.changePhotoBtn} title="Change Photo" onClick={() => showToast('Photo upload UI triggered')}>
                  <Camera size={16} />
                </button>
              </div>
              <div className={styles.statusBadgeWrapper}>
                <span className={styles.statusDot} />
                <span className={styles.statusText}>Active Now</span>
              </div>
            </div>

            <div className={styles.profileDetails}>
              <h2 className={styles.userName}>{fullName}</h2>
              <span className={styles.userRole}>Operator</span>
              <span className={styles.orgName}>Enterprise Portal</span>
            </div>

            <div className={styles.metadataList}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Email</span>
                <span className={styles.metaVal}>{email}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Phone</span>
                <span className={styles.metaVal}>{phone}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Member Since</span>
                <span className={styles.metaVal}>January 2026</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Last Login</span>
                <span className={styles.metaVal}>Today, 09:30 AM</span>
              </div>
            </div>

            <div className={styles.summaryActions}>
              <Button 
                variant="primary" 
                style={{ width: '100%' }} 
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
              >
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column (70%) */}
        <div className={styles.rightCol}>
          
          {/* Personal Information (Editable / Read-only cards) */}
          <Card className={styles.sectionCard}>
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              {!isEditing && (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Info
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className={styles.editForm}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Full Name</label>
                    <input 
                      type="text" 
                      className={styles.textInput} 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Email Address</label>
                    <input 
                      type="email" 
                      className={styles.textInput} 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Phone Number</label>
                    <input 
                      type="text" 
                      className={styles.textInput} 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Department</label>
                    <input 
                      type="text" 
                      className={styles.textInput} 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Country</label>
                    <input 
                      type="text" 
                      className={styles.textInput} 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)} 
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Preferred Language</label>
                    <select 
                      className={styles.selectInput}
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button variant="secondary" onClick={handleCancel} type="button">Cancel</Button>
                  <Button variant="primary" type="submit">Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className={styles.readOnlyGrid}>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><User size={14} /> Full Name</span>
                  <span className={styles.roValue}>{fullName}</span>
                </div>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><Mail size={14} /> Email Address</span>
                  <span className={styles.roValue}>{email}</span>
                </div>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><Phone size={14} /> Phone Number</span>
                  <span className={styles.roValue}>{phone}</span>
                </div>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><Shield size={14} /> User Role</span>
                  <span className={styles.roValue}>Operator</span>
                </div>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><Building size={14} /> Department</span>
                  <span className={styles.roValue}>{department}</span>
                </div>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><Building size={14} /> Organization</span>
                  <span className={styles.roValue}>Enterprise Portal</span>
                </div>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><Globe size={14} /> Country</span>
                  <span className={styles.roValue}>{country}</span>
                </div>
                <div className={styles.readOnlyCard}>
                  <span className={styles.roLabel}><Globe size={14} /> Preferred Language</span>
                  <span className={styles.roValue}>{lang}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Account Preferences */}
          <Card className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Account Preferences</h3>
            <div className={styles.preferencesGrid}>
              <div className={styles.prefGroup}>
                <label className={styles.prefLabel}><Palette size={16} /> Theme</label>
                <select 
                  className={styles.selectInput}
                  value={themePref}
                  onChange={handleThemeSelect}
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                  <option value="system">System Theme</option>
                </select>
              </div>

              <div className={styles.prefGroup}>
                <label className={styles.prefLabel}><Download size={16} /> Default Download Format</label>
                <select 
                  className={styles.selectInput}
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                >
                  <option value="html">Standalone HTML (.html)</option>
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="json">Structured Model JSON (.json)</option>
                </select>
              </div>

              <div className={styles.prefGroup}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.prefSublabel}>Email Notifications</span>
                    <p className={styles.prefDesc}>Receive automated alerts when conversions complete.</p>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={emailNotif} 
                      onChange={(e) => setEmailNotif(e.target.checked)} 
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>

              <div className={styles.prefGroup}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.prefSublabel}>Desktop Notifications</span>
                    <p className={styles.prefDesc}>Show system banner notifications on OCR completions.</p>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={desktopNotif} 
                      onChange={(e) => setDesktopNotif(e.target.checked)} 
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>

              <div className={styles.prefGroup}>
                <div className={styles.toggleRow}>
                  <div>
                    <span className={styles.prefSublabel}>Auto Save Progress</span>
                    <p className={styles.prefDesc}>Automatically save document changes while editing text.</p>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={autoSave} 
                      onChange={(e) => setAutoSave(e.target.checked)} 
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Security (Password & Recent Login Sessions) */}
          <Card className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Security Settings</h3>
            
            <div className={styles.passwordSection}>
              <div className={styles.passwordRow}>
                <div>
                  <span className={styles.prefSublabel}>Account Password</span>
                  <p className={styles.roValue} style={{ margin: '4px 0 0 0', letterSpacing: '0.15em' }}>••••••••••••</p>
                </div>
                <Button variant="secondary" icon={<Key size={16} />} onClick={() => showToast('Password change dialog triggered (UI Only)')}>
                  Change Password
                </Button>
              </div>
            </div>

            <div className={styles.sessionsContainer}>
              <span className={styles.prefSublabel} style={{ display: 'block', marginBottom: '12px' }}>
                Recent Login Sessions
              </span>
              
              <div className={styles.sessionsGrid}>
                <div className={styles.sessionCard}>
                  <div className={styles.sessionHeader}>
                    <div className={styles.sessionIconWrapper}>
                      <Monitor size={18} />
                    </div>
                    <div>
                      <div className={styles.sessionAgent}>Chrome • Windows</div>
                      <div className={styles.roValue} style={{ fontSize: '12px', marginTop: '2px' }}>Today, 09:30 AM</div>
                    </div>
                  </div>
                  <Badge variant="green" className={styles.currentDeviceBadge}>Current Device</Badge>
                </div>

                <div className={styles.sessionCard}>
                  <div className={styles.sessionHeader}>
                    <div className={styles.sessionIconWrapper}>
                      <Monitor size={18} />
                    </div>
                    <div>
                      <div className={styles.sessionAgent}>Safari • iOS</div>
                      <div className={styles.roValue} style={{ fontSize: '12px', marginTop: '2px' }}>Yesterday, 04:15 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.tfaSection}>
              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.prefSublabel}>Two-Factor Authentication (2FA)</span>
                  <p className={styles.prefDesc}>Add an extra layer of security to your operations.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="gray">Coming Soon</Badge>
                  <label className={styles.switch} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <input type="checkbox" disabled checked={false} />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Account Status / Overview Section (Replaces Danger Zone) */}
          <Card className={styles.statusCard}>
            <div className={styles.statusSectionRow}>
              <div>
                <h3 className={styles.statusSectionTitle}>Account Status</h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <div className={styles.statusIndicatorBlock}>
                    <span className={styles.roLabel}>Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span className={styles.statusDot} style={{ position: 'static' }} />
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>Active</span>
                    </div>
                  </div>
                  <div className={styles.statusIndicatorBlock}>
                    <span className={styles.roLabel}>Account Type</span>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>Standard Operator</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button 
                  variant="primary" 
                  icon={<LogOut size={16} />}
                  onClick={() => navigate('/login')}
                  style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};
