import React from 'react';
import { QualityRating, QualityInfo } from '../types/cv';

interface CVQualityBadgeProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

// Map numeric score to quality rating
export function getQualityFromScore(score: number): QualityInfo {
    if (score >= 90) {
        return {
            rating: 'excellent',
            label: 'Excelente',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/20 border-emerald-500/30'
        };
    } else if (score >= 80) {
        return {
            rating: 'very_good',
            label: 'Muito Bom',
            color: 'text-teal-400',
            bgColor: 'bg-teal-500/20 border-teal-500/30'
        };
    } else if (score >= 70) {
        return {
            rating: 'good',
            label: 'Bom',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20 border-blue-500/30'
        };
    } else if (score >= 60) {
        return {
            rating: 'fair',
            label: 'Regular',
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20 border-yellow-500/30'
        };
    } else {
        return {
            rating: 'needs_improvement',
            label: 'Precisa Melhorar',
            color: 'text-rose-400',
            bgColor: 'bg-rose-500/20 border-rose-500/30'
        };
    }
}

export const CVQualityBadge: React.FC<CVQualityBadgeProps> = ({
    score,
    size = 'md',
    showLabel = true
}) => {
    const quality = getQualityFromScore(score);

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    return (
        <div className={`inline-flex items-center gap-2 rounded-full border ${quality.bgColor} ${sizeClasses[size]}`}>
            <div className={`w-2 h-2 rounded-full ${quality.color.replace('text-', 'bg-')}`}></div>
            {showLabel && (
                <span className={`font-bold ${quality.color}`}>
                    {quality.label}
                </span>
            )}
        </div>
    );
};
