// AI Provider Types
// Shared interfaces for Gemini and OpenAI providers

export interface AIProviderOptions {
    temperature?: number;
    maxOutputTokens?: number;
    maxTokens?: number; // Alias for maxOutputTokens (compatibility)
    images?: string[]; // Base64 encoded images
    jsonMode?: boolean; // If true, request JSON output
}

export type AIProvider = (prompt: string, options?: AIProviderOptions) => Promise<string>;
