import React from 'react';
import { AppError, ErrorType } from '../types/errors';

interface ErrorAlertProps {
    error: AppError | string | null;
    onRetry?: () => void;
    onDismiss?: () => void;
    className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
    error,
    onRetry,
    onDismiss,
    className = ''
}) => {
    if (!error) return null;

    const appError: AppError = typeof error === 'string'
        ? { type: ErrorType.UNKNOWN, message: error, retryable: false }
        : error;

    const getIcon = () => {
        switch (appError.type) {
            case ErrorType.NETWORK:
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                );
            case ErrorType.AUTHENTICATION:
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <div className={`bg-red-900/50 border border-red-800 rounded-lg p-4 animate-fade-in ${className}`}>
            <div className="flex items-start gap-3">
                <div className="text-red-400 flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-red-200 text-sm font-medium leading-relaxed">
                        {appError.message}
                    </p>

                    {appError.technicalDetails && (
                        <details className="mt-2">
                            <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                                Detalhes técnicos
                            </summary>
                            <p className="text-xs text-red-300 mt-1 font-mono bg-red-950/50 p-2 rounded">
                                {appError.technicalDetails}
                            </p>
                        </details>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {appError.retryable && onRetry && (
                        <button
                            onClick={onRetry}
                            className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors font-medium"
                        >
                            Tentar novamente
                        </button>
                    )}

                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="text-red-400 hover:text-red-200 transition-colors"
                            aria-label="Fechar"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
