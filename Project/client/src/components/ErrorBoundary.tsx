import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  isRoot?: boolean;
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
    console.error('[ShopGrow ErrorBoundary] Caught exception:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className={`flex flex-col items-center justify-center p-8 text-center ${
          this.props.isRoot ? 'min-h-screen bg-slate-950 text-white' : 'min-h-[400px] bg-slate-900/50 rounded-2xl border border-slate-800 m-4'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/5 animate-pulse">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Temporary View Notice'}
          </h2>

          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            A temporary component error occurred, but your session and data are secure. Click below to refresh this view immediately.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry This View</span>
            </button>

            {this.props.isRoot && (
              <button
                onClick={this.handleHome}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition flex items-center space-x-2 active:scale-95 border border-slate-700"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}