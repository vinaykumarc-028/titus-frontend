import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { triggerToast } from '../components/ui/ToastContainer';
import styles from './Login.module.css';

export const LoginDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering) {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            role: 'Operator'
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Registration failed.');
        }

        triggerToast('success', 'Registration Successful', 'Welcome to TITUS! Signing in...');
        
        // Log in immediately
        const loginResult = await login(email, password);
        if (loginResult.success) {
          navigate(from, { replace: true });
        } else {
          setError('Registered successfully, but sign-in failed. Please login manually.');
          setIsRegistering(false);
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed.');
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Login failed.');
      }
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.leftPane}>
        <div className={styles.brandContainer}>
          <div className={styles.brandLogo} style={{ background: 'transparent' }}>
            <img src="/logo.png" alt="Titus Logo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <h1 className={styles.brandTitle}>TITUS<br/>Solutions</h1>
          <p className={styles.brandDescription}>
            AI-powered reading platform for handwritten examination papers.
          </p>
        </div>
      </div>

      <div className={styles.rightPane}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <Card className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Document Portal</h2>
              <p className={styles.cardSubtitle}>
                {isRegistering ? 'Create a new operator account.' : 'Sign in to your operator account.'}
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {error && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {isRegistering && (
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="operator@titus.com"
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
                style={{ width: '100%', marginTop: 'var(--space-8)' }}
              >
                {isRegistering ? 'Sign Up' : 'Sign In'}
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-16)', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {isRegistering ? (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => { setIsRegistering(false); setError(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => { setIsRegistering(true); setError(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
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
