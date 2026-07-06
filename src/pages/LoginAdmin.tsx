import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export const LoginAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await login(email, password);
    if (result.success) {
      // Verify the logged-in user is actually an Admin
      const raw = localStorage.getItem('titus_auth_user');
      const user = raw ? JSON.parse(raw) : null;
      if (user?.role !== 'Admin') {
        setError('This portal is for administrators only. Please use the Document Portal.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.leftPane} style={{ backgroundColor: 'var(--accent-purple-dark)' }}>
        <div className={styles.brandContainer}>
          <div className={styles.brandLogo} style={{ background: 'transparent', padding: 0 }}>
            <img src="/logo.png" alt="Titus Logo" style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
          </div>
          <h1 className={styles.brandTitle}>TITUS<br/>Administration</h1>
          <p className={styles.brandDescription}>
            Manage users, documents, categories and system configurations securely.
          </p>
        </div>
      </div>

      <div className={styles.rightPane}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <Card className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <Shield size={32} color="var(--accent-purple)" />
              </div>
              <h2 className={styles.cardTitle}>Administrator Sign In</h2>
              <p className={styles.cardSubtitle}>Enter your admin credentials.</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {error && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="admin@titus.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                rightElement={
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                style={{ width: '100%', marginTop: 'var(--space-8)', backgroundColor: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
              >
                Sign In as Admin
              </Button>
            </form>
          </Card>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-24)' }}>
            <Link
              to="/login"
              style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
            >
              <ArrowLeft size={16} /> Back to Portal Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
