import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Global Error Boundary
 *
 * Catches unhandled React render errors and displays a fallback UI
 * instead of crashing the entire application.
 *
 * BACKEND INTEGRATION: Connect the "Report Issue" action to a POST /api/errors
 * endpoint to log client-side crash reports to the backend.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // BACKEND INTEGRATION: Send error + info to your error tracking service
    // e.g. Sentry, Datadog, or POST /api/errors
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app, #f8fafc)',
          padding: '32px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}>⚠️</div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary, #0f172a)',
            marginBottom: '8px',
          }}>
            Something went wrong
          </h1>

          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #64748b)',
            marginBottom: '24px',
            maxWidth: '400px',
            lineHeight: '1.6',
          }}>
            An unexpected error occurred. Please reload the page to continue.
            If this problem persists, contact your system administrator.
          </p>

          {this.state.error && (
            <pre style={{
              fontSize: '12px',
              color: 'var(--danger, #ef4444)',
              backgroundColor: 'var(--bg-danger, #fef2f2)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              maxWidth: '560px',
              width: '100%',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReload}
            style={{
              backgroundColor: 'var(--primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
