import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '36px', borderRadius: '24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 90, 54, 0.16)', color: 'var(--ember)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '10px' }}>Cinema Engine Interrupted</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
              An unexpected interface error occurred. You can reload the page to restart the recommendation dashboard.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                color: '#ff8a73',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
                fontFamily: 'var(--font-mono)'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button className="btn-primary" onClick={this.handleReload}>
              <RefreshCw size={16} />
              <span>Reload CineAI</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
