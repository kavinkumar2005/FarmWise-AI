import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in React tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-emerald-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-white text-gray-900 rounded-2xl shadow-2xl p-8 border border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-2xl">
                ⚠
              </div>
              <div>
                <h1 className="text-xl font-black text-red-700">UI Rendering Issue Detected</h1>
                <p className="text-xs text-gray-500">FarmwiseAI Client Safety Boundary</p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-3 text-xs font-mono text-red-800 mb-4 overflow-x-auto max-h-48 border border-gray-200">
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#0F3D26] hover:bg-[#1E5638] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
