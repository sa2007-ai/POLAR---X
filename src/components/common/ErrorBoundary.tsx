import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[POLAR-X Runtime Crash Caught by ErrorBoundary]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-400 flex-shrink-0">
                <AlertOctagon className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white uppercase font-sans tracking-wide">
                  {this.props.fallbackTitle || 'Polar-X Operational Subsystem Exception'}
                </h1>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  A runtime component exception was intercepted. Telemetry data integrity preserved.
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                <span className="font-bold text-rose-200">Error: </span>
                {this.state.error?.message || 'Unknown runtime error'}
              </div>

              {this.state.error?.stack && (
                <div className="max-h-48 overflow-y-auto p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 whitespace-pre-wrap">
                  {this.state.error.stack}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Subsystem</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
