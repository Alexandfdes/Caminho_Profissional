import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
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
        errorInfo: null,
    };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            Ops! Algo deu errado
                        </h1>

                        <p className="text-slate-400 mb-6">
                            Encontramos um erro inesperado. Não se preocupe, você pode tentar recarregar a página.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left mb-6 bg-slate-900 rounded-lg p-4">
                                <summary className="text-sm text-red-400 cursor-pointer mb-2">
                                    Detalhes do erro (modo desenvolvimento)
                                </summary>
                                <pre className="text-xs text-red-300 overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && (
                                        <>
                                            {'\n\n'}
                                            {this.state.errorInfo.componentStack}
                                        </>
                                    )}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-lg transition-colors"
                            >
                                Tentar novamente
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Voltar ao início
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
