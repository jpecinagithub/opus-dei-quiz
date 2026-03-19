import React, { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = i18n.t('errors.unexpected');
      try {
        const parsed = JSON.parse(this.state.error?.message || '');
        if (parsed.error) {
          errorMessage = i18n.t('errors.db', { error: parsed.error });
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-800 p-4">
          <div className="bg-stone-50 dark:bg-stone-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-stone-300 dark:border-stone-600">
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200 mb-4">{i18n.t('errors.title')}</h2>
            <p className="text-stone-600 dark:text-stone-300 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              {i18n.t('errors.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
