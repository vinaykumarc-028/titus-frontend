import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import clsx from 'clsx';

export const GeneratingDocument: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/success');
    }, 1600);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={clsx('animate-fade-in')} style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center' }}>
      <Card style={{ padding: 'var(--space-48)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-24)' }}>
        <div style={{ position: 'relative' }}>
          <FileCheck size={64} color="var(--primary)" />
          <Loader2 size={32} color="var(--primary)" className="animate-spin" style={{ position: 'absolute', bottom: '-10px', right: '-10px', backgroundColor: 'var(--bg-app)', borderRadius: '50%' }} />
        </div>

        <div>
          <h2 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-8)' }}>Generating Structured Document</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Composing the reviewed examination model into standalone HTML...</p>
        </div>
      </Card>
    </div>
  );
};
