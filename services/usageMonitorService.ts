/**
 * Service for monitoring and tracking API usage for Google Gemini
 * Tracks daily requests, estimates costs, and monitors limits
 */

import { RequestLog, UsageStats, UsageStatus, RequestType } from '../types/usage';
import { API_LIMITS, PRICING } from '../constants';

const STORAGE_KEY = 'gemini_usage_stats';

class UsageMonitorService {
    /**
     * Initialize or retrieve usage stats from localStorage
     */
    private getStats(): UsageStats {
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
            const stats: UsageStats = JSON.parse(stored);

            // Check if we need to reset (new day)
            const lastReset = new Date(stats.lastReset);
            const now = new Date();

            if (this.isDifferentDay(lastReset, now)) {
                return this.createFreshStats();
            }

            return stats;
        }

        return this.createFreshStats();
    }

    /**
     * Create fresh stats object
     */
    private createFreshStats(): UsageStats {
        return {
            dailyRequests: 0,
            dailyLimit: API_LIMITS.FREE_TIER_DAILY,
            estimatedCost: 0,
            requestsByType: {
                question: 0,
                careers: 0,
                plan: 0,
                cv: 0,
                chat: 0,
                explore: 0,
                cv_enhance: 0,
            },
            lastReset: new Date().toISOString(),
            history: [],
        };
    }

    /**
     * Check if two dates are on different days
     */
    private isDifferentDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() !== date2.getFullYear() ||
            date1.getMonth() !== date2.getMonth() ||
            date1.getDate() !== date2.getDate()
        );
    }

    /**
     * Save stats to localStorage
     */
    private saveStats(stats: UsageStats): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }

    /**
     * Estimate cost for a request type based on average tokens
     */
    private estimateCost(type: RequestType): number {
        let avgTokens: number;

        switch (type) {
            case 'question':
                avgTokens = PRICING.AVG_TOKENS_QUESTION;
                break;
            case 'careers':
                avgTokens = PRICING.AVG_TOKENS_CAREERS;
                break;
            case 'plan':
                avgTokens = PRICING.AVG_TOKENS_PLAN;
                break;
            case 'cv':
                avgTokens = PRICING.AVG_TOKENS_CV;
                break;
            case 'chat':
                avgTokens = PRICING.AVG_TOKENS_CHAT;
                break;
            case 'explore':
                avgTokens = PRICING.AVG_TOKENS_EXPLORE;
                break;
            case 'cv_enhance':
                avgTokens = 4500; // Estimated
                break;
            default:
                avgTokens = 1500;
        }

        // Assume 60% input, 40% output for cost calculation
        const inputTokens = avgTokens * 0.6;
        const outputTokens = avgTokens * 0.4;

        return (
            inputTokens * PRICING.GEMINI_FLASH_INPUT +
            outputTokens * PRICING.GEMINI_FLASH_OUTPUT
        );
    }

    /**
     * Track a new API request
     */
    public trackRequest(type: RequestType, tokensUsed?: number): void {
        const stats = this.getStats();

        // Increment counters
        stats.dailyRequests++;
        stats.requestsByType[type]++;

        // Calculate cost
        const cost = tokensUsed
            ? tokensUsed * PRICING.GEMINI_FLASH_OUTPUT // Simplified if we have actual tokens
            : this.estimateCost(type);

        stats.estimatedCost += cost;

        // Add to history
        const log: RequestLog = {
            timestamp: Date.now(),
            type,
            tokensUsed,
            cost,
        };

        stats.history.push(log);

        // Keep only last 100 entries to avoid localStorage bloat
        if (stats.history.length > 100) {
            stats.history = stats.history.slice(-100);
        }

        this.saveStats(stats);
    }

    /**
     * Get current usage statistics
     */
    public getUsageStats(): UsageStats {
        return this.getStats();
    }

    /**
     * Check if we should block the next request due to limits
     */
    public shouldBlockRequest(): boolean {
        const stats = this.getStats();
        return stats.dailyRequests >= stats.dailyLimit;
    }

    /**
     * Get current usage status based on thresholds
     */
    public getUsageStatus(): UsageStatus {
        const stats = this.getStats();
        const percentage = stats.dailyRequests / stats.dailyLimit;

        if (percentage >= 1) return 'exceeded';
        if (percentage >= API_LIMITS.CRITICAL_THRESHOLD) return 'critical';
        if (percentage >= API_LIMITS.WARNING_THRESHOLD) return 'warning';
        return 'ok';
    }

    /**
     * Manually reset daily statistics (for testing or admin purposes)
     */
    public resetDailyStats(): void {
        this.saveStats(this.createFreshStats());
    }

    /**
     * Get usage percentage (0-1)
     */
    public getUsagePercentage(): number {
        const stats = this.getStats();
        return Math.min(stats.dailyRequests / stats.dailyLimit, 1);
    }

    /**
     * Get formatted cost in BRL (approximate conversion)
     */
    public getFormattedCost(usdToBorl: number = 5.0): string {
        const stats = this.getStats();
        const costBRL = stats.estimatedCost * usdToBorl;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(costBRL);
    }
}

// Export singleton instance
export const usageMonitor = new UsageMonitorService();
