import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  viewName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error(`[ErrorBoundary${this.props.viewName ? ` - ${this.props.viewName}` : ''}] Uncaught error:`, error, errorInfo);
  }

  public handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const viewTitle = this.props.viewName ? ` in ${this.props.viewName}` : '';

      return (
        <div className="min-h-[400px] h-full w-full p-6 flex flex-col justify-start bg-[#0b0f19] text-amber-300 font-mono select-text">
          <div className="max-w-5xl w-full mx-auto bg-[#101623] border border-rose-900/60 rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-rose-400">
                  View Execution Crash{viewTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs transition-colors cursor-pointer"
              >
                Retry View
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-rose-300 font-semibold tracking-wide">
                Error Message:
              </div>
              <div className="p-3 bg-[#080b12] border border-rose-950 rounded text-xs text-rose-200 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                {error?.message || String(error) || 'Unknown runtime error encountered'}
              </div>
            </div>

            {errorInfo?.componentStack && (
              <div className="space-y-2">
                <div className="text-xs text-amber-400 font-semibold tracking-wide">
                  Component Stack:
                </div>
                <pre className="p-3 bg-[#080b12] border border-slate-800 rounded text-[11px] text-amber-200/90 overflow-auto max-h-72 whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}

            {error?.stack && !errorInfo?.componentStack && (
              <div className="space-y-2">
                <div className="text-xs text-amber-400 font-semibold tracking-wide">
                  Call Stack:
                </div>
                <pre className="p-3 bg-[#080b12] border border-slate-800 rounded text-[11px] text-amber-200/90 overflow-auto max-h-72 whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                  {error?.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
