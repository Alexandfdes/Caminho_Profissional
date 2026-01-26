/**
 * Type definitions for API usage monitoring system
 */

export type RequestType = 'question' | 'careers' | 'plan' | 'cv' | 'chat' | 'explore' | 'cv_enhance';

export interface RequestLog {
    timestamp: number;
    type: RequestType;
    tokensUsed?: number;
    cost?: number;
}

export interface UsageStats {
    dailyRequests: number;
    dailyLimit: number;
    estimatedCost: number;
    requestsByType: Record<RequestType, number>;
    lastReset: string; // ISO date string
    history: RequestLog[];
}

export interface UsageThresholds {
    warning: number; // 0-1 (e.g., 0.8 = 80%)
    critical: number; // 0-1 (e.g., 0.95 = 95%)
}

export type UsageStatus = 'ok' | 'warning' | 'critical' | 'exceeded';
