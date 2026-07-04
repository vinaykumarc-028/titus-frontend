import React, { useState } from 'react';
import { Box, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // BACKEND INTEGRATION: Replace setTimeout with POST /api/auth/login
    // On success: navigate('/')
    // On failure: setError('Invalid credentials')
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };


  return (
    <div className={styles.loginWrapper}>
      <div className={styles.leftPane}>
        <div className={styles.brandContainer}>
          <div className={styles.brandLogo}>
            <Box size={48} color="#FFFFFF" />
          </div>
          <h1 className={styles.brandTitle}>TITUS<br/>Solutions</h1>
          <p className={styles.brandDescription}>
            AI-powered reading platform for handwritten examination papers.
          </p>
        </div>
      </div>
      <div className={styles.rightPane}>
        <Card className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Welcome Back</h2>
            <p className={styles.cardSubtitle}>Please enter your details to sign in.</p>
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
              placeholder="operator@titus.com" 
              required 
            />
            
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••" 
              required 
              labelRight={<button type="button" className={styles.forgotPassword}>Forgot password?</button>}
              rightElement={
                <button 
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            
            <div className={styles.optionsRow}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" className={styles.checkbox} />
                Remember me
              </label>
            </div>
            
            <Button 
              type="submit" 
              variant="primary" 
              loading={isLoading} 
              style={{ width: '100%', marginTop: 'var(--space-8)' }}
            >
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
