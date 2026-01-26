export enum ErrorType {
    NETWORK = 'NETWORK',
    API = 'API',
    AUTHENTICATION = 'AUTHENTICATION',
    VALIDATION = 'VALIDATION',
    UNKNOWN = 'UNKNOWN',
}

export interface AppError {
    type: ErrorType;
    message: string;
    originalError?: Error;
    retryable: boolean;
    technicalDetails?: string;
}

export interface ErrorHandlerOptions {
    showTechnicalDetails?: boolean;
    onRetry?: () => void;
    autoRetry?: boolean;
    maxRetries?: number;
}
