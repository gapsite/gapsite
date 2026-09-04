import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary] Uncaught error in view:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-rose-200 shadow-xs max-w-lg mx-auto my-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {this.props.fallbackTitle || 'Gagal Memuat Tampilan Modul'}
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Terjadi kendala saat memuat bagian antarmuka ini. Anda dapat menyegarkan modul ini kembali.
          </p>
          {this.state.error && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left w-full mb-5 overflow-auto max-h-32">
              <code className="text-[11px] text-rose-600 font-mono break-all">
                {this.state.error.message || String(this.state.error)}
              </code>
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Muat Ulang Modul
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
