import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.search = '';
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '32px 16px',
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 16,
            }}
          >
            <span className="material-symbols-outlined">warning</span>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>
            Application Encountered an Unexpected Error
          </h2>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, marginBottom: 20 }}>
            An unexpected error occurred while rendering the data grid. You can reload the application
            with default parameters.
          </p>

          {this.state.error && (
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                background: 'var(--surface-container)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                maxWidth: 520,
                overflowX: 'auto',
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 16px',
              background: 'var(--text-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              restart_alt
            </span>
            Reset to Defaults & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
