// AI Provider Types
// Shared interfaces for Gemini and OpenAI providers

export interface AIProviderOptions {
    temperature?: number;
    maxOutputTokens?: number;
    images?: string[]; // Base64 encoded images
}

export type AIProvider = (prompt: string, options?: AIProviderOptions) => Promise<string>;
