import { ErrorType, AppError } from '../types/errors';

class ErrorService {
    private isDevelopment = import.meta.env.DEV;

    /**
     * Classifica e processa um erro, retornando um objeto AppError estruturado
     */
    handleError(error: unknown, context?: string): AppError {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Classificar tipo de erro
        const errorType = this.classifyError(errorMessage);

        // Gerar mensagem amigável
        const friendlyMessage = this.getFriendlyMessage(errorType, errorMessage);

        // Determinar se é retryable
        const retryable = this.isRetryable(errorType);

        const appError: AppError = {
            type: errorType,
            message: friendlyMessage,
            originalError: error instanceof Error ? error : undefined,
            retryable,
            technicalDetails: this.isDevelopment ? errorMessage : undefined,
        };

        // Log em desenvolvimento
        if (this.isDevelopment) {
            console.error(`[ErrorService] ${context || 'Error'}:`, {
                type: errorType,
                message: friendlyMessage,
                original: error,
            });
        }

        return appError;
    }

    /**
     * Classifica o tipo de erro baseado na mensagem
     */
    private classifyError(message: string): ErrorType {
        const lowerMessage = message.toLowerCase();

        if (
            lowerMessage.includes('network') ||
            lowerMessage.includes('fetch') ||
            lowerMessage.includes('conexão') ||
            lowerMessage.includes('offline')
        ) {
            return ErrorType.NETWORK;
        }

        if (
            lowerMessage.includes('api key') ||
            lowerMessage.includes('chave de api') ||
            lowerMessage.includes('invalid key') ||
            lowerMessage.includes('quota') ||
            lowerMessage.includes('rate limit')
        ) {
            return ErrorType.API;
        }

        if (
            lowerMessage.includes('não autenticado') ||
            lowerMessage.includes('not authenticated') ||
            lowerMessage.includes('login') ||
            lowerMessage.includes('unauthorized') ||
            lowerMessage.includes('session')
        ) {
            return ErrorType.AUTHENTICATION;
        }

        if (
            lowerMessage.includes('validação') ||
            lowerMessage.includes('validation') ||
            lowerMessage.includes('invalid')
        ) {
            return ErrorType.VALIDATION;
        }

        return ErrorType.UNKNOWN;
    }

    /**
     * Gera mensagem amigável baseada no tipo de erro
     */
    private getFriendlyMessage(type: ErrorType, originalMessage: string): string {
        switch (type) {
            case ErrorType.NETWORK:
                return 'Parece que você está sem conexão. Verifique sua internet e tente novamente.';

            case ErrorType.API:
                if (originalMessage.includes('quota') || originalMessage.includes('rate limit')) {
                    return 'Muitas requisições foram feitas. Por favor, aguarde alguns minutos e tente novamente.';
                }
                return 'Estamos com dificuldades para processar sua solicitação. Tente novamente em instantes.';

            case ErrorType.AUTHENTICATION:
                return 'Você precisa estar logado para realizar esta ação. Faça login e tente novamente.';

            case ErrorType.VALIDATION:
                return originalMessage; // Mensagens de validação geralmente já são amigáveis

            case ErrorType.UNKNOWN:
            default:
                return 'Algo deu errado. Por favor, tente novamente.';
        }
    }

    /**
     * Determina se o erro pode ser resolvido com retry
     */
    private isRetryable(type: ErrorType): boolean {
        return type === ErrorType.NETWORK || type === ErrorType.API;
    }

    /**
     * Executa uma função com retry automático
     */
    async withRetry<T>(
        fn: () => Promise<T>,
        maxRetries: number = 2,
        delayMs: number = 1000
    ): Promise<T> {
        let lastError: unknown;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                const appError = this.handleError(error, `Attempt ${attempt + 1}/${maxRetries + 1}`);

                // Não fazer retry se não for retryable
                if (!appError.retryable) {
                    throw error;
                }

                // Se não for a última tentativa, aguardar antes de tentar novamente
                if (attempt < maxRetries) {
                    await this.delay(delayMs * (attempt + 1)); // Backoff exponencial
                }
            }
        }

        throw lastError;
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const errorService = new ErrorService();
